import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../game/gameStore.js';
import { gameState, updateGame } from '../game/gameState.js';
import { inputState } from '../game/inputState.js';
import { CELL_SIZE, GRID_SIZE, generateFacility } from '../game/facility.js';
import HUD from './HUD.jsx';
import DialogueUI from './DialogueUI.jsx';
import EventLog from './EventLog.jsx';
import TouchControls from './TouchControls.jsx';

// MakeCode Arcade style: low-res pixel-art canvas, scaled up
const INTERNAL_W = 320;
const INTERNAL_H = 240;
const TILE_PX = 16;

const ZONE_FLOOR = {
  'class-d': '#2a1f0a',
  'scientific': '#2a2a14',
  'security': '#142838',
  'mtf': '#142a1a',
  'medical': '#2a1422',
  'containment': '#2a1414',
  'admin': '#2a2214',
  'common': '#1e1e1e',
  'intel': '#1a1428',
};

const ZONE_ACCENT = {
  'class-d': '#d4a017',
  'scientific': '#f0e68c',
  'security': '#4a90d9',
  'mtf': '#2d6a4f',
  'medical': '#e84393',
  'containment': '#e63946',
  'admin': '#fdcb6e',
  'common': '#636e72',
  'intel': '#6c5ce7',
};

const ROOM_LABELS = {
  'class-d': 'D-CELLS',
  'scientific': 'LABS',
  'security': 'SECURITY',
  'mtf': 'MTF',
  'medical': 'MED BAY',
  'containment': 'CONTAIN',
  'admin': 'ADMIN',
  'common': 'COMMON',
  'intel': 'INTEL',
};

// Pre-compute zone lookup grid (which zone each tile belongs to)
let zoneGrid = null;
function getZoneGrid() {
  if (zoneGrid) return zoneGrid;
  const { rooms } = generateFacility();
  zoneGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
          zoneGrid[y][x] = room.zone;
        }
      }
    }
  }
  return zoneGrid;
}

