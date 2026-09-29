// Dialogue generation based on faction, personality, and context

import { areHostile } from './factions.js';

const GREETINGS = {
  'class-d': [
    "Hey... you're not a guard, right? I can't take another day of these tests.",
    "Psst. You thinking what I'm thinking? There's a way out of here.",
    "Another day in paradise. When's lunch? I'm starving.",
    "They dragged me out of my cell at 4 AM for some 'test.' I'm so done.",
  ],
  'scientific': [
    "Ah, a colleague. I'm running the most fascinating experiment on 173 today.",
    "The data from the last test was... unexpected. We need to recalibrate.",
    "Have you reviewed the containment protocols for the new SCPs? Fascinating stuff.",
    "I've been here for 14 hours. Coffee stopped working three hours ago.",
  ],
  'security': [
    "Facility is quiet. Too quiet. I don't like it.",
    "Keep moving. Nothing to see here unless you have clearance.",
    "I've been patrolling this corridor for six hours. My feet hate me.",
    "You see anything suspicious, you report it to me. Understood?",
  ],
  'mtf-nu7': [
    "Nu-7 standing by. We deploy at the first sign of a major breach.",
    "I've seen things you wouldn't believe. This job changes you.",
    "Hammer Down is ready. Always ready.",
    "You ever seen 682? I have. Once was enough.",
  ],
  'mtf-beta7': [
    "Biohazard protocols are in effect. Don't touch anything without gloves.",
    "Maz Hatters, reporting. We handle the stuff that makes people... change.",
    "I've been decontaminated four times this week. My skin is falling off.",
    "If you feel sick, report to Medical immediately. Don't be a hero.",
  ],
  'mtf-epsilon11': [
    "Nine-Tailed Fox, ready to re-contain. Stay back when we deploy.",
    "We're the last line. If we fail, everyone in this facility dies.",
    "I've re-contained 173 three times. It never gets easier.",
    "Keep your eyes on the statue. Always. If you blink, we all die.",
  ],
  'mtf-alpha1': [
    "I can't discuss my mission. You don't have the clearance.",
    "The O5 Council has eyes everywhere. Remember that.",
    "Red Right Hand. We go where we're told, no questions.",
    "You haven't seen me. I was never here. Understood?",
  ],
  'intel': [
    "I can't tell you what I'm working on. But it's big.",
    "The Chaos Insurgency has been quiet. Too quiet. They're planning something.",
    "I've been tracking anomalous signals for 48 hours straight. My eyes are bleeding.",
    "Information is power. And I have a lot of power.",
  ],
  'internal-security': [
    "I'm watching everyone. Even you. Especially you.",
    "There's a mole in this facility. I can feel it. I'll find them.",
    "Don't ask me what I do. The less you know, the safer you are.",
    "I've investigated 12 personnel this month. Three were compromised.",
  ],
  'rapid-response': [
    "RRT, ready to deploy wherever we're needed.",
    "We fill the gaps. When something goes wrong, we're there.",
    "I was eating lunch when the last breach hit. Dropped my sandwich.",
    "We're the Swiss Army knife of the Foundation.",
  ],
  'chaos': [
    "The Foundation's walls are weaker than they think. We'll bring them down.",
    "When the chaos comes, you'll wish you were on our side.",
    "We're here for the SCPs. The Foundation doesn't deserve them.",
    "Keep your voice down. I'm not supposed to be in this sector.",
  ],
  'admin': [
    "The budget meeting ran four hours. I need a drink.",
    "Personnel management is like herding cats. Anomalous cats.",
    "I signed 200 forms today. My hand is numb.",
    "The O5 Council wants results. I want a vacation.",
  ],
  'medical': [
    "Ward 3 is full. We've had 14 casualties from the last breach.",
    "If you're not bleeding, I'm busy. If you are bleeding, I'm still busy.",
    "I've treated 173 injuries this month. The SCPs don't take days off.",
    "Medical emergency? Take a number. We're understaffed and overwhelmed.",
  ],
  'foundation-staff': [
    "Just here to fix the lights in Sector 3. Then I'm going home.",
    "You know how much paperwork it takes to order toilet paper around here?",
    "I mop the floors. I don't ask questions. That's how I survive.",
    "The cafeteria food is anomalous. I'm convinced of it.",
  ],
};

const HOSTILE_GREETINGS = [
  "You shouldn't be here. Walk away. Now.",
  "I don't know you. State your business or move along.",
  "You're not authorized to be in this sector. Leave.",
  "I'm watching you. One wrong move and you're done.",
  "Stay back. I don't trust your faction.",
];

const BREACH_GREETINGS = {
  'class-d': "This is our chance! The breach is a distraction — we can escape!",
  'scientific': "The containment breach! We need to secure our research data immediately!",
  'security': "BREACH ALERT! All units to containment positions! Move!",
  'mtf-nu7': "Nu-7, deploy! This is what we train for. Hammer Down!",
  'mtf-beta7': "Biohazard breach! Suit up and contain, people!",
  'mtf-epsilon11': "Re-containment protocol active! Foxes, move out!",
  'mtf-alpha1': "The O5 Council has been notified. Secure the area.",
  'intel': "I need to document everything. This breach is intelligence gold.",
  'internal-security': "During the chaos, the mole will make a move. I'm watching.",
  'rapid-response': "RRT deploying! Where do you need us?",
  'chaos': "Perfect. The breach is our cover. Let's move on the SCP vaults.",
  'admin': "Get me a casualty report and a damage assessment. Now!",
  'medical': "Casualties incoming! Prepare the wards for emergency triage!",
  'foundation-staff': "I need to get out of here! Where's the nearest exit?!",
};

