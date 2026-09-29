import React from 'react';
import { useGameStore } from '../game/gameStore.js';
import { FACTION_MAP } from '../game/factions.js';

export default function HUD() {
  const playerFaction = useGameStore(s => s.playerFaction);
  const playerHealth = useGameStore(s => s.playerHealth);
  const breachActive = useGameStore(s => s.breachActive);
  const breachSCPName = useGameStore(s => s.breachSCPName);
  const nearbyNPC = useGameStore(s => s.nearbyNPC);
  const activeDialogue = useGameStore(s => s.activeDialogue);
  const activeEvent = useGameStore(s => s.activeEvent);
  const showObjectives = useGameStore(s => s.showObjectives);
  const objectives = useGameStore(s => s.objectives);
  const toggleObjectives = useGameStore(s => s.toggleObjectives);

  if (!playerFaction) return null;
  const faction = FACTION_MAP[playerFaction];

  return (
    <div className="hud">
      {/* Top-left: faction badge + health */}
      <div className="hud-top-left">
        <div className="faction-badge">
          <div className="dot" style={{ background: faction.color }} />
          <span>{faction.name}</span>
        </div>
        <div className="health-bar">
          <span>HP</span>
          <div className="health-bar-fill">
            <div className="health-bar-fill-inner" style={{ width: `${playerHealth}%` }} />
          </div>
        </div>
      </div>

      {/* Top-center: breach alert */}
      {breachActive && (
        <div className="breach-alert">
          <h3>⚠ CONTAINMENT BREACH</h3>
          <p>{breachSCPName} — All personnel respond</p>
        </div>
      )}

      {/* Top-right: objectives toggle / panel */}
      {activeEvent && (
        showObjectives ? (
          <div className="objectives-panel">
            <h3>{activeEvent.title}</h3>
            <ul>
              {objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
            <button onClick={toggleObjectives} style={{
              background: 'none', border: 'none', color: '#666', fontSize: '11px',
              cursor: 'pointer', marginTop: '8px', padding: 0,
            }}>Hide</button>
          </div>
        ) : (
          <button className="objectives-toggle" onClick={toggleObjectives}>
            📋 Objectives
          </button>
        )
      )}

      {/* Bottom-center: interaction prompt */}
      {nearbyNPC && !activeDialogue && (
        <div className="interaction-prompt">
          <span className="key">E</span>
          <span>Talk to {nearbyNPC.name} ({FACTION_MAP[nearbyNPC.faction]?.shortName})</span>
        </div>
      )}
    </div>
  );
}