export default function GameView2D() {
  const canvasRef = useRef(null);
  const ePressedRef = useRef(false);
  const [isTouch, setIsTouch] = useState(false);

  const activeDialogue = useGameStore(s => s.activeDialogue);
  const backToFactionSelect = useGameStore(s => s.backToFactionSelect);

  useEffect(() => {
    setIsTouch(window.matchMedia?.('(pointer: coarse)')?.matches ?? false);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e) => {
      const store = useGameStore.getState();
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': inputState.forward = true; break;
        case 'KeyS': case 'ArrowDown': inputState.backward = true; break;
        case 'KeyA': case 'ArrowLeft': inputState.left = true; break;
        case 'KeyD': case 'ArrowRight': inputState.right = true; break;
        case 'KeyE':
          if (!ePressedRef.current && !store.activeDialogue && gameState.nearbyNPCId) {
            ePressedRef.current = true;
            store.startDialogue();
          }
          break;
        case 'Escape':
          if (store.activeDialogue) store.endDialogue();
          break;
      }
    };

    const onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': inputState.forward = false; break;
        case 'KeyS': case 'ArrowDown': inputState.backward = false; break;
        case 'KeyA': case 'ArrowLeft': inputState.left = false; break;
        case 'KeyD': case 'ArrowRight': inputState.right = false; break;
        case 'KeyE': ePressedRef.current = false; break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Game loop + 2D canvas renderer
  useEffect(() => {
    let raf;
    let lastTime = performance.now();
    let syncAccum = 0;
    const zg = getZoneGrid();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      updateGame(dt, inputState);

      syncAccum += dt;
      if (syncAccum > 0.15) {
        syncAccum = 0;
        useGameStore.getState().syncFromGameState();
      }

      render();
      raf = requestAnimationFrame(loop);
    };

    function render() {
      const canvas = canvasRef.current;
      if (!canvas || !gameState.initialized) return;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      // Camera centered on player (grid-space coordinates)
      const camX = gameState.player.x / CELL_SIZE;
      const camY = gameState.player.z / CELL_SIZE;
      const halfTW = INTERNAL_W / (2 * TILE_PX);
      const halfTH = INTERNAL_H / (2 * TILE_PX);
      const startCol = Math.floor(camX - halfTW) - 1;
      const endCol = Math.ceil(camX + halfTW) + 1;
      const startRow = Math.floor(camY - halfTH) - 1;
      const endRow = Math.ceil(camY + halfTH) + 1;

      // Clear
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

      // --- Tiles ---
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) continue;
          const sx = Math.floor((col - camX) * TILE_PX + INTERNAL_W / 2);
          const sy = Math.floor((row - camY) * TILE_PX + INTERNAL_H / 2);

          if (gameState.grid[row][col] === 0) {
            // Floor
            const zone = zg[row][col];
            ctx.fillStyle = zone ? ZONE_FLOOR[zone] || '#1e1e1e' : '#1e1e1e';
            ctx.fillRect(sx, sy, TILE_PX, TILE_PX);
            // Sparse accent dots for texture
            if (zone && (col * 7 + row * 3) % 5 === 0) {
              ctx.fillStyle = ZONE_ACCENT[zone] || '#444';
              ctx.globalAlpha = 0.12;
              ctx.fillRect(sx + 6, sy + 6, 2, 2);
              ctx.globalAlpha = 1;
            }
          } else {
            // Wall
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(sx, sy, TILE_PX, TILE_PX);
            ctx.fillStyle = '#333355';
            ctx.fillRect(sx, sy, TILE_PX, 2);
            ctx.fillStyle = '#0a0a16';
            ctx.fillRect(sx, sy + TILE_PX - 2, TILE_PX, 2);
          }
        }
      }

      // --- Room labels ---
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      for (const room of gameState.rooms) {
        const rcx = room.x + room.w / 2;
        const rcy = room.y + room.h / 2;
        if (rcx < startCol || rcx > endCol || rcy < startRow || rcy > endRow) continue;
        const sx = Math.floor((rcx - camX) * TILE_PX + INTERNAL_W / 2);
        const sy = Math.floor((rcy - camY) * TILE_PX + INTERNAL_H / 2);
        ctx.fillStyle = ZONE_ACCENT[room.zone] || '#666';
        ctx.globalAlpha = 0.35;
        ctx.fillText(ROOM_LABELS[room.zone] || room.name, sx, sy);
        ctx.globalAlpha = 1;
      }

      // --- SCPs ---
      for (const scp of gameState.scps) {
        const sx = Math.floor((scp.worldX / CELL_SIZE - camX) * TILE_PX + INTERNAL_W / 2);
        const sy = Math.floor((scp.worldZ / CELL_SIZE - camY) * TILE_PX + INTERNAL_H / 2);
        if (sx < -TILE_PX || sx > INTERNAL_W + TILE_PX || sy < -TILE_PX || sy > INTERNAL_H + TILE_PX) continue;

        if (scp.contained) {
          // Containment pod: colored square with dark center
          ctx.fillStyle = scp.color;
          ctx.fillRect(sx - 4, sy - 4, 8, 8);
          ctx.fillStyle = '#000';
          ctx.fillRect(sx - 2, sy - 2, 4, 4);
          // Green containment indicator dots
          ctx.fillStyle = '#0a8a3a';
          ctx.fillRect(sx - 5, sy - 1, 1, 2);
          ctx.fillRect(sx + 4, sy - 1, 1, 2);
          ctx.fillRect(sx - 1, sy - 5, 2, 1);
          ctx.fillRect(sx - 1, sy + 4, 2, 1);
        } else {
          // Breached: flashing red square
          const flash = Math.floor(gameState.time * 6) % 2;
          ctx.fillStyle = flash ? '#ff0000' : scp.color;
          ctx.fillRect(sx - 5, sy - 5, 10, 10);
          ctx.fillStyle = '#ffff00';
          ctx.fillRect(sx - 2, sy - 2, 4, 4);
        }
      }

      // --- NPCs ---
      for (const npc of gameState.npcs) {
        const sx = Math.floor((npc.x / CELL_SIZE - camX) * TILE_PX + INTERNAL_W / 2);
        const sy = Math.floor((npc.z / CELL_SIZE - camY) * TILE_PX + INTERNAL_H / 2);
        if (sx < -TILE_PX || sx > INTERNAL_W + TILE_PX || sy < -TILE_PX || sy > INTERNAL_H + TILE_PX) continue;

        // Body
        ctx.fillStyle = npc.factionColor;
        ctx.fillRect(sx - 3, sy - 2, 6, 5);
        // Head
        ctx.fillStyle = '#cdb89a';
        ctx.fillRect(sx - 2, sy - 4, 4, 3);
      }

      // --- Player ---
      const p = gameState.player;
      const px = Math.floor((p.x / CELL_SIZE - camX) * TILE_PX + INTERNAL_W / 2);
      const py = Math.floor((p.z / CELL_SIZE - camY) * TILE_PX + INTERNAL_H / 2);

      // Body
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 4, py - 3, 8, 6);
      // Head
      ctx.fillStyle = '#ffcc66';
      ctx.fillRect(px - 3, py - 5, 6, 3);
      // Direction indicator
      ctx.fillStyle = '#00ff00';
      const dirX = Math.round(Math.cos(p.facing) * 7);
      const dirY = Math.round(Math.sin(p.facing) * 7);
      ctx.fillRect(px + dirX - 1, py + dirY - 1, 2, 2);

      // --- Nearby NPC interaction indicator ---
      if (gameState.nearbyNPCId) {
        const nearby = gameState.npcs.find(n => n.id === gameState.nearbyNPCId);
        if (nearby) {
          const nx = Math.floor((nearby.x / CELL_SIZE - camX) * TILE_PX + INTERNAL_W / 2);
          const ny = Math.floor((nearby.z / CELL_SIZE - camY) * TILE_PX + INTERNAL_H / 2);
          const pulse = Math.floor(gameState.time * 4) % 2;
          if (pulse) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 1;
            ctx.strokeRect(nx - 6, ny - 6, 12, 12);
          }
          // "!" indicator
          ctx.fillStyle = '#ffff00';
          ctx.fillRect(nx - 1, ny - 9, 2, 4);
          ctx.fillRect(nx - 1, ny - 4, 2, 2);
        }
      }
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={INTERNAL_W}
        height={INTERNAL_H}
        className="game-canvas"
      />
      <HUD />
      <DialogueUI />
      <EventLog />
      <button className="back-btn" onClick={backToFactionSelect}>← Faction</button>
      {isTouch && !activeDialogue && <TouchControls />}
      {!isTouch && !activeDialogue && (
        <div className="controls-hint-2d">
          <span><b>WASD</b> Move</span>
          <span><b>E</b> Talk</span>
          <span><b>Esc</b> Close</span>
        </div>
      )}
    </div>
  );
}
