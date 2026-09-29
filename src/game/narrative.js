// Narrative event system — emergent storylines from AI behavior and SCP incidents

import { FACTIONS } from './factions.js';
import { SCPS } from './scps.js';

const NARRATIVE_EVENTS = [
  {
    id: 'breach-173',
    type: 'breach',
    title: 'CONTAINMENT BREACH: SCP-173',
    description: 'SCP-173 has breached containment. All personnel, maintain visual contact. Do not blink. MTF Epsilon-11, deploy for re-containment.',
    trigger: () => true,
    scpId: 'scp-173',
    affectedFactions: ['security', 'mtf-epsilon11', 'mtf-nu7', 'class-d', 'medical', 'chaos'],
    objectives: [
      'Maintain visual contact with SCP-173 at all times',
      'MTF Epsilon-11: Re-contain SCP-173',
      'Security: Evacuate civilians from the containment wing',
      'Medical: Prepare for neck-trauma casualties',
    ],
    duration: 120,
  },
  {
    id: 'breach-049',
    type: 'breach',
    title: 'CONTAINMENT BREACH: SCP-049',
    description: 'SCP-049 has escaped containment. It is attempting to "cure" personnel. Avoid physical contact. MTF Beta-7, deploy with biohazard protocols.',
    trigger: () => true,
    scpId: 'scp-049',
    affectedFactions: ['mtf-beta7', 'security', 'medical', 'class-d', 'chaos'],
    objectives: [
      'MTF Beta-7: Re-contain SCP-049 with biohazard protocols',
      'Medical: Quarantine any personnel touched by SCP-049',
      'Security: Lock down the containment wing',
      'All personnel: Avoid physical contact with SCP-049',
    ],
    duration: 120,
  },
  {
    id: 'breach-096',
    type: 'breach',
    title: 'CONTAINMENT BREACH: SCP-096',
    description: 'SCP-096 has breached containment. DO NOT LOOK AT ITS FACE. If you see it, it will hunt you. MTF Epsilon-11, deploy with blindfolds.',
    trigger: () => true,
    scpId: 'scp-096',
    affectedFactions: ['mtf-epsilon11', 'mtf-nu7', 'security', 'medical', 'chaos'],
    objectives: [
      'DO NOT look at SCP-096\'s face',
      'MTF Epsilon-11: Deploy with visual shielding',
      'Security: Evacuate all personnel from the area',
      'Medical: Prepare for severe trauma casualties',
    ],
    duration: 150,
  },
  {
    id: 'breach-106',
    type: 'breach',
    title: 'CONTAINMENT BREACH: SCP-106',
    description: 'SCP-106 has breached containment. It is moving through walls. No physical barriers will stop it. Lure it to the containment chamber using live bait.',
    trigger: () => true,
    scpId: 'scp-106',
    affectedFactions: ['mtf-epsilon11', 'mtf-nu7', 'security', 'medical', 'class-d', 'chaos'],
    objectives: [
      'MTF Epsilon-11: Lure SCP-106 back to containment',
      'Security: Clear all corridors in its path',
      'Medical: Prepare for pocket-dimension extraction casualties',
      'All personnel: Do not let SCP-106 touch you',
    ],
    duration: 180,
  },
  {
    id: 'intel-mole',
    type: 'investigation',
    title: 'INVESTIGATION: Suspected Mole',
    description: 'Internal Security has detected unusual data access patterns. A Chaos Insurgency operative may be embedded within the Foundation. All personnel are suspects.',
    trigger: () => true,
    affectedFactions: ['internal-security', 'intel', 'chaos', 'admin', 'security'],
    objectives: [
      'Internal Security: Identify the mole',
      'Intel: Analyze communication logs for anomalies',
      'Security: Monitor personnel movements in restricted areas',
      'Administration: Authorize investigation resources',
    ],
    duration: 90,
  },
  {
    id: 'medical-outbreak',
    type: 'emergency',
    title: 'MEDICAL EMERGENCY: Anomalous Outbreak',
    description: 'An anomalous pathogen has been detected in the Medical Bay. Personnel are exhibiting unusual symptoms. Quarantine protocols are in effect.',
    trigger: () => true,
    affectedFactions: ['medical', 'mtf-beta7', 'security', 'scientific', 'admin'],
    objectives: [
      'Medical: Quarantine affected personnel',
      'MTF Beta-7: Assist with biohazard containment',
      'Scientific: Analyze the pathogen for a cure',
      'Security: Enforce quarantine perimeter',
    ],
    duration: 100,
  },
  {
    id: 'admin-power-struggle',
    type: 'political',
    title: 'ADMINISTRATIVE CRISIS: Power Struggle',
    description: 'A conflict has erupted between department heads over resource allocation and authority. The O5 Council has been notified. Tensions are high.',
    trigger: () => true,
    affectedFactions: ['admin', 'intel', 'internal-security', 'scientific', 'security'],
    objectives: [
      'Administration: Resolve the resource dispute',
      'Intel: Assess the impact on facility operations',
      'Internal Security: Monitor for opportunistic behavior',
      'All departments: Continue operations despite tensions',
    ],
    duration: 80,
  },
  {
    id: 'chaos-raid',
    type: 'raid',
    title: 'ALERT: Chaos Insurgency Raid',
    description: 'The Chaos Insurgency is launching a raid on the facility. They are targeting the SCP containment vaults. All security forces, respond immediately.',
    trigger: () => true,
    affectedFactions: ['chaos', 'security', 'mtf-nu7', 'mtf-epsilon11', 'rapid-response', 'intel'],
    objectives: [
      'Security & MTF: Repel the Chaos Insurgency raid',
      'MTF Nu-7: Secure the containment vaults',
      'Rapid Response: Support defensive positions',
      'Intel: Track enemy movements and communications',
    ],
    duration: 120,
  },
  {
    id: 'mtf-joint-op',
    type: 'operation',
    title: 'OPERATION: Joint MTF Deployment',
    description: 'Multiple Mobile Task Forces are being deployed for a joint operation. Nu-7, Epsilon-11, and Beta-7 will coordinate to secure multiple breach points simultaneously.',
    trigger: () => true,
    affectedFactions: ['mtf-nu7', 'mtf-epsilon11', 'mtf-beta7', 'mtf-alpha1', 'security', 'medical'],
    objectives: [
      'MTF Nu-7: Secure the heavy containment zone',
      'MTF Epsilon-11: Re-contain any breached SCPs',
      'MTF Beta-7: Handle biohazard threats',
      'MTF Alpha-1: Oversee the operation',
    ],
    duration: 100,
  },
];

export function getNarrativeEvent(eventId) {
  return NARRATIVE_EVENTS.find(e => e.id === eventId);
}

export function getAllNarrativeEvents() {
  return NARRATIVE_EVENTS;
}

export function getRandomBreachEvent() {
  const breachEvents = NARRATIVE_EVENTS.filter(e => e.type === 'breach');
  return breachEvents[Math.floor(Math.random() * breachEvents.length)];
}

export function getRandomNonBreachEvent() {
  const nonBreach = NARRATIVE_EVENTS.filter(e => e.type !== 'breach');
  return nonBreach[Math.floor(Math.random() * nonBreach.length)];
}

export function getRandomEvent() {
  // 60% chance of breach, 40% other
  if (Math.random() < 0.6) {
    return getRandomBreachEvent();
  }
  return getRandomNonBreachEvent();
}
