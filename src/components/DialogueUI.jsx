import React from 'react';
import { useGameStore } from '../game/gameStore.js';
import { FACTION_MAP } from '../game/factions.js';

export default function DialogueUI() {
  const activeDialogue = useGameStore(s => s.activeDialogue);
  const selectOption = useGameStore(s => s.selectDialogueOption);
  const endDialogue = useGameStore(s => s.endDialogue);

  if (!activeDialogue) return null;

  const faction = FACTION_MAP[activeDialogue.faction];
  const initial = activeDialogue.npcName.charAt(0);

  return (
    <div className="dialogue-ui">
      <div className="dialogue-header">
        <div
          className="dialogue-portrait"
          style={{ borderColor: activeDialogue.factionColor, background: activeDialogue.factionColor + '40' }}
        >
          {initial}
        </div>
        <div className="dialogue-name">
          <strong>{activeDialogue.npcName}</strong>
          <small>{faction?.name}</small>
        </div>
      </div>
      <div className="dialogue-text">{activeDialogue.currentLine}</div>
      <div className="dialogue-options">
        {activeDialogue.options.map(opt => (
          <button
            key={opt.id}
            className="dialogue-option"
            onClick={() => selectOption(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <button className="dialogue-close" onClick={endDialogue}>
        End conversation (Esc)
      </button>
    </div>
  );
}
