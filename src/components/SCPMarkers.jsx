import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { gameState } from '../game/gameState.js';

export default function SCPMarkers() {
  const meshesRef = useRef([]);
  const ringsRef = useRef([]);

  useFrame(() => {
    for (let i = 0; i < gameState.scps.length; i++) {
      const scp = gameState.scps[i];
      const mesh = meshesRef.current[i];
      const ring = ringsRef.current[i];

      if (mesh) {
        const color = scp.contained ? scp.color : '#ff0000';
        mesh.material.color.set(color);
        mesh.material.emissive.set(color);
        mesh.material.emissiveIntensity = scp.contained ? 0.15 : 0.7;
      }

      if (ring) {
        const ringColor = scp.contained ? '#00aa44' : '#ff0000';
        ring.material.color.set(ringColor);
        ring.material.emissive.set(ringColor);
        ring.material.emissiveIntensity = scp.contained ? 0.3 : 0.8;
      }
    }
  });

  return (
    <>
      {gameState.scps.map((scp, i) => (
        <React.Fragment key={scp.id}>
          {/* Containment ring on floor */}
          <mesh
            ref={el => ringsRef.current[i] = el}
            position={[scp.worldX, 0.06, scp.worldZ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.7, 1.1, 20]} />
            <meshStandardMaterial color="#00aa44" emissive="#00aa44" emissiveIntensity={0.3} transparent opacity={0.7} />
          </mesh>
          {/* SCP containment pod */}
          <mesh
            ref={el => meshesRef.current[i] = el}
            position={[scp.worldX, 1, scp.worldZ]}
          >
            <cylinderGeometry args={[0.5, 0.6, 1.8, 8]} />
            <meshStandardMaterial color={scp.color} emissive={scp.color} emissiveIntensity={0.15} roughness={0.6} />
          </mesh>
        </React.Fragment>
      ))}
    </>
  );
}
