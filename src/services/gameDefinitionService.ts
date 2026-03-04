import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { GameDefinition, CardDefinition } from '../types/gameDefinition';
import { CURRENT_SCHEMA_VERSION } from '../types/gameDefinition';

const DEFINITIONS_COLLECTION = 'gameDefinitions';

// ---------------------------------------------------------------------------
// FEAT-007: Card & Deck Constraint Validation (pure utility, Task 4.1/4.3/4.4/4.5)
// ---------------------------------------------------------------------------

/**
 * Validates only the card catalog and deck rules portion of a definition.
 * Returns an array of field-level error strings; empty = valid.
 * Does NOT validate turn-phase graph or win conditions.
 */
export function validateCardAndDeckRules(
  def: Pick<import('../types/gameDefinition').GameDefinition, 'cards' | 'deckRules'>
): string[] {
  const errors: string[] = [];

  // Task 4.3: duplicate card ID check
  const cardIds = new Set<string>();
  for (const card of def.cards) {
    if (!card.id) errors.push('A card is missing an id.');
    else if (cardIds.has(card.id)) errors.push(`Duplicate card id: "${card.id}".`);
    else cardIds.add(card.id);
    if (!card.name) errors.push(`Card "${card.id || '?'}" is missing a name.`);
  }

  // Task 4.4: deck-count range sanity check
  const { deckRules } = def;
  if (deckRules.minCards < 1) errors.push('Minimum cards must be at least 1.');
  if (deckRules.maxCards < deckRules.minCards)
    errors.push('Maximum cards cannot be less than minimum cards.');

  // Task 4.5: required-cards cross-reference check
  for (const reqId of deckRules.requiredCardIds) {
    if (!cardIds.has(reqId))
      errors.push(`Deck rule references unknown card id: "${reqId}".`);
  }

  // Catalog-size check: catalog must be large enough to satisfy the minimum deck size
  if (def.cards.length > 0 && def.cards.length < deckRules.minCards) {
    errors.push(
      `Card catalog has ${def.cards.length} card${def.cards.length !== 1 ? 's' : ''} but minimum deck size is ${deckRules.minCards}.`
    );
  }

  return errors;
}

// ---------------------------------------------------------------------------
// FEAT-007 / FEAT-008: Save (create or update) a game definition
// ---------------------------------------------------------------------------

/**
 * Full definition validation: card/deck rules + turn-phase graph + win conditions.
 * Throws an array of human-readable error strings when validation fails.
 */
export function validateGameDefinition(def: GameDefinition): string[] {
  // Reuse the card/deck utility (FEAT-007)
  const errors: string[] = validateCardAndDeckRules(def);

  // FEAT-008: phase graph — no orphaned transitions
  const phaseIds = new Set(def.turnPhases.map((p) => p.id));
  for (const phase of def.turnPhases) {
    if (!phase.id || !phase.name)
      errors.push(`Phase is missing id or name.`);
    for (const t of phase.transitions) {
      if (!phaseIds.has(t.toPhaseId))
        errors.push(
          `Phase "${phase.id}" transitions to unknown phase "${t.toPhaseId}".`
        );
    }
  }

  // FEAT-008: win conditions must have a condition string
  for (const wc of def.winConditions) {
    if (!wc.id || !wc.condition)
      errors.push(`Win condition is missing id or condition.`);
  }

  return errors;
}

/** Persists a game definition. Only requires a non-empty name; card/deck warnings are
 * non-blocking (definitions can be saved as incomplete).
 */
export async function saveGameDefinition(def: GameDefinition): Promise<void> {
  if (!def.name.trim()) throw new Error('Definition name is required.');

  const ref = doc(db, DEFINITIONS_COLLECTION, def.id);
  await setDoc(ref, { ...def, updatedAt: Date.now() }, { merge: true });
}

/** Fetches a single game definition by ID (FEAT-007/008 runtime read path). */
export async function getGameDefinition(defId: string): Promise<GameDefinition | null> {
  const snap = await getDoc(doc(db, DEFINITIONS_COLLECTION, defId));
  return snap.exists() ? (snap.data() as GameDefinition) : null;
}

