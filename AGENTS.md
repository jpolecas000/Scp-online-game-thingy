# SCP Facility Roleplay — Dev Guide

## Stack
- React 18 + Vite 5 + React Three Fiber (Three.js)
- Zustand for UI state; mutable `gameState` singleton for per-frame simulation data
- No backend — all simulation runs client-side

## Running
```
docker compose -f docker-compose.base44.yml up -d
```
App is on port 3000 (mapped to container port 5173). Vite dev server with HMR.

## Architecture
- `src/game/` — data definitions and simulation logic (factions, SCPs, facility grid, pathfinding, AI behavior, dialogue, narrative, game store)
- `src/components/` — React components (faction select, 3D game view, HUD, dialogue, minimap)
- `gameState.js` holds mutable per-frame data (NPC positions, player position, paths). The zustand store only holds UI-relevant state to avoid re-renders during the game loop.
- The game loop runs in a single `useFrame` inside `GameView.jsx` — updates player, AI, SCPs, and syncs to zustand for UI.

## Performance
- 140 AI NPCs: only those within ~40 units of the player get full simulation (pathfinding, state transitions). Far NPCs use simplified logic.
- A* pathfinding is staggered (max ~8 new paths per frame).
- Wall geometry is merged into a single BufferGeometry for draw-call efficiency.
