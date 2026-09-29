import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { CELL_SIZE, WALL_HEIGHT, GRID_SIZE } from '../game/facility.js';

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

export default function Facility3D({ facility }) {
  const { rooms, wallPositions } = facility;
  const wallRef = useRef(null);

  const facilitySize = GRID_SIZE * CELL_SIZE;
  const center = facilitySize / 2;

  useLayoutEffect(() => {
    if (!wallRef.current) return;
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < wallPositions.length; i++) {
      const { x, y } = wallPositions[i];
      matrix.setPosition(
        x * CELL_SIZE + CELL_SIZE / 2,
        WALL_HEIGHT / 2,
        y * CELL_SIZE + CELL_SIZE / 2
      );
      wallRef.current.setMatrixAt(i, matrix);
    }
    wallRef.current.instanceMatrix.needsUpdate = true;
  }, [wallPositions]);

  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center, 0, center]} receiveShadow>
        <planeGeometry args={[facilitySize, facilitySize]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[center, WALL_HEIGHT, center]}>
        <planeGeometry args={[facilitySize, facilitySize]} />
        <meshStandardMaterial color="#252525" roughness={0.95} />
      </mesh>

      {/* Room floor markers */}
      {rooms.map(room => {
        const color = ZONE_COLORS[room.zone] || '#444';
        return (
          <mesh
            key={room.id}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[
              room.x * CELL_SIZE + room.w * CELL_SIZE / 2,
              0.02,
              room.y * CELL_SIZE + room.h * CELL_SIZE / 2,
            ]}
          >
            <planeGeometry args={[room.w * CELL_SIZE - 0.2, room.h * CELL_SIZE - 0.2]} />
            <meshStandardMaterial color={color} transparent opacity={0.12} />
          </mesh>
        );
      })}

      {/* Room name labels (simple colored strips at room edges) */}
      {rooms.map(room => {
        const color = ZONE_COLORS[room.zone] || '#444';
        return (
          <mesh
            key={`label-${room.id}`}
            position={[
              room.x * CELL_SIZE + room.w * CELL_SIZE / 2,
              WALL_HEIGHT - 0.5,
              room.y * CELL_SIZE + 0.3,
            ]}
          >
            <boxGeometry args={[room.w * CELL_SIZE * 0.6, 0.15, 0.1]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
        );
      })}

      {/* Walls */}
      <instancedMesh
        ref={wallRef}
        args={[undefined, undefined, wallPositions.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </instancedMesh>
    </>
  );
}
