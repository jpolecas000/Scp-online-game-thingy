// Mutable game state singleton — updated per-frame, NOT React state
// This holds NPC positions, paths, player position, SCP states, etc.
// The zustand store only mirrors UI-relevant state to avoid re-renders.

import { CELL_SIZE, GRID_SIZE, generateFacility, getRoomByZone, getRandomWalkableCellInRoom, gridToWorld, isWalkable } from './facility.js';
import { FACTIONS, FACTION_MAP, areHostile } from './factions.js';
import { SCPS } from './scps.js';
import { generateName, generatePersonality, generateNPCId } from './names.js';
import { findPath } from './pathfinding.js';
import { getRandomEvent } from './narrative.js';

const PLAYER_SPEED = 8; // units per second
const NPC_SPEED = 3.5;
const NPC_SPEED_BREACH = 6;
const INTERACTION_RANGE = 4; // units
const SIMULATION_RANGE = 45; // units — only simulate NPCs within this range in detail
const PATHFIND_PER_FRAME = 8;
const BREACH_INTERVAL_MIN = 120; // seconds
const BREACH_INTERVAL_MAX = 240;
const BREACH_DURATION = 120;

export const gameState = {
  initialized: false,
  playerFaction: null,
  player: {
    x: 0, z: 0,
    facing: 0,
    health: 100,
    vx: 0, vz: 0,
  },
  npcs: [],
  scps: [],
  facility: null,
  grid: null,
  rooms: null,
  wallPositions: null,
  time: 0,
  breachActive: false,
  breachTimer: 0,
  nextBreachTime: 0,
  breachSCPId: null,
  breachNPCName: null,
  activeEvent: null,
  eventTimer: 0,
  pathfindQueue: [],
  nearbyNPCId: null,
  dialogueNPCId: null,
  notifications: [],
};

export function initGameState(playerFactionId) {
  const { grid, rooms, wallPositions } = generateFacility();
  gameState.grid = grid;
  gameState.rooms = rooms;
  gameState.wallPositions = wallPositions;
  gameState.facility = { grid, rooms, wallPositions };

  // Place player in their faction's spawn zone
  const faction = FACTION_MAP[playerFactionId];
  let spawnRoom = getRoomByZone(faction.spawnZone);
  if (!spawnRoom) spawnRoom = rooms[0];
  const spawnCell = getRandomWalkableCellInRoom(grid, spawnRoom);
  const [px, pz] = gridToWorld(spawnCell.col, spawnCell.row);
  gameState.player.x = px;
  gameState.player.z = pz;
  gameState.player.facing = 0;
  gameState.player.health = 100;
  gameState.player.vx = 0;
  gameState.player.vz = 0;
  gameState.playerFaction = playerFactionId;

  // Generate 10 NPCs per faction (140 total)
  gameState.npcs = [];
  for (const f of FACTIONS) {
    const fRoom = getRoomByZone(f.spawnZone);
    for (let i = 0; i < 10; i++) {
      const cell = getRandomWalkableCellInRoom(grid, fRoom);
      const [wx, wz] = gridToWorld(cell.col, cell.row);
      const personality = generatePersonality();
      const npc = {
        id: generateNPCId(),
        name: generateName(),
        faction: f.id,
        factionColor: f.color,
        personality,
        col: cell.col,
        row: cell.row,
        x: wx,
        z: wz,
        targetX: wx,
        targetZ: wz,
        path: [],
        pathIndex: 0,
        state: 'idle',
        stateTimer: 1 + Math.random() * 4,
        speed: NPC_SPEED,
        facing: Math.random() * Math.PI * 2,
        meshRef: null,
        labelRef: null,
        homeRoom: fRoom,
        lastPathfindTime: 0,
      };
      gameState.npcs.push(npc);
    }
  }

  // Initialize SCPs with world positions
  gameState.scps = SCPS.map(scp => {
    const [worldX, worldZ] = gridToWorld(scp.position.col, scp.position.row);
    return {
      ...scp,
      contained: true,
      breachProgress: 0,
      worldX,
      worldZ,
    };
  });

  gameState.time = 0;
  gameState.breachActive = false;
  gameState.breachTimer = 0;
  gameState.nextBreachTime = BREACH_INTERVAL_MIN + Math.random() * (BREACH_INTERVAL_MAX - BREACH_INTERVAL_MIN);
  gameState.breachSCPId = null;
  gameState.breachNPCName = null;
  gameState.activeEvent = null;
  gameState.eventTimer = 0;
  gameState.pathfindQueue = [];
  gameState.nearbyNPCId = null;
  gameState.dialogueNPCId = null;
  gameState.notifications = [];

  gameState.initialized = true;
}

