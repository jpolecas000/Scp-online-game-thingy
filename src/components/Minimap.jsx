import React, { useRef, useEffect } from 'react';
import { gameState } from '../game/gameState.js';
import { GRID_SIZE, CELL_SIZE } from '../game/facility.js';

export default function Minimap() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let raf;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas || !gameState.initialized) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const ctx = canvas.getContext('2d');
      const size = canvas.width;
      const scale = size / (GRID_SIZE * CELL_SIZE);

      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, size, size);

      // Draw walkable cells
      ctx.fillStyle = '#1e1e2e';
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (gameState.grid[y][x] === 0) {
            ctx.fillRect(
              x * CELL_SIZE * scale,
              y * CELL_SIZE * scale,
              CELL_SIZE * scale + 0.5,
              CELL_SIZE * scale + 0.5
            );
          }
        }
      }

      // Draw NPCs
      for (const npc of gameState.npcs) {
        ctx.fillStyle = npc.factionColor;
        ctx.beginPath();
        ctx.arc(npc.x * scale, npc.z * scale, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw SCPs (contained = green, breached = red)
      const containmentRoom = gameState.rooms?.find(r => r.zone === 'containment');
      if (containmentRoom) {
        const cx = (containmentRoom.x + containmentRoom.w / 2) * CELL_SIZE * scale;
        const cy = (containmentRoom.y + containmentRoom.h / 2) * CELL_SIZE * scale;
        ctx.fillStyle = gameState.breachActive ? '#e63946' : '#2d6a4f';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw player
      const p = gameState.player;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x * scale, p.z * scale, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw player direction arrow
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x * scale, p.z * scale);
      ctx.lineTo(
        p.x * scale + (-Math.sin(p.yaw)) * 8,
        p.z * scale + (-Math.cos(p.yaw)) * 8
      );
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="minimap-container">
      <span className="minimap-label">MAP</span>
      <canvas ref={canvasRef} width={180} height={180} />
    </div>
  );
}
