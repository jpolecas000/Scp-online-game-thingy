import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '../game/gameStore.js';
import { gameState } from '../game/gameState.js';
import { inputState } from '../game/inputState.js';
import Scene from './Scene.jsx';
import HUD from './HUD.jsx';
import DialogueUI from './DialogueUI.jsx';
import Minimap from './Minimap.jsx';
import EventLog from './EventLog.jsx';

export default function GameView() {
  const containerRef = useRef(null);
  const ePressedRef = useRef(false);
  const [pointerLocked, setPointerLocked] = useState(false);

  const activeDialogue = useGameStore(s => s.activeDialogue);
  const backToFactionSelect = useGameStore(s => s.backToFactionSelect);

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
            document.exitPointerLock();
          }
          break;
        case 'Escape':
          if (store.activeDialogue) {
            store.endDialogue();
          }
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

    const onMouseMove = (e) => {
      if (document.pointerLockElement) {
        inputState.mouseDX += e.movementX;
        inputState.mouseDY += e.movementY;
      }
    };

    const onPointerLockChange = () => {
      setPointerLocked(!!document.pointerLockElement);
    };

    const onCanvasClick = () => {
      const store = useGameStore.getState();
      if (!store.activeDialogue && !document.pointerLockElement) {
        containerRef.current?.requestPointerLock();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const container = containerRef.current;
    if (container) container.addEventListener('click', onCanvasClick);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      if (container) container.removeEventListener('click', onCanvasClick);
    };
  }, []);

  return (
    <div className="game-container" ref={containerRef}>
      <Canvas shadows={{ enabled: false }}>
        <Scene />
      </Canvas>
      <HUD />
      <DialogueUI />
      <Minimap />
      <EventLog />
      <button className="back-btn" onClick={backToFactionSelect} style={{
        position: 'absolute', top: '16px', right: '200px', zIndex: 30,
        background: 'rgba(0,0,0,0.7)', border: '1px solid #444', borderRadius: '6px',
        padding: '6px 12px', color: '#aaa', fontSize: '11px', cursor: 'pointer', pointerEvents: 'auto',
      }}>← Change Faction</button>
      {!pointerLocked && !activeDialogue && (
        <div className="click-to-play" onClick={() => containerRef.current?.requestPointerLock()}>
          <div className="click-to-play-content">
            <h2>CLICK TO PLAY</h2>
            <p>Click to lock your mouse and enter first-person mode.</p>
            <div className="controls-hint">
              <div className="key-hint"><span className="key">W A S D</span> Move</div>
              <div className="key-hint"><span className="key">Mouse</span> Look</div>
              <div className="key-hint"><span className="key">E</span> Talk</div>
              <div className="key-hint"><span className="key">Esc</span> Release</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