export function requestPath(npc, targetCol, targetRow) {
  gameState.pathfindQueue.push({ npc, targetCol, targetRow });
}

function processPathfindQueue() {
  let processed = 0;
  while (gameState.pathfindQueue.length > 0 && processed < PATHFIND_PER_FRAME) {
    const { npc, targetCol, targetRow } = gameState.pathfindQueue.shift();
    const path = findPath(gameState.grid, npc.col, npc.row, targetCol, targetRow);
    if (path && path.length > 0) {
      npc.path = path;
      npc.pathIndex = 0;
      npc.state = 'moving';
    } else {
      // Can't path, pick a new target later
      npc.state = 'idle';
      npc.stateTimer = 2 + Math.random() * 3;
    }
    processed++;
  }
}

function pickNewTarget(npc) {
  // Pick a random walkable cell — either in home room or a nearby room
  const rooms = gameState.rooms;
  let targetRoom;
  if (Math.random() < 0.6) {
    targetRoom = npc.homeRoom;
  } else {
    targetRoom = rooms[Math.floor(Math.random() * rooms.length)];
  }
  const cell = getRandomWalkableCellInRoom(gameState.grid, targetRoom);
  requestPath(npc, cell.col, cell.row);
}

function updateNPC(npc, dt) {
  const player = gameState.player;
  const distToPlayer = Math.hypot(npc.x - player.x, npc.z - player.z);
  const inSimRange = distToPlayer < SIMULATION_RANGE;

  // State machine
  if (gameState.breachActive) {
    npc.speed = NPC_SPEED_BREACH;
    // During breach, faction-specific behavior
    const faction = FACTION_MAP[npc.faction];
    if (faction.category === 'mtf' || faction.id === 'security' || faction.id === 'rapid-response') {
      // Move toward containment zone
      if (npc.state !== 'moving' || npc.path.length === 0) {
        const containmentRoom = gameState.rooms.find(r => r.zone === 'containment');
        if (containmentRoom) {
          const cell = getRandomWalkableCellInRoom(gameState.grid, containmentRoom);
          requestPath(npc, cell.col, cell.row);
        }
      }
    } else if (npc.faction === 'class-d' || npc.faction === 'chaos') {
      // Try to escape / move toward exits
      if (npc.state !== 'moving' || npc.path.length === 0) {
        if (Math.random() < 0.5) {
          const commonRoom = gameState.rooms.find(r => r.zone === 'common');
          if (commonRoom) {
            const cell = getRandomWalkableCellInRoom(gameState.grid, commonRoom);
            requestPath(npc, cell.col, cell.row);
          }
        } else {
          pickNewTarget(npc);
        }
      }
    } else if (npc.faction === 'medical') {
      // Move toward medical bay
      if (npc.state !== 'moving' || npc.path.length === 0) {
        const medRoom = gameState.rooms.find(r => r.zone === 'medical');
        if (medRoom) {
          const cell = getRandomWalkableCellInRoom(gameState.grid, medRoom);
          requestPath(npc, cell.col, cell.row);
        }
      }
    } else {
      // Other factions: continue routines but faster
      if (npc.state === 'idle' && npc.stateTimer <= 0) {
        pickNewTarget(npc);
      }
    }
  } else {
    npc.speed = NPC_SPEED;
    // Normal behavior
    if (npc.state === 'idle') {
      npc.stateTimer -= dt;
      if (npc.stateTimer <= 0) {
        pickNewTarget(npc);
      }
    }
  }

  // Movement along path
  if (npc.state === 'moving' && npc.path.length > 0 && npc.pathIndex < npc.path.length) {
    const target = npc.path[npc.pathIndex];
    const [tx, tz] = gridToWorld(target.col, target.row);
    const dx = tx - npc.x;
    const dz = tz - npc.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.5) {
      npc.col = target.col;
      npc.row = target.row;
      npc.x = tx;
      npc.z = tz;
      npc.pathIndex++;
      if (npc.pathIndex >= npc.path.length) {
        npc.path = [];
        npc.pathIndex = 0;
        npc.state = 'idle';
        npc.stateTimer = 1 + Math.random() * 4;
      }
    } else {
      const moveDist = Math.min(npc.speed * dt, dist);
      npc.x += (dx / dist) * moveDist;
      npc.z += (dz / dist) * moveDist;
      npc.facing = Math.atan2(dx, dz);
    }
  }

  // Far NPCs: simplified — just teleport to next path point occasionally
  if (!inSimRange && npc.state === 'idle' && npc.stateTimer <= 0) {
    // Already handled above
  }
}

