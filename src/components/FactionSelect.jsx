import React from 'react';
import { useGameStore } from '../game/gameStore.js';
import { FACTIONS } from '../game/factions.js';

export default function FactionSelect() {
  const selectFaction = useGameStore(s => s.selectFaction);
  const [selected, setSelected] = React.useState(null);

  return (
    <div className="faction-select">
      <div className="faction-select-header">
        <h1>SCP: FACILITY ROLEPLAY</h1>
        <p>Select your faction. You will spawn as its 11th member alongside 10 AI teammates.</p>
      </div>
      <div className="faction-grid">
        {FACTIONS.map(f => (
          <div
            key={f.id}
            className={`faction-card ${selected === f.id ? 'selected' : ''}`}
            style={{ borderColor: f.color }}
            onClick={() => setSelected(f.id)}
          >
            <div className="faction-card-bar" style={{ background: f.color }} />
            <div className="faction-card-body">
              <h3 style={{ color: f.color }}>{f.name}</h3>
              <span className="faction-role">{f.role}</span>
              <p>{f.description}</p>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <div className="faction-select-footer">
          <div className="selected-info">
            <span style={{ color: FACTIONS.find(f => f.id === selected)?.color }}>
              Selected: {FACTIONS.find(f => f.id === selected)?.name}
            </span>
          </div>
          <button className="spawn-btn" onClick={() => selectFaction(selected)}>
            DEPLOY TO FACILITY
          </button>
        </div>
      )}
    </div>
  );
}
