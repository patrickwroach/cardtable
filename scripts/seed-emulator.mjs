/**
 * Seed script: populates the Firestore emulator with starter game definitions.
 *
 * Usage:
 *   npm run seed
 *
 * Requires the emulator to be running first (npm run emulators).
 * Uses "Authorization: Bearer owner" to bypass security rules on the emulator.
 */

const PROJECT_ID = 'cardtable-1c41e';
const BASE = `http://localhost:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer owner',
};

// ---------------------------------------------------------------------------
// Firestore REST type helpers
// ---------------------------------------------------------------------------
function str(v)  { return { stringValue: String(v) }; }
function int(v)  { return { integerValue: String(Math.round(v)) }; }
function bool(v) { return { booleanValue: Boolean(v) }; }
function arr(items) { return { arrayValue: { values: items } }; }
function map(fields) { return { mapValue: { fields } }; }

/** Recursively converts a plain JS value to a Firestore REST typed value. */
function toFirestore(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean')  return bool(value);
  if (typeof value === 'number')   return Number.isInteger(value) ? int(value) : { doubleValue: value };
  if (typeof value === 'string')   return str(value);
  if (Array.isArray(value))        return arr(value.map(toFirestore));
  if (typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) fields[k] = toFirestore(v);
    return map(fields);
  }
  return str(String(value));
}

/** Converts a plain JS object to a Firestore REST document fields map. */
function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestore(v);
  return { fields };
}

// ---------------------------------------------------------------------------
// Upsert a document
// ---------------------------------------------------------------------------
async function upsert(collection, docId, data) {
  const url = `${BASE}/${collection}/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify(toFields(data)),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to write ${collection}/${docId}: ${res.status} ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Data builders
// ---------------------------------------------------------------------------

const SUITS        = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
const PINOCLE_RANKS = ['9', '10', 'Jack', 'Queen', 'King', 'Ace'];
const EUCHRE_RANKS  = ['9', '10', 'Jack', 'Queen', 'King', 'Ace'];

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Euchre deck: one copy of 9–A in each suit (24 cards) */
function buildEuchreDeck() {
  const cards = [];
  // Ace high for trick-taking; bower logic (J of trump / J of same color) is runtime
  const rankOrder = { '9': 1, '10': 2, 'Jack': 3, 'Queen': 4, 'King': 5, 'Ace': 6 };
  for (const suit of SUITS) {
    for (const rank of EUCHRE_RANKS) {
      const id = `${slug(rank)}-of-${slug(suit)}`;
      cards.push({
        id,
        name: `${rank} of ${suit}`,
        type: suit.toLowerCase(),
        metadata: { suit, rank, rankOrder: rankOrder[rank] ?? 0 },
      });
    }
  }
  return cards;
}

/** Pinochle deck: two copies of 9–A in each suit (48 cards) */
function buildPinochleDeck() {
  const cards = [];
  const pointMap = { Ace: 11, '10': 10, King: 4, Queen: 3, Jack: 2, '9': 0 };
  for (const copyNum of [1, 2]) {
    for (const suit of SUITS) {
      for (const rank of PINOCLE_RANKS) {
        const id = `${slug(rank)}-of-${slug(suit)}-${copyNum}`;
        cards.push({ id, name: `${rank} of ${suit} (copy ${copyNum})`, type: suit.toLowerCase(), metadata: { suit, rank, pointValue: pointMap[rank] ?? 0, copy: copyNum } });
      }
    }
  }
  return cards;
}

const NOW = Date.now();
const CREATOR_ID = 'seed-script';