const DIALOGUE_OPTIONS = [
  { id: 'ask_status', label: "What's the situation?", response: (ctx) => getSituationResponse(ctx) },
  { id: 'ask_faction', label: "Tell me about your work.", response: (ctx) => getFactionWorkResponse(ctx) },
  { id: 'ask_rumor', label: "Heard any rumors?", response: (ctx) => getRumorResponse(ctx) },
  { id: 'goodbye', label: "I need to go.", response: () => "Stay safe out there." },
];

const RUMORS = [
  "I heard someone's been smuggling anomalous items out of the facility.",
  "There's a rumor that the Chaos Insurgency has someone on the inside.",
  "Word is, the O5 Council is planning something big. Nobody knows what.",
  "I heard SCP-096 has been restless lately. That's never good.",
  "Someone said the cafeteria is serving actual food today. I don't believe it.",
  "There's been strange noises from the lower levels. Nobody goes down there.",
  "I heard the Medical Department found something... unusual in a blood sample.",
  "Rumor has it that Internal Security is investigating three people in this sector.",
];

function getSituationResponse(ctx) {
  if (ctx.breachActive) {
    return `There's an active containment breach! ${ctx.breachNPC || 'An SCP'} has escaped containment. ${
      ctx.faction === 'security' || ctx.faction.startsWith('mtf') ? 'We need to respond immediately!' :
      ctx.faction === 'class-d' ? 'This is our chance to escape!' :
      ctx.faction === 'medical' ? 'We need to prepare for casualties!' :
      'The whole facility is on high alert.'
    }`;
  }
  return "Things have been quiet. Maybe too quiet. The calm before the storm, if you ask me.";
}

function getFactionWorkResponse(ctx) {
  const workResponses = {
    'class-d': "I'm a test subject. They use us for experiments with the SCPs. Most of us don't make it out.",
    'scientific': "I research anomalous objects. The things we study here... they defy everything we know about physics.",
    'security': "I guard the facility. Patrol the corridors, escort D-Class, respond to breaches. It's exhausting.",
    'mtf-nu7': "Nu-7 handles the heavy stuff. When an SCP breaches and it's dangerous, we go in with force.",
    'mtf-beta7': "We deal with biological and chemical anomalies. Outbreaks, contamination, that kind of thing.",
    'mtf-epsilon11': "We re-contain breached SCPs. We're the ones who go in when everything goes wrong.",
    'mtf-alpha1': "I can't discuss the details. We handle operations directly for the O5 Council.",
    'intel': "I gather intelligence on threats — both anomalous and human. The Chaos Insurgency is our main concern.",
    'internal-security': "I investigate threats from within the Foundation. Moles, traitors, unauthorized access.",
    'rapid-response': "We fill gaps. Wherever the facility needs support, we deploy. Jack of all trades.",
    'chaos': "We're here to take what the Foundation is hiding. The SCPs should belong to everyone.",
    'admin': "I manage personnel and operations. It's mostly paperwork, meetings, and putting out fires.",
    'medical': "I treat the injured. After a breach, the wards fill up fast. It's grim work.",
    'foundation-staff': "I keep the facility running. Lights, plumbing, food. Without us, this place falls apart.",
  };
  return workResponses[ctx.faction] || "I do what I'm told. That's how you survive here.";
}

function getRumorResponse(ctx) {
  return RUMORS[Math.floor(Math.random() * RUMORS.length)];
}

export function generateGreeting(npc, playerFaction, breachActive, breachNPCName) {
  const ctx = { faction: npc.faction, breachActive, breachNPC: breachNPCName };

  if (breachActive && BREACH_GREETINGS[npc.faction]) {
    return BREACH_GREETINGS[npc.faction];
  }

  if (areHostile(npc.faction, playerFaction)) {
    return HOSTILE_GREETINGS[Math.floor(Math.random() * HOSTILE_GREETINGS.length)];
  }

  const greetings = GREETINGS[npc.faction] || GREETINGS['foundation-staff'];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export function getDialogueOptions(npc, playerFaction, breachActive, breachNPCName) {
  const ctx = { faction: npc.faction, breachActive, breachNPC: breachNPCName };
  const options = [...DIALOGUE_OPTIONS];

  if (breachActive) {
    options.unshift({
      id: 'ask_breach',
      label: "What's happening with the breach?",
      response: () => getSituationResponse(ctx),
    });
  }

  return options;
}

export function getDialogueResponse(optionId, npc, playerFaction, breachActive, breachNPCName) {
  const ctx = { faction: npc.faction, breachActive, breachNPC: breachNPCName };
  const options = getDialogueOptions(npc, playerFaction, breachActive, breachNPCName);
  const option = options.find(o => o.id === optionId);
  if (option) return option.response(ctx);
  return "...";
}
