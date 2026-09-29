// SCP entity definitions

export const SCPS = [
  {
    id: 'scp-173',
    name: 'SCP-173',
    nickname: 'The Sculpture',
    description: 'A concrete statue that moves when unobserved. It snaps necks. It must be kept under constant visual surveillance.',
    containmentZone: 'containment',
    breachChance: 0.3,
    dangerLevel: 'high',
    color: '#8B4513',
  },
  {
    id: 'scp-049',
    name: 'SCP-049',
    nickname: 'The Plague Doctor',
    description: 'A humanoid figure resembling a medieval plague doctor. It seeks to "cure" those it touches, turning them into zombies.',
    containmentZone: 'containment',
    breachChance: 0.2,
    dangerLevel: 'high',
    color: '#2c2c2c',
  },
  {
    id: 'scp-096',
    name: 'SCP-096',
    nickname: 'The Shy Guy',
    description: 'A tall, emaciated humanoid that becomes extremely aggressive when someone views its face. It will pursue and kill the viewer.',
    containmentZone: 'containment',
    breachChance: 0.15,
    dangerLevel: 'extreme',
    color: '#d0d0d0',
  },
  {
    id: 'scp-106',
    name: 'SCP-106',
    nickname: 'The Old Man',
    description: 'An elderly humanoid that moves through solid matter. It drags victims into a pocket dimension. Extremely difficult to contain.',
    containmentZone: 'containment',
    breachChance: 0.1,
    dangerLevel: 'extreme',
    color: '#3a3a3a',
  },
  {
    id: 'scp-914',
    name: 'SCP-914',
    nickname: 'The Clockworks',
    description: 'A large clockwork machine that can refine objects placed inside it. It operates on five settings from "Rough" to "Fine".',
    containmentZone: 'containment',
    breachChance: 0.05,
    dangerLevel: 'low',
    color: '#c0a060',
  },
];

export const SCP_MAP = Object.fromEntries(SCPS.map(s => [s.id, s]));