/** DanDan (MtG commons format) — unique card definitions; copies handled by deckRules */
function buildDanDanCards() {
  return [
    // Lands
    { id: 'island', name: 'Island', type: 'land', description: 'Tap: Add {U}.', metadata: { manaValue: 0, colors: ['blue'], supertype: 'Basic', subtype: 'Island' } },

    // Creatures
    { id: 'dandan', name: 'DanDan', type: 'creature', description: 'Islandwalk (can\'t be blocked if defending player controls an Island). DanDan doesn\'t untap during your untap step if you control no Islands.', metadata: { manaValue: 2, manaCost: '{1}{U}', power: 2, toughness: 2, colors: ['blue'], subtype: 'Fish' } },
    { id: 'zephyr-sprite', name: 'Zephyr Sprite', type: 'creature', description: 'Flying', metadata: { manaValue: 1, manaCost: '{U}', power: 1, toughness: 1, colors: ['blue'], subtype: 'Faerie' } },
    { id: 'cloud-sprite', name: 'Cloud Sprite', type: 'creature', description: 'Flying. Cloud Sprite can block only creatures with flying.', metadata: { manaValue: 1, manaCost: '{U}', power: 1, toughness: 1, colors: ['blue'], subtype: 'Faerie' } },
    { id: 'coral-eel', name: 'Coral Eel', type: 'creature', description: 'Islandwalk', metadata: { manaValue: 2, manaCost: '{1}{U}', power: 2, toughness: 1, colors: ['blue'], subtype: 'Fish' } },
    { id: 'sea-sprite', name: 'Sea Sprite', type: 'creature', description: 'Flying. Protection from red.', metadata: { manaValue: 2, manaCost: '{1}{U}', power: 1, toughness: 1, colors: ['blue'], subtype: 'Faerie' } },
    { id: 'merfolk-of-the-pearl-trident', name: 'Merfolk of the Pearl Trident', type: 'creature', description: 'Islandwalk', metadata: { manaValue: 1, manaCost: '{U}', power: 1, toughness: 1, colors: ['blue'], subtype: 'Merfolk' } },

    // Enchantments
    { id: 'unstable-mutation', name: 'Unstable Mutation', type: 'enchantment', description: 'Enchant creature. Enchanted creature gets +3/+3. At the beginning of your upkeep, put a -1/-1 counter on enchanted creature.', metadata: { manaValue: 1, manaCost: '{U}', colors: ['blue'], subtype: 'Aura' } },
    { id: 'sunken-city', name: 'Sunken City', type: 'enchantment', description: 'At the beginning of your upkeep, sacrifice Sunken City unless you pay {U}{U}. Blue creatures get +1/+1.', metadata: { manaValue: 2, manaCost: '{1}{U}', colors: ['blue'] } },

    // Instants & Sorceries
    { id: 'counterspell', name: 'Counterspell', type: 'instant', description: 'Counter target spell.', metadata: { manaValue: 2, manaCost: '{U}{U}', colors: ['blue'] } },
    { id: 'unsummon', name: 'Unsummon', type: 'instant', description: 'Return target creature to its owner\'s hand.', metadata: { manaValue: 1, manaCost: '{U}', colors: ['blue'] } },
    { id: 'boomerang', name: 'Boomerang', type: 'instant', description: 'Return target permanent to its owner\'s hand.', metadata: { manaValue: 2, manaCost: '{U}{U}', colors: ['blue'] } },
    { id: 'power-sink', name: 'Power Sink', type: 'instant', description: 'Counter target spell unless its controller pays {X}. If they don\'t, they tap all lands they control and lose all unspent mana.', metadata: { manaValue: 2, manaCost: '{X}{U}', colors: ['blue'] } },
    { id: 'sleight-of-hand', name: 'Sleight of Hand', type: 'sorcery', description: 'Look at the top two cards of your library. Put one into your hand and the other on the bottom of your library.', metadata: { manaValue: 1, manaCost: '{U}', colors: ['blue'] } },
  ];
}

/** Minimal test game — 5 cards, empty-hand win condition for runtime evaluation testing */
function buildTestCards() {
  return [
    { id: 'test-card-1', name: 'Test Card 1', type: 'standard', metadata: {} },
    { id: 'test-card-2', name: 'Test Card 2', type: 'standard', metadata: {} },
    { id: 'test-card-3', name: 'Test Card 3', type: 'standard', metadata: {} },
    { id: 'test-card-4', name: 'Test Card 4', type: 'standard', metadata: {} },
    { id: 'test-card-5', name: 'Test Card 5', type: 'standard', metadata: {} },
  ];
}

