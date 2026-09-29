// Facility layout: grid-based rooms and corridors for 3D rendering and navigation

export const CELL_SIZE = 3;
export const WALL_HEIGHT = 4;
export const GRID_SIZE = 50;

// Room definitions: { id, name, x, y, w, h, zone }
// x, y = top-left corner in grid coords; w, h = size in cells
export const ROOMS = [
  { id: 'class-d',     name: 'Class-D Cells',       x: 2,  y: 2,  w: 11, h: 9,  zone: 'class-d' },
  { id: 'scientific',  name: 'Scientific Labs',     x: 2,  y: 15, w: 13, h: 11, zone: 'scientific' },
  { id: 'security',    name: 'Security Station',    x: 19, y: 11, w: 11, h: 9,  zone: 'security' },
  { id: 'mtf',         name: 'MTF Barracks',        x: 36, y: 2,  w: 11, h: 14, zone: 'mtf' },
  { id: 'medical',     name: 'Medical Bay',         x: 36, y: 22, w: 11, h: 11, zone: 'medical' },
  { id: 'containment', name: 'Containment Wing',    x: 19, y: 24, w: 13, h: 12, zone: 'containment' },
  { id: 'admin',       name: 'Administration',     x: 36, y: 37, w: 11, h: 9,  zone: 'admin' },
  { id: 'common',      name: 'Common Area',         x: 17, y: 15, w: 14, h: 7,  zone: 'common' },
  { id: 'intel',       name: 'Intel Office',        x: 2,  y: 30, w: 11, h: 8,  zone: 'intel' },
];

// Corridors connecting room centers: [fromRoomId, toRoomId]
const CORRIDOR_CONNECTIONS = [
  ['class-d', 'common'],
  ['scientific', 'common'],
  ['security', 'common'],
  ['common', 'containment'],
  ['common', 'mtf'],
  ['mtf', 'medical'],
  ['medical', 'admin'],
  ['containment', 'medical'],
  ['intel', 'scientific'],
  ['intel', 'containment'],
];

function carveRoom(grid, room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
        grid[y][x] = 0;
      }
    }
  }
}

function carveCorridor(grid, x1, y1, x2, y2, width = 2) {
  const dx = Math.sign(x2 - x1);
  const dy = Math.sign(y2 - y1);
  const halfW = Math.floor(width / 2);

  // Horizontal segment
  let x = x1;
  while (x !== x2) {
    for (let w = -halfW; w <= halfW; w++) {
      const yy = y1 + w;
      if (yy >= 0 && yy < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
        grid[yy][x] = 0;
      }
    }
    x += dx;
  }
  // Vertical segment
  let y = y1;
  while (y !== y2) {
    for (let w = -halfW; w <= halfW; w++) {
      const xx = x2 + w;
      if (xx >= 0 && xx < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        grid[y][xx] = 0;
      }
    }
    y += dy;
  }
  // Carve the destination too
  for (let w = -halfW; w <= halfW; w++) {
    const xx = x2 + w;
    const yy = y2 + w;
    if (xx >= 0 && xx < GRID_SIZE) grid[y1][xx] = 0;
    if (yy >= 0 && yy < GRID_SIZE) grid[yy][x2] = 0;
  }
}

let cachedGrid = null;
let cachedWallPositions = null;

export function generateFacility() {
  if (cachedGrid) return { grid: cachedGrid, rooms: ROOMS, wallPositions: cachedWallPositions };

  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(1));

  // Carve rooms
  for (const room of ROOMS) {
    carveRoom(grid, room);
  }

  // Carve corridors between room centers
  const roomMap = Object.fromEntries(ROOMS.map(r => [r.id, r]));
  for (const [fromId, toId] of CORRIDOR_CONNECTIONS) {
    const r1 = roomMap[fromId];
    const r2 = roomMap[toId];
    const cx1 = r1.x + Math.floor(r1.w / 2);
    const cy1 = r1.y + Math.floor(r1.h / 2);
    const cx2 = r2.x + Math.floor(r2.w / 2);
    const cy2 = r2.y + Math.floor(r2.h / 2);
    carveCorridor(grid, cx1, cy1, cx2, cy2, 3);
  }

  // Collect wall positions for rendering
  const wallPositions = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === 1) {
        // Only include walls adjacent to floor cells (skip solid interior walls)
        let adjacentToFloor = false;
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && grid[ny][nx] === 0) {
            adjacentToFloor = true;
            break;
          }
        }
        if (adjacentToFloor) {
          wallPositions.push({ x, y });
        }
      }
    }
  }

  cachedGrid = grid;
  cachedWallPositions = wallPositions;
  return { grid, rooms: ROOMS, wallPositions };
}

export function isWalkable(grid, col, row) {
  if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return false;
  return grid[row][col] === 0;
}

export function worldToGrid(x, z) {
  return [Math.floor(x / CELL_SIZE), Math.floor(z / CELL_SIZE)];
}

export function gridToWorld(col, row) {
  return [col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2];
}

export function getRoomCenter(room) {
  return {
    col: room.x + Math.floor(room.w / 2),
    row: room.y + Math.floor(room.h / 2),
    x: (room.x + Math.floor(room.w / 2)) * CELL_SIZE + CELL_SIZE / 2,
    z: (room.y + Math.floor(room.h / 2)) * CELL_SIZE + CELL_SIZE / 2,
  };
}

export function getRoomByZone(zone) {
  return ROOMS.find(r => r.zone === zone);
}

export function getRandomWalkableCellInRoom(grid, room) {
  const attempts = 30;
  for (let i = 0; i < attempts; i++) {
    const col = room.x + Math.floor(Math.random() * room.w);
    const row = room.y + Math.floor(Math.random() * room.h);
    if (isWalkable(grid, col, row)) return { col, row };
  }
  return getRoomCenter(room);
}
