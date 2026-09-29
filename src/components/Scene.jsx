import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameState, updateGame } from '../game/gameState.js';
import { useGameStore } from '../game/gameStore.js';
import { generateFacility, CELL_SIZE, WALL_HEIGHT, GRID_SIZE } from '../game/facility.js';
import { inputState } from '../game/inputState.js';
import Facility3D from './Facility3D.jsx';

const ZONE_COLORS = {
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

export default function Scene() {
  const { camera } = useThree();
  const syncFromGameState = useGameStore(s => s.syncFromGameState);

  const facility = useMemo(() => generateFacility(), []);
  const syncTimer = useRef(0);
  const playerLightRef = useRef(null);

  const npcBodyRef = useRef(null);
  const npcHeadRef = useRef(null);
  const npcCount = gameState.npcs.length;

  // Initialize NPC instance matrices and colors
  useLayoutEffect(() => {
    if (!npcBodyRef.current || !npcHeadRef.current) return;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    for (let i = 0; i < gameState.npcs.length; i++) {
      const npc = gameState.npcs[i];
      // Body
      matrix.makeRotationY(npc.facing);
      matrix.setPosition(npc.x, 0.9, npc.z);
      npcBodyRef.current.setMatrixAt(i, matrix);
      npcBodyRef.current.setColorAt(i, color.set(npc.factionColor));

      // Head
      matrix.makeRotationY(npc.facing);
      matrix.setPosition(npc.x, 1.75, npc.z);
      npcHeadRef.current.setMatrixAt(i, matrix);
      npcHeadRef.current.setColorAt(i, color.set(0xcdb89a));
    }
    npcBodyRef.current.instanceMatrix.needsUpdate = true;
    npcHeadRef.current.instanceMatrix.needsUpdate = true;
    if (npcBodyRef.current.instanceColor) npcBodyRef.current.instanceColor.needsUpdate = true;
    if (npcHeadRef.current.instanceColor) npcHeadRef.current.instanceColor.needsUpdate = true;
  }, []);

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05);
    updateGame(dt, inputState);

    // Update camera
    const p = gameState.player;
    camera.position.set(p.x, 1.7, p.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = p.yaw;
    camera.rotation.x = p.pitch;

    // Update player light
    if (playerLightRef.current) {
      playerLightRef.current.position.set(p.x, 2.5, p.z);
    }

    // Update NPC instances
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < gameState.npcs.length; i++) {
      const npc = gameState.npcs[i];
      // Body
      matrix.makeRotationY(npc.facing);
      matrix.setPosition(npc.x, 0.9, npc.z);
      npcBodyRef.current.setMatrixAt(i, matrix);

      // Head
      matrix.makeRotationY(npc.facing);
      matrix.setPosition(npc.x, 1.75, npc.z);
      npcHeadRef.current.setMatrixAt(i, matrix);
    }
    npcBodyRef.current.instanceMatrix.needsUpdate = true;
    npcHeadRef.current.instanceMatrix.needsUpdate = true;

    // Sync UI state (throttled)
    syncTimer.current += dt;
    if (syncTimer.current > 0.15) {
      syncTimer.current = 0;
      syncFromGameState();
    }
  });

  const facilitySize = GRID_SIZE * CELL_SIZE;
  const center = facilitySize / 2;

  return (
    <>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#334', '#111', 0.3]} />
      <pointLight ref={playerLightRef} intensity={2} distance={28} decay={2} color="#fff8e0" />

      {/* Room lights */}
      {facility.rooms.map((room, i) => (
        <pointLight
          key={room.id}
          position={[
            room.x * CELL_SIZE + room.w * CELL_SIZE / 2,
            WALL_HEIGHT - 0.5,
            room.y * CELL_SIZE + room.h * CELL_SIZE / 2,
          ]}
          intensity={0.4}
          distance={20}
          decay={2}
          color={ZONE_COLORS[room.zone] || '#fff'}
        />
      ))}

      <Facility3D facility={facility} />

      {/* NPC bodies */}
      <instancedMesh ref={npcBodyRef} args={[undefined, undefined, npcCount]} frustumCulled={false}>
        <capsuleGeometry args={[0.3, 1, 4, 8]} />
        <meshStandardMaterial roughness={0.8} metalness={0.1} />
      </instancedMesh>

      {/* NPC heads */}
      <instancedMesh ref={npcHeadRef} args={[undefined, undefined, npcCount]} frustumCulled={false}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </>
  );
}
