// A* pathfinding on the facility grid

import { GRID_SIZE, isWalkable } from './facility.js';

const DIRS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41],
];

function heuristic(c1, r1, c2, r2) {
  const dx = Math.abs(c1 - c2);
  const dy = Math.abs(r1 - r2);
  return Math.max(dx, dy) + 0.41 * Math.min(dx, dy);
}

export function findPath(grid, startCol, startRow, endCol, endRow, maxNodes = 2000) {
  if (startCol === endCol && startRow === endRow) return [];
  if (!isWalkable(grid, endCol, endRow)) return null;

  const startKey = startCol + ',' + startRow;
  const endKey = endCol + ',' + endRow;

  const openSet = new Map();
  const closedSet = new Set();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(startCol, startRow, endCol, endRow));
  openSet.set(startKey, [startCol, startRow]);

  let processed = 0;

  while (openSet.size > 0 && processed < maxNodes) {
    processed++;

    // Find lowest fScore in openSet
    let currentKey = null;
    let currentF = Infinity;
    let currentCol = 0, currentRow = 0;
    for (const [key, [c, r]] of openSet) {
      const f = fScore.get(key) ?? Infinity;
      if (f < currentF) {
        currentF = f;
        currentKey = key;
        currentCol = c;
        currentRow = r;
      }
    }

    if (currentKey === endKey) {
      // Reconstruct path
      const path = [];
      let key = currentKey;
      while (key && key !== startKey) {
        const [c, r] = key.split(',').map(Number);
        path.unshift({ col: c, row: r });
        key = cameFrom.get(key);
      }
      return path;
    }

    openSet.delete(currentKey);
    closedSet.add(currentKey);

    for (const [dc, dr, cost] of DIRS) {
      const nc = currentCol + dc;
      const nr = currentRow + dr;
      if (!isWalkable(grid, nc, nr)) continue;

      // Prevent diagonal corner-cutting
      if (dc !== 0 && dr !== 0) {
        if (!isWalkable(grid, currentCol + dc, currentRow) && !isWalkable(grid, currentCol, currentRow + dr)) continue;
      }

      const nKey = nc + ',' + nr;
      if (closedSet.has(nKey)) continue;

      const tentativeG = (gScore.get(currentKey) ?? 0) + cost;
      if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
        cameFrom.set(nKey, currentKey);
        gScore.set(nKey, tentativeG);
        fScore.set(nKey, tentativeG + heuristic(nc, nr, endCol, endRow));
        if (!openSet.has(nKey)) openSet.set(nKey, [nc, nr]);
      }
    }
  }

  return null; // No path found
}
