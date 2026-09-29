import React, { useRef, useEffect } from 'react';
import { inputState } from '../game/inputState.js';
import { gameState } from '../game/gameState.js';
import { useGameStore } from '../game/gameStore.js';

export default function TouchControls() {
  const joystickRef = useRef(null);
  const thumbRef = useRef(null);
  const joystickTouchId = useRef(null);
  const joystickCenter = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const joystick = joystickRef.current;
    if (!joystick) return;

    const onStart = (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      joystickTouchId.current = touch.identifier;
      const rect = joystick.getBoundingClientRect();
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    const onMove = (e) => {
      e.preventDefault();
      for (const touch of e.touches) {
        if (touch.identifier !== joystickTouchId.current) continue;
        const dx = touch.clientX - joystickCenter.current.x;
        const dy = touch.clientY - joystickCenter.current.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = 40;
        const clampedDist = Math.min(dist, maxDist);
        const ratio = dist > 0 ? clampedDist / maxDist : 0;
        const nx = dist > 0 ? (dx / dist) * ratio : 0;
        const ny = dist > 0 ? (dy / dist) * ratio : 0;

        inputState.forward = ny < -0.3;
        inputState.backward = ny > 0.3;
        inputState.left = nx < -0.3;
        inputState.right = nx > 0.3;

        if (thumbRef.current) {
          const tx = dist > 0 ? (dx / dist) * clampedDist : 0;
          const ty = dist > 0 ? (dy / dist) * clampedDist : 0;
          thumbRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
        }
      }
    };

    const onEnd = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier !== joystickTouchId.current) continue;
        joystickTouchId.current = null;
        inputState.forward = false;
        inputState.backward = false;
        inputState.left = false;
        inputState.right = false;
        if (thumbRef.current) thumbRef.current.style.transform = 'translate(0, 0)';
      }
    };

    joystick.addEventListener('touchstart', onStart, { passive: false });
    joystick.addEventListener('touchmove', onMove, { passive: false });
    joystick.addEventListener('touchend', onEnd, { passive: false });
    joystick.addEventListener('touchcancel', onEnd, { passive: false });

    return () => {
      joystick.removeEventListener('touchstart', onStart);
      joystick.removeEventListener('touchmove', onMove);
      joystick.removeEventListener('touchend', onEnd);
      joystick.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  const handleInteract = () => {
    const store = useGameStore.getState();
    if (!store.activeDialogue && gameState.nearbyNPCId) {
      store.startDialogue();
    }
  };

  return (
    <div className="touch-controls">
      <div className="joystick-base" ref={joystickRef}>
        <div className="joystick-thumb" ref={thumbRef} />
      </div>
      <button className="interact-btn" onTouchStart={(e) => { e.preventDefault(); handleInteract(); }} onClick={handleInteract}>
        E
      </button>
    </div>
  );
}
