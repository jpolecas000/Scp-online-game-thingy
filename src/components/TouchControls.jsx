import React, { useRef, useEffect } from 'react';
import { inputState } from '../game/inputState.js';
import { gameState } from '../game/gameState.js';
import { useGameStore } from '../game/gameStore.js';

export default function TouchControls() {
  const joystickRef = useRef(null);
  const lookAreaRef = useRef(null);
  const thumbRef = useRef(null);
  const joystickTouchId = useRef(null);
  const lookTouchId = useRef(null);
  const joystickCenter = useRef({ x: 0, y: 0 });
  const lookStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const joystick = joystickRef.current;
    const lookArea = lookAreaRef.current;
    if (!joystick || !lookArea) return;

    const onJoystickStart = (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      joystickTouchId.current = touch.identifier;
      const rect = joystick.getBoundingClientRect();
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    const onJoystickMove = (e) => {
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

    const onJoystickEnd = (e) => {
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

    const onLookStart = (e) => {
      if (lookTouchId.current !== null) return;
      const touch = e.changedTouches[0];
      lookTouchId.current = touch.identifier;
      lookStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const onLookMove = (e) => {
      for (const touch of e.touches) {
        if (touch.identifier !== lookTouchId.current) continue;
        const dx = touch.clientX - lookStart.current.x;
        const dy = touch.clientY - lookStart.current.y;
        inputState.mouseDX += dx * 0.4;
        inputState.mouseDY += dy * 0.4;
        lookStart.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const onLookEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === lookTouchId.current) {
          lookTouchId.current = null;
        }
      }
    };

    joystick.addEventListener('touchstart', onJoystickStart, { passive: false });
    joystick.addEventListener('touchmove', onJoystickMove, { passive: false });
    joystick.addEventListener('touchend', onJoystickEnd, { passive: false });
    joystick.addEventListener('touchcancel', onJoystickEnd, { passive: false });
    lookArea.addEventListener('touchstart', onLookStart, { passive: false });
    lookArea.addEventListener('touchmove', onLookMove, { passive: false });
    lookArea.addEventListener('touchend', onLookEnd, { passive: false });
    lookArea.addEventListener('touchcancel', onLookEnd, { passive: false });

    return () => {
      joystick.removeEventListener('touchstart', onJoystickStart);
      joystick.removeEventListener('touchmove', onJoystickMove);
      joystick.removeEventListener('touchend', onJoystickEnd);
      joystick.removeEventListener('touchcancel', onJoystickEnd);
      lookArea.removeEventListener('touchstart', onLookStart);
      lookArea.removeEventListener('touchmove', onLookMove);
      lookArea.removeEventListener('touchend', onLookEnd);
      lookArea.removeEventListener('touchcancel', onLookEnd);
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
      <div className="look-area" ref={lookAreaRef} />
      <div className="joystick-base" ref={joystickRef}>
        <div className="joystick-thumb" ref={thumbRef} />
      </div>
      <button className="interact-btn" onTouchStart={(e) => { e.preventDefault(); handleInteract(); }} onClick={handleInteract}>
        E
      </button>
    </div>
  );
}
