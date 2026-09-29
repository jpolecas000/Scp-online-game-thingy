import React from 'react';
import { useGameStore } from '../game/gameStore.js';

export default function EventLog() {
  const notifications = useGameStore(s => s.notifications);
  const dismiss = useGameStore(s => s.dismissNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="event-log">
      {notifications.map(notif => (
        <div key={notif.id} className="event-notification" onClick={() => dismiss(notif.id)}>
          <h4>{notif.title}</h4>
          <p>{notif.description}</p>
        </div>
      ))}
    </div>
  );
}