/** Lists all game definitions visible to the current user.
 * TODO(game-definition-access-control): filter to creator + collaborators once user model exists.
 */
export async function listGameDefinitions(): Promise<GameDefinition[]> {
  const snap = await getDocs(collection(db, DEFINITIONS_COLLECTION));
  return snap.docs.map((d) => d.data() as GameDefinition);
}

// ---------------------------------------------------------------------------
// FEAT-007: Card CRUD helpers (Tasks 2.1–2.3)
// These operate on a draft GameDefinition in memory; call saveGameDefinition to persist.
// ---------------------------------------------------------------------------

/**
 * Returns a new definition with the card appended (Task 2.1).
 * Throws if the card id already exists.
 */
export function addCard(
  def: GameDefinition,
  card: CardDefinition
): GameDefinition {
  if (def.cards.some((c) => c.id === card.id)) {
    throw new Error(`Card id "${card.id}" already exists in this definition.`);
  }
  return { ...def, cards: [...def.cards, card], updatedAt: Date.now() };
}

/**
 * Returns a new definition with the matching card replaced (Task 2.2).
 * Throws if the card id is not found.
 */
export function updateCard(
  def: GameDefinition,
  updated: CardDefinition
): GameDefinition {
  if (!def.cards.some((c) => c.id === updated.id)) {
    throw new Error(`Card id "${updated.id}" not found in this definition.`);
  }
  return {
    ...def,
    cards: def.cards.map((c) => (c.id === updated.id ? updated : c)),
    updatedAt: Date.now(),
  };
}

/**
 * Returns a new definition with the card removed (Task 2.3).
 * Also removes the card id from deckRules.requiredCardIds to prevent dangling refs.
 */
export function deleteCard(
  def: GameDefinition,
  cardId: string
): GameDefinition {
  return {
    ...def,
    cards: def.cards.filter((c) => c.id !== cardId),
    deckRules: {
      ...def.deckRules,
      requiredCardIds: def.deckRules.requiredCardIds.filter((id) => id !== cardId),
    },
    updatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// FEAT-009: Import / Export
// ---------------------------------------------------------------------------

/**
 * Serialises a definition to a portable JSON string for download/sharing.
 * Includes schemaVersion so importers can gate on compatibility.
 */
export function exportGameDefinition(def: GameDefinition): string {
  return JSON.stringify({ ...def, schemaVersion: CURRENT_SCHEMA_VERSION }, null, 2);
}

/**
 * Parses and validates an imported JSON string before saving (FEAT-009 FR-3/4).
 * Does NOT overwrite Firestore on failure — callers must check the return type.
 * Returns the parsed definition on success, or throws with actionable errors.
 */
export function importGameDefinition(json: string): GameDefinition {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Import failed: invalid JSON.');
  }

  const def = parsed as GameDefinition;

  if (!def.schemaVersion) {
    throw new Error('Import failed: missing schemaVersion field.');
  }
  if (def.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Import failed: unsupported schema version ${def.schemaVersion}. Expected ${CURRENT_SCHEMA_VERSION}.`
    );
  }

  const errors = validateGameDefinition(def);
  if (errors.length > 0) {
    throw new Error(`Import failed — validation errors:\n${errors.join('\n')}`);
  }

  return def;
}

/**
 * Convenience: validate only, without saving (FEAT-009 FR-3).
 * Returns [] on success, or an array of error strings.
 */
export function validateGameDefinitionJson(json: string): string[] {
  try {
    const def = importGameDefinition(json);
    return validateGameDefinition(def);
  } catch (err) {
    return [(err as Error).message];
  }
}

/** Full pipeline: import JSON then persist to Firestore (FEAT-009 FR-2). */
export async function importAndSaveGameDefinition(
  json: string,
  creatorId: string
): Promise<GameDefinition> {
  const def = importGameDefinition(json);
  const now = Date.now();
  const hydrated: GameDefinition = {
    ...def,
    id: def.id || doc(collection(db, DEFINITIONS_COLLECTION)).id,
    creatorId,
    updatedAt: now,
    createdAt: def.createdAt ?? now,
  };
  await saveGameDefinition(hydrated);
  return hydrated;
}
