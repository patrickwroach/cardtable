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

const SUITS   = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
const RANKS   = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
const PINOCLE_RANKS = ['9', '10', 'Jack', 'Queen', 'King', 'Ace'];

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Standard 52-card deck */
function buildStandardDeck() {
  const cards = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const id = `${slug(rank)}-of-${slug(suit)}`;
      const pointValue = ['Ace', 'King', 'Queen', 'Jack', '10'].includes(rank) ? 10 : parseInt(rank, 10) || 0;
      cards.push({ id, name: `${rank} of ${suit}`, type: suit.toLowerCase(), metadata: { suit, rank, pointValue } });
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

const definitions = [
  {
    id: 'standard-52-card-deck',
    creatorId: CREATOR_ID,
    name: 'Standard 52-Card Deck',
    schemaVersion: 1,
    cards: buildStandardDeck(),
    deckRules: {
      minCards: 1,
      maxCards: 52,
      requiredCardIds: [],
      maxCopiesPerCard: 1,
    },
    turnPhases: [],
    winConditions: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'pinochle-deck',
    creatorId: CREATOR_ID,
    name: 'Pinochle Deck',
    schemaVersion: 1,
    cards: buildPinochleDeck(),
    deckRules: {
      minCards: 48,
      maxCards: 48,
      requiredCardIds: [],
      maxCopiesPerCard: 2,
    },
    turnPhases: [],
    winConditions: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'dandan-commons-deck',
    creatorId: CREATOR_ID,
    name: 'DanDan (MtG Commons Format)',
    schemaVersion: 1,
    cards: buildDanDanCards(),
    deckRules: {
      minCards: 40,
      maxCards: 60,
      requiredCardIds: ['island', 'dandan'],
      maxCopiesPerCard: 4,
    },
    turnPhases: [],
    winConditions: [],
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
