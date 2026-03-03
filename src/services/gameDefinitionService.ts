import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { GameDefinition } from '../types/gameDefinition';
import { CURRENT_SCHEMA_VERSION } from '../types/gameDefinition';

const DEFINITIONS_COLLECTION = 'gameDefinitions';

// ---------------------------------------------------------------------------
// FEAT-007 / FEAT-008: Save (create or update) a game definition
// ---------------------------------------------------------------------------

/**
 * Validates card & deck rules (FEAT-007) and rule/win-condition consistency
 * (FEAT-008) before persisting to Firestore.
 * Throws an array of human-readable error strings when validation fails.
 */
export function validateGameDefinition(def: GameDefinition): string[] {
  const errors: string[] = [];

  // FEAT-007: card catalog
  const cardIds = new Set<string>();
  for (const card of def.cards) {
    if (!card.id || !card.name) errors.push(`Card is missing id or name.`);
    if (cardIds.has(card.id)) errors.push(`Duplicate card id: "${card.id}".`);
    cardIds.add(card.id);
  }

  // FEAT-007: deck rules
  const { deckRules } = def;
  if (deckRules.minCards < 1) errors.push('Deck must require at least 1 card.');
  if (deckRules.maxCards < deckRules.minCards)
    errors.push('maxCards cannot be less than minCards.');
  for (const reqId of deckRules.requiredCardIds) {
    if (!cardIds.has(reqId))
      errors.push(`Deck rule references unknown card id: "${reqId}".`);
  }

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

/** Persists a game definition after validation. Throws on validation failure. */
export async function saveGameDefinition(def: GameDefinition): Promise<void> {
  const errors = validateGameDefinition(def);
  if (errors.length > 0) throw new Error(errors.join('\n'));

  const ref = doc(db, DEFINITIONS_COLLECTION, def.id);
  await setDoc(ref, { ...def, updatedAt: Date.now() }, { merge: true });
}

/** Fetches a single game definition by ID (FEAT-007/008 runtime read path). */
export async function getGameDefinition(defId: string): Promise<GameDefinition | null> {
  const snap = await getDoc(doc(db, DEFINITIONS_COLLECTION, defId));
  return snap.exists() ? (snap.data() as GameDefinition) : null;
}

/** Lists all definitions created by the given user (FEAT-007 CRUD). */
export async function listGameDefinitionsByCreator(
  creatorId: string
): Promise<GameDefinition[]> {
  const q = query(
    collection(db, DEFINITIONS_COLLECTION),
    where('creatorId', '==', creatorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as GameDefinition);
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
