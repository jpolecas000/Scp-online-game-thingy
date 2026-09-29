import React from 'react';
import { useGameStore } from './game/gameStore.js';
import FactionSelect from './components/FactionSelect.jsx';
import GameView from './components/GameView.jsx';

export default function App() {
  const phase = useGameStore(s => s.phase);

  return (
    <div className="app">
      {phase === 'select' ? <FactionSelect /> : <GameView />}
    </div>
  );
}
