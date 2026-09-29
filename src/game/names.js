// NPC name generation and personality traits

const FIRST_NAMES = [
  'James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Lisa',
  'Daniel', 'Karen', 'William', 'Nancy', 'Thomas', 'Betty', 'Richard', 'Helen',
  'Joseph', 'Sandra', 'Charles', 'Donna', 'Christopher', 'Carol', 'Andrew', 'Ruth',
  'Matthew', 'Sharon', 'Anthony', 'Michelle', 'Mark', 'Laura', 'Donald', 'Sarah',
  'Steven', 'Kimberly', 'Paul', 'Deborah', 'Andrew', 'Dorothy', 'Joshua', 'Amy',
  'Kenneth', 'Angela', 'Kevin', 'Ashley', 'Brian', 'Brenda', 'George', 'Emma',
  'Edward', 'Olivia', 'Ronald', 'Cynthia', 'Timothy', 'Marie', 'Jason', 'Janet',
  'Jeffrey', 'Catherine', 'Ryan', 'Frances', 'Jacob', 'Christine', 'Gary', 'Samantha',
  'Nicholas', 'Debra', 'Eric', 'Rachel', 'Jonathan', 'Carolyn', 'Stephen', 'Janice',
  'Larry', 'Maria', 'Justin', 'Heather', 'Scott', 'Diane', 'Brandon', 'Julie',
  'Frank', 'Joyce', 'Benjamin', 'Victoria', 'Gregory', 'Kelly', 'Samuel', 'Christina',
  'Raymond', 'Joan', 'Patrick', 'Evelyn', 'Alexander', 'Judith', 'Jack', 'Megan',
  'Dennis', 'Andrea', 'Jerry', 'Cheryl', 'Tyler', 'Hannah', 'Aaron', 'Jacqueline',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson',
  'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross',
];

const TRAITS = [
  'cautious', 'aggressive', 'curious', 'loyal', 'paranoid', 'ambitious',
  'friendly', 'suspicious', 'brave', 'cowardly', 'methodical', 'reckless',
  'calm', 'nervous', 'confident', 'insecure', 'dedicated', 'lazy',
  'honest', 'deceptive', 'professional', 'careless', 'observant', 'oblivious',
];

const TRAIT_MODIFIERS = {
  cautious: { aggression: -0.2, curiosity: -0.1, social: -0.1 },
  aggressive: { aggression: 0.3, curiosity: 0.1, social: -0.1 },
  curious: { aggression: -0.1, curiosity: 0.3, social: 0.1 },
  loyal: { aggression: 0.0, curiosity: -0.1, social: 0.2 },
  paranoid: { aggression: 0.1, curiosity: 0.0, social: -0.3 },
  ambitious: { aggression: 0.1, curiosity: 0.2, social: 0.1 },
  friendly: { aggression: -0.2, curiosity: 0.1, social: 0.3 },
  suspicious: { aggression: 0.1, curiosity: 0.1, social: -0.2 },
  brave: { aggression: 0.2, curiosity: 0.1, social: 0.1 },
  cowardly: { aggression: -0.3, curiosity: -0.1, social: -0.1 },
  methodical: { aggression: -0.1, curiosity: 0.0, social: -0.1 },
  reckless: { aggression: 0.3, curiosity: 0.2, social: 0.0 },
  calm: { aggression: -0.2, curiosity: 0.0, social: 0.1 },
  nervous: { aggression: -0.1, curiosity: -0.1, social: -0.2 },
  confident: { aggression: 0.1, curiosity: 0.1, social: 0.2 },
  insecure: { aggression: -0.1, curiosity: 0.1, social: -0.2 },
  dedicated: { aggression: 0.0, curiosity: 0.0, social: 0.0 },
  lazy: { aggression: -0.2, curiosity: -0.2, social: 0.0 },
  honest: { aggression: -0.1, curiosity: 0.0, social: 0.2 },
  deceptive: { aggression: 0.1, curiosity: 0.1, social: -0.1 },
  professional: { aggression: 0.0, curiosity: 0.0, social: 0.0 },
  careless: { aggression: 0.1, curiosity: 0.1, social: 0.1 },
  observant: { aggression: -0.1, curiosity: 0.2, social: 0.1 },
  oblivious: { aggression: -0.1, curiosity: -0.2, social: 0.0 },
};

let nameCounter = 0;

export function generateName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function generatePersonality() {
  const numTraits = 2 + Math.floor(Math.random() * 2); // 2-3 traits
  const traits = [];
  const available = [...TRAITS];
  for (let i = 0; i < numTraits && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    traits.push(available.splice(idx, 1)[0]);
  }

  // Base stats
  let aggression = 0.3 + Math.random() * 0.4;
  let curiosity = 0.3 + Math.random() * 0.4;
  let social = 0.3 + Math.random() * 0.4;
  let loyalty = 0.3 + Math.random() * 0.4;

  // Apply trait modifiers
  for (const trait of traits) {
    const mod = TRAIT_MODIFIERS[trait];
    if (mod) {
      aggression = Math.max(0, Math.min(1, aggression + (mod.aggression || 0)));
      curiosity = Math.max(0, Math.min(1, curiosity + (mod.curiosity || 0)));
      social = Math.max(0, Math.min(1, social + (mod.social || 0)));
    }
  }

  return { traits, aggression, curiosity, social, loyalty };
}

export function generateNPCId() {
  nameCounter++;
  return `npc-${nameCounter}`;
}