const definitions = [
  {
    id: 'empty-hand-test',
    creatorId: CREATOR_ID,
    name: 'Empty Hand Test (7.6)',
    schemaVersion: 1,
    minPlayers: 1,
    maxPlayers: 4,
    cards: buildTestCards(),
    deckRules: { minCards: 5, maxCards: 5, requiredCardIds: [], maxCopiesPerCard: 1 },
    zones: [
      { id: 'hand', label: 'Hand', owner: 'per-player', visibility: 'private', ordered: false, interactable: true, persistent: false },
      { id: 'discard', label: 'Discard', owner: 'global', visibility: 'public', ordered: false, interactable: false, persistent: false },
    ],
    resourcePools: [],
    turnPhases: [
      {
        id: 'play',
        label: 'Play',
        poolReplenishments: [],
        transitionConditions: [{ type: 'zone_empty', zoneId: 'hand' }],
        nextPhaseId: null,
      },
    ],
    winConditions: [
      {
        id: 'empty-hand-wins',
        description: 'First player to empty their hand wins.',
        trigger: { subject: 'any_player', poolId: 'hand_size', operator: 'lte', value: 0 },
        outcome: 'subject_wins',
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'pinochle-deck',
    creatorId: CREATOR_ID,
    name: 'Pinochle',
    schemaVersion: 1,
    minPlayers: 4,
    maxPlayers: 4,
    cards: buildPinochleDeck(),
    deckRules: {
      minCards: 48,
      maxCards: 48,
      requiredCardIds: [],
      maxCopiesPerCard: 2,
    },
    zones: [
      {
        id: 'hand',
        label: 'Hand',
        owner: 'per-player',
        visibility: 'private',
        ordered: true,
        interactable: true,
        persistent: false,
      },
      {
        id: 'trick',
        label: 'Current Trick',
        owner: 'global',
        visibility: 'public',
        ordered: true,
        interactable: true,
        persistent: false,
      },
      {
        id: 'meld',
        label: 'Meld Area',
        owner: 'per-player',
        visibility: 'public',
        ordered: false,
        interactable: false,
        persistent: false,
      },
      {
        id: 'won-tricks',
        label: 'Won Tricks',
        owner: 'per-player',
        visibility: 'hidden',
        ordered: false,
        interactable: false,
        persistent: false,
      },
      {
        id: 'kitty',
        label: 'Kitty / Widow',
        owner: 'global',
        visibility: 'hidden',
        ordered: false,
        interactable: false,
        persistent: false,
      },
    ],
    resourcePools: [
      {
        id: 'score',
        label: 'Score',
        scope: 'persistent',
        initialValue: 0,
        min: 0,
        direction: 'up',
        spendable: false,
        expireUnspent: false,
        owner: 'player',
      },
      {
        id: 'bid',
        label: 'Bid',
        scope: 'round',
        initialValue: 0,
        min: 0,
        direction: 'up',
        spendable: false,
        expireUnspent: true,
        owner: 'player',
      },
      {
        id: 'trick-points',
        label: 'Trick Points (this hand)',
        scope: 'round',
        initialValue: 0,
        min: 0,
        direction: 'up',
        spendable: false,
        expireUnspent: true,
        owner: 'player',
      },
    ],
    turnPhases: [
      {
        id: 'deal',
        label: 'Deal',
        poolReplenishments: [
          { poolId: 'bid', amount: 0 },
          { poolId: 'trick-points', amount: 0 },
        ],
        transitionConditions: [
          { type: 'zone_empty', zoneId: 'kitty' },
        ],
        nextPhaseId: 'bidding',
      },
      {
        id: 'bidding',
        label: 'Bidding',
        poolReplenishments: [],
        transitionConditions: [
          { type: 'manual' },
        ],
        nextPhaseId: 'meld',
      },
      {
        id: 'meld',
        label: 'Meld',
        poolReplenishments: [],
        transitionConditions: [
          { type: 'manual' },
        ],
        nextPhaseId: 'trick-taking',
      },
      {
        id: 'trick-taking',
        label: 'Trick-Taking',
        poolReplenishments: [],
        transitionConditions: [
          { type: 'zone_empty', zoneId: 'hand' },
        ],
        nextPhaseId: 'scoring',
      },
      {
        id: 'scoring',
        label: 'Scoring',
        poolReplenishments: [],
        transitionConditions: [
          { type: 'manual' },
        ],
        nextPhaseId: null,
      },
    ],
    winConditions: [
      {
        id: 'reach-1500',
        description: 'First player to accumulate 1500 or more points wins.',
        trigger: {
          subject: 'any_player',
          poolId: 'score',
          operator: 'gte',
          value: 1500,
        },
        outcome: 'subject_wins',
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'dandan-commons-deck',
    creatorId: CREATOR_ID,
    name: 'DanDan (MtG Commons Format)',
    schemaVersion: 1,
    minPlayers: 2,
    maxPlayers: 2,
    cards: buildDanDanCards(),
    deckRules: {
      minCards: 40,
      maxCards: 60,
      requiredCardIds: ['island', 'dandan'],
      maxCopiesPerCard: 4,
    },
    zones: [
      {
        id: 'library',
        label: 'Library',
        owner: 'per-player',
        visibility: 'hidden',
        ordered: true,
        interactable: false,
        persistent: true,
      },
      {
        id: 'hand',
        label: 'Hand',
        owner: 'per-player',
        visibility: 'private',
        ordered: false,
        interactable: true,
        persistent: true,
      },
      {
        id: 'battlefield',
        label: 'Battlefield',
        owner: 'per-player',
        visibility: 'public',
        ordered: false,
        interactable: true,
        persistent: true,
      },
      {
        id: 'graveyard',
        label: 'Graveyard',
        owner: 'per-player',
        visibility: 'public',
        ordered: true,
        interactable: false,
        persistent: true,
      },
      {
        id: 'exile',
        label: 'Exile',
        owner: 'global',
        visibility: 'public',
        ordered: false,
        interactable: false,
        persistent: true,
      },
      {
        id: 'stack',
        label: 'Stack',
        owner: 'global',
        visibility: 'public',
        ordered: true,
        interactable: false,
        persistent: false,
      },
    ],
    resourcePools: [
      {
        id: 'life',
        label: 'Life Total',
        scope: 'persistent',
        initialValue: 20,
        min: 0,
        direction: 'bidirectional',
        spendable: false,
        expireUnspent: false,
        owner: 'player',
      },
      {
        id: 'mana',
        label: 'Mana Pool',
        scope: 'phase',
        initialValue: 0,
        min: 0,
        direction: 'bidirectional',
        spendable: true,
        expireUnspent: true,
        owner: 'player',
      },
      {
        id: 'poison',
        label: 'Poison Counters',
        scope: 'persistent',
        initialValue: 0,
        min: 0,
        max: 10,
        direction: 'up',
        spendable: false,
        expireUnspent: false,
        owner: 'player',
      },
    ],
    turnPhases: [
      {
        id: 'untap',
        label: 'Untap',
        poolReplenishments: [],
        transitionConditions: [{ type: 'manual' }],
        nextPhaseId: 'upkeep',
      },
      {
        id: 'upkeep',
        label: 'Upkeep',
        poolReplenishments: [],
        transitionConditions: [{ type: 'manual' }],
        nextPhaseId: 'draw',
      },
      {
        id: 'draw',
        label: 'Draw',
        poolReplenishments: [],
        transitionConditions: [{ type: 'manual' }],
        nextPhaseId: 'main1',
      },
      {
        id: 'main1',
        label: 'Main Phase 1',
        poolReplenishments: [{ poolId: 'mana', amount: 'full' }],
        transitionConditions: [{ type: 'manual' }],
        nextPhaseId: 'combat',
      },
      {
        id: 'combat',
        label: 'Combat',
        poolReplenishments: [],
        transitionConditions: [{ type: 'manual' }],
        nextPhaseId: 'main2',
      },
      {
        id: 'main2',
        label: 'Main Phase 2',
        poolReplenishments: [{ poolId: 'mana', amount: 'full' }],
        transitionConditions: [{ type: 'manual' }],
        nextPhaseId: 'end',
      },
      {
        id: 'end',
        label: 'End Step',
        poolReplenishments: [],
        transitionConditions: [{ type: 'manual' }],
        nextPhaseId: null,
      },
    ],
    winConditions: [
      {
        id: 'life-zero',
        description: 'A player whose life total reaches 0 loses.',
        trigger: {
          subject: 'any_player',
          poolId: 'life',
          operator: 'lte',
          value: 0,
        },
        outcome: 'subject_loses',
      },
      {
        id: 'poison-ten',
        description: 'A player who accumulates 10 or more poison counters loses.',
        trigger: {
          subject: 'any_player',
          poolId: 'poison',
          operator: 'gte',
          value: 10,
        },
        outcome: 'subject_loses',
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'euchre',
    creatorId: CREATOR_ID,
    name: 'Euchre',
    schemaVersion: 1,
    minPlayers: 4,
    maxPlayers: 4,
    cards: buildEuchreDeck(),
    deckRules: {
      minCards: 24,
      maxCards: 24,
      requiredCardIds: [],
      maxCopiesPerCard: 1,
    },
    zones: [
      {
        id: 'hand',
        label: 'Hand',
        owner: 'per-player',
        visibility: 'private',
        ordered: true,
        interactable: true,
        persistent: false,
      },
      {
        id: 'trick',
        label: 'Current Trick',
        owner: 'global',
        visibility: 'public',
        ordered: true,
        interactable: true,
        persistent: false,
      },
      {
        id: 'won-tricks',
        label: 'Won Tricks',
        owner: 'per-team',
        visibility: 'hidden',
        ordered: false,
        interactable: false,
        persistent: false,
      },
      {
        id: 'kitty',
        label: 'Kitty (4 face-down)',
        owner: 'global',
        visibility: 'hidden',
        ordered: false,
        interactable: false,
        persistent: false,
      },
    ],
    resourcePools: [
      {
        id: 'team-score',
        label: 'Team Score',
        scope: 'persistent',
        initialValue: 0,
        min: 0,
        direction: 'up',
        spendable: false,
        expireUnspent: false,
        owner: 'team',
      },
      {
        id: 'tricks-taken',
        label: 'Tricks Taken (this hand)',
        scope: 'round',
        initialValue: 0,
        min: 0,
        max: 5,
        direction: 'up',
        spendable: false,
        expireUnspent: true,
        owner: 'team',
      },
      {
        id: 'bid-team',
        label: 'Bid / Maker Team',
        scope: 'round',
        initialValue: 0,
        min: 0,
        direction: 'up',
        spendable: false,
        expireUnspent: true,
        owner: 'team',
      },
    ],
    turnPhases: [
      {
        id: 'deal',
        label: 'Deal',
        poolReplenishments: [
          { poolId: 'tricks-taken', amount: 0 },
          { poolId: 'bid-team', amount: 0 },
        ],
        transitionConditions: [{ type: 'manual' }],
        nextPhaseId: 'bid-round-1',
      },
      {
        id: 'bid-round-1',
        label: 'Bid Round 1 — Order Up or Pass',
        poolReplenishments: [],
        transitionConditions: [{ type: 'manual' }],
        nextPhaseId: 'bid-round-2',
      },
      {
        id: 'bid-round-2',
        label: 'Bid Round 2 — Name a Suit or Pass (Stick the Dealer)',
        poolReplenishments: [],
        transitionConditions: [{ type: 'manual' }],
        nextPhaseId: 'trick-taking',
      },
      {
        id: 'trick-taking',
        label: 'Trick-Taking (5 tricks)',
        poolReplenishments: [],
        transitionConditions: [
          { type: 'zone_empty', zoneId: 'hand' },
        ],
        nextPhaseId: 'scoring',
      },
      {
        id: 'scoring',
        label: 'Scoring',
        poolReplenishments: [],
        transitionConditions: [{ type: 'manual' }],
        nextPhaseId: null,
      },
    ],
    winConditions: [
      {
        id: 'reach-10',
        description: 'First team to reach 10 points wins.',
        trigger: {
          subject: 'any_player',
          poolId: 'team-score',
          operator: 'gte',
          value: 10,
        },
        outcome: 'subject_wins',
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  for (const def of definitions) {
    process.stdout.write(`Seeding "${def.name}" (${def.cards.length} cards)… `);
    await upsert('gameDefinitions', def.id, def);
    console.log('✓');
  }
  console.log('\nDone. Restart or refresh the app to see the definitions.');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