function updateSCP(scp, dt) {
  if (!scp.contained) {
    scp.breachProgress += dt;
    if (scp.breachProgress > BREACH_DURATION) {
      // Auto-recontain
      scp.contained = true;
      scp.breachProgress = 0;
    }
  }
}

export function triggerBreach() {
  if (gameState.breachActive) return;
  const event = getRandomEvent();
  gameState.activeEvent = event;
  gameState.eventTimer = event.duration || BREACH_DURATION;

  if (event.type === 'breach') {
    const scp = gameState.scps.find(s => s.id === event.scpId);
    if (scp) {
      scp.contained = false;
      scp.breachProgress = 0;
      gameState.breachActive = true;
      gameState.breachSCPId = scp.id;
      gameState.breachNPCName = scp.name;
    }
  }

  gameState.notifications.push({
    id: Date.now(),
    title: event.title,
    description: event.description,
    timestamp: gameState.time,
  });
}

export function updateGame(dt, inputState) {
  if (!gameState.initialized) return;

  gameState.time += dt;

  // --- Player movement ---
  if (!gameState.dialogueNPCId) {
    const p = gameState.player;
    let mx = 0, mz = 0;
    if (inputState.forward) mz -= 1;
    if (inputState.backward) mz += 1;
    if (inputState.left) mx -= 1;
    if (inputState.right) mx += 1;

    // Normalize diagonal
    if (mx !== 0 && mz !== 0) {
      mx *= 0.707;
      mz *= 0.707;
    }

    const newX = p.x + mx * PLAYER_SPEED * dt;
    const newZ = p.z + mz * PLAYER_SPEED * dt;

    // Collision: per-axis
    const [ncx, ncz] = [Math.floor(newX / CELL_SIZE), Math.floor(p.z / CELL_SIZE)];
    if (isWalkable(gameState.grid, ncx, ncz)) {
      p.x = newX;
    }
    const [ncx2, ncz2] = [Math.floor(p.x / CELL_SIZE), Math.floor(newZ / CELL_SIZE)];
    if (isWalkable(gameState.grid, ncx2, ncz2)) {
      p.z = newZ;
    }

    // Update facing direction for 2D top-down movement
    if (mx !== 0 || mz !== 0) {
      p.facing = Math.atan2(mz, mx);
    }
  }

  // --- Pathfinding ---
  processPathfindQueue();

  // --- NPC updates ---
  for (const npc of gameState.npcs) {
    updateNPC(npc, dt);
  }

  // --- SCP updates ---
  for (const scp of gameState.scps) {
    updateSCP(scp, dt);
  }

  // --- Event/breach timer ---
  if (gameState.activeEvent) {
    gameState.eventTimer -= dt;
    if (gameState.breachActive) gameState.breachTimer += dt;
    if (gameState.eventTimer <= 0) {
      // End event
      if (gameState.breachActive) {
        const scp = gameState.scps.find(s => s.id === gameState.breachSCPId);
        if (scp) {
          scp.contained = true;
          scp.breachProgress = 0;
        }
        gameState.breachActive = false;
        gameState.breachTimer = 0;
        gameState.breachSCPId = null;
        gameState.breachNPCName = null;
      }
      gameState.activeEvent = null;
      gameState.nextBreachTime = gameState.time + BREACH_INTERVAL_MIN + Math.random() * (BREACH_INTERVAL_MAX - BREACH_INTERVAL_MIN);
      gameState.notifications.push({
        id: Date.now(),
        title: 'ALL CLEAR',
        description: 'The situation has been resolved. Facility operations returning to normal.',
        timestamp: gameState.time,
      });
    }
  } else {
    if (gameState.time >= gameState.nextBreachTime) {
      triggerBreach();
    }
  }

  // --- Nearby NPC detection (for interaction prompt) ---
  let nearestDist = INTERACTION_RANGE;
  let nearestId = null;
  for (const npc of gameState.npcs) {
    const d = Math.hypot(npc.x - gameState.player.x, npc.z - gameState.player.z);
    if (d < nearestDist) {
      nearestDist = d;
      nearestId = npc.id;
    }
  }
  gameState.nearbyNPCId = nearestId;
}

export function getNearbyNPC() {
  if (!gameState.nearbyNPCId) return null;
  return gameState.npcs.find(n => n.id === gameState.nearbyNPCId);
}

export function startDialogue() {
  const npc = getNearbyNPC();
  if (npc) {
    gameState.dialogueNPCId = npc.id;
    return npc;
  }
  return null;
}

export function endDialogue() {
  gameState.dialogueNPCId = null;
}

export function getDialogueNPC() {
  if (!gameState.dialogueNPCId) return null;
  return gameState.npcs.find(n => n.id === gameState.dialogueNPCId);
}
