"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { GameDefinition, CardDefinition } from '../types/gameDefinition';
import { CURRENT_SCHEMA_VERSION } from '../types/gameDefinition';
import {
  validateCardAndDeckRules,
  addCard,
  updateCard,
  deleteCard,
  saveGameDefinition,
  listGameDefinitions,
} from '../services/gameDefinitionService';

interface GameDefinitionEditorProps {
  creatorId: string;
  onClose: () => void;
}

const EMPTY_CARD_FORM = { id: '', name: '', type: '' };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueSlug(base: string, existingIds: string[]): string {
  let n = 1;
  while (existingIds.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (e.g. http://localhost)
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function newDefinition(creatorId: string): GameDefinition {
  const now = Date.now();
  return {
    id: generateId(),
    creatorId,
    name: '',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    cards: [],
    deckRules: { minCards: 1, maxCards: 52, requiredCardIds: [], maxCopiesPerCard: 0 },
    turnPhases: [],
    winConditions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const GameDefinitionEditor: React.FC<GameDefinitionEditorProps> = ({
  creatorId,
  onClose,
}) => {
  // ---- Picker screen state ----
  const [screen, setScreen] = useState<'picker' | 'edit'>('picker');
  const [existingDefs, setExistingDefs] = useState<GameDefinition[]>([]);
  const [loadingDefs, setLoadingDefs] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    listGameDefinitions()
      .then((defs) => {
        if (mounted) setExistingDefs(defs.sort((a, b) => b.updatedAt - a.updatedAt));
      })
      .catch((e) => { if (mounted) setLoadError((e as Error).message ?? 'Failed to load definitions.'); })
      .finally(() => { if (mounted) setLoadingDefs(false); });
    return () => { mounted = false; };
  }, []);

  const [draft, setDraft] = useState<GameDefinition>(() => newDefinition(creatorId));
  const [cardForm, setCardForm] = useState(EMPTY_CARD_FORM);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [cardFormError, setCardFormError] = useState<string | null>(null);

  // Task 4.1 / 4.2: live validation — save is blocked while errors exist
  const validationErrors = useMemo(() => validateCardAndDeckRules(draft), [draft]);
  const canSave = draft.name.trim() !== '';

  // -----------  Card form helpers  -----------

  const handleCardFormChange = (field: keyof typeof EMPTY_CARD_FORM, value: string) => {
    setCardFormError(null);
    if (field === 'name' && !editingCardId) {
      const autoId = uniqueSlug(slugify(value), draft.cards.map((c) => c.id));
      setCardForm((f) => ({ ...f, name: value, id: autoId }));
    } else {
      setCardForm((f) => ({ ...f, [field]: value }));
    }
  };

  const handleAddOrUpdateCard = () => {
    const trimmed: CardDefinition = {
      id: cardForm.id.trim(),
      name: cardForm.name.trim(),
      type: cardForm.type.trim() || 'standard',
    };
    if (!trimmed.id || !trimmed.name) return;
    setCardFormError(null);

    if (!editingCardId && draft.cards.some((c) => c.id === trimmed.id)) {
      setCardFormError(`Card id "${trimmed.id}" already exists.`);
      return;
    }

    if (editingCardId) {
      setDraft((d) => updateCard(d, trimmed));
    } else {
      setDraft((d) => addCard(d, trimmed));
    }
    setCardForm(EMPTY_CARD_FORM);
    setEditingCardId(null);
  };

  const handleEditCard = (card: CardDefinition) => {
    setCardFormError(null);
    setCardForm({ id: card.id, name: card.name, type: card.type ?? '' });
    setEditingCardId(card.id);
  };

  const handleDeleteCard = (cardId: string) => {
    setDraft((d) => deleteCard(d, cardId));
    if (editingCardId === cardId) {
      setCardForm(EMPTY_CARD_FORM);
      setEditingCardId(null);
    }
  };

  const handleCancelEdit = () => {
    setCardForm(EMPTY_CARD_FORM);
    setEditingCardId(null);
    setCardFormError(null);
  };

  // -----------  Deck rules helpers  -----------

  const setDeckRuleField = (field: 'minCards' | 'maxCards', value: number) => {
    setDraft((d) => ({
      ...d,
      deckRules: { ...d.deckRules, [field]: value },
      updatedAt: Date.now(),
    }));
  };

  const toggleRequiredCard = (cardId: string) => {
    setDraft((d) => {
      const already = d.deckRules.requiredCardIds.includes(cardId);
      return {
        ...d,
        deckRules: {
          ...d.deckRules,
          requiredCardIds: already
            ? d.deckRules.requiredCardIds.filter((id) => id !== cardId)
            : [...d.deckRules.requiredCardIds, cardId],
        },
        updatedAt: Date.now(),
      };
    });
  };

  // -----------  Save  -----------

  const handleSave = async () => {
    if (!canSave) return;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      await saveGameDefinition(draft);
      setSaveStatus('saved');
    } catch (e) {
      setSaveStatus('error');
      setSaveError((e as Error).message);
    }
  };

  return (
    <>
    {screen === 'picker' && (
      <div className="max-w-3xl mx-auto px-5 py-8">
        <div className="bg-white/95 rounded-xl px-6 py-5 mb-5 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-bold text-gray-800 m-0">Game Definitions</h2>
          <button
            className="bg-white/20 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg cursor-pointer text-sm transition-colors hover:bg-gray-100"
            onClick={onClose}
          >
            ← Back
          </button>
        </div>

        <div className="bg-white/95 rounded-xl px-6 py-5">
          {loadingDefs ? (
            <p className="text-gray-400 text-sm italic">Loading…</p>
          ) : loadError ? (
            <p className="text-red-500 text-sm">⚠ Could not load definitions: {loadError}</p>
          ) : (
            <>
              {existingDefs.length > 0 && (
                <ul className="divide-y divide-gray-100 mb-5">
                  {existingDefs.map((def) => (
                    <li key={def.id}>
                      <button
                        className="w-full text-left py-3 px-1 flex justify-between items-center gap-4 hover:bg-indigo-50 rounded-md transition-colors group"
                        onClick={() => { setDraft(def); setScreen('edit'); }}
                      >
                        <div>
                          <p className="font-semibold text-gray-800 group-hover:text-indigo-700">
                            {def.name || <span className="italic text-gray-400">Untitled</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {def.cards.length} card{def.cards.length !== 1 ? 's' : ''} · updated {new Date(def.updatedAt).toLocaleDateString()}
                            {(() => {
                              try {
                                return validateCardAndDeckRules(def).length > 0
                                  ? <span className="ml-2 text-yellow-600 font-medium">⚠ incomplete</span>
                                  : null;
                              } catch {
                                return null;
                              }
                            })()}
                          </p>
                        </div>
                        <span className="text-indigo-500 text-sm font-medium opacity-0 group-hover:opacity-100">Edit →</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                className="bg-indigo-600 text-white border-0 px-5 py-2 rounded-lg font-semibold cursor-pointer transition-colors hover:bg-indigo-700 w-full"
                onClick={() => { setDraft(newDefinition(creatorId)); setScreen('edit'); }}
              >
                + New Definition
              </button>
            </>
          )}
        </div>
      </div>
    )}

    {screen === 'edit' && (
    <div className="max-w-3xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="bg-white/95 rounded-xl px-6 py-5 mb-5 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-800 m-0">Game Definition Editor</h2>
        <div className="flex gap-3 items-center">
          <button
            className="bg-indigo-600 text-white border-0 px-5 py-2 rounded-lg font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:enabled:bg-indigo-700"
            onClick={handleSave}
            disabled={!canSave || saveStatus === 'saving'}
            title={!canSave ? 'A name is required before saving' : validationErrors.length > 0 ? 'Saving with warnings — definition marked as incomplete' : undefined}
          >
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : 'Save'}
          </button>
          <button
            className="bg-white/20 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg cursor-pointer text-sm transition-colors hover:bg-gray-100"
            onClick={onClose}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Save error banner */}
      {saveStatus === 'error' && saveError && (
        <div role="alert" className="bg-red-500/20 border border-red-400 text-white rounded-lg px-4 py-3 mb-4">
          {saveError}
        </div>
      )}

      {/* Definition name */}
      <div className="bg-white/95 rounded-xl px-6 py-5 mb-5">
        <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="def-name">
          Definition Name <span className="text-red-500">*</span>
        </label>
        <input
          id="def-name"
          type="text"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="e.g. My Card Game"
          value={draft.name}
          onChange={(e) =>
            setDraft((d) => ({ ...d, name: e.target.value, updatedAt: Date.now() }))
          }
        />
        {draft.name.trim() === '' && (
          <p className="text-red-500 text-xs mt-1">Name is required.</p>
        )}
      </div>

      {/* Validation errors panel (Task 4.2 — shows when save would be blocked) */}
      {validationErrors.length > 0 && (
        <div
          role="alert"
          className="bg-yellow-500/20 border border-yellow-400 text-yellow-100 rounded-lg px-4 py-3 mb-5"
        >
          <p className="font-semibold text-sm mb-1">⚠ Warnings — this definition will be saved as incomplete:</p>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            {validationErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Card catalog (Tasks 2.1–2.4) */}
      <div className="bg-white/95 rounded-xl px-6 py-5 mb-5">
        <h3 className="text-gray-800 font-semibold text-base mt-0 mb-4">Card Catalog</h3>

        {draft.cards.length === 0 ? (
          <p className="text-gray-400 text-sm italic mb-4">No cards yet. Add one below.</p>
        ) : (
          <table className="w-full text-sm mb-4 border-collapse">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-200">
                <th className="pb-2 pr-4 font-semibold">ID</th>
                <th className="pb-2 pr-4 font-semibold">Name</th>
                <th className="pb-2 pr-4 font-semibold">Type</th>
                <th className="pb-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {draft.cards.map((card) => (
                <tr
                  key={card.id}
                  className={`border-b border-gray-100 ${editingCardId === card.id ? 'bg-indigo-50' : ''}`}
                >
                  <td className="py-2 pr-4 font-mono text-gray-700 text-xs">{card.id}</td>
                  <td className="py-2 pr-4 text-gray-800">{card.name}</td>
                  <td className="py-2 pr-4 text-gray-500">{card.type ?? '—'}</td>
                  <td className="py-2 flex gap-3">
                    <button
                      className="text-indigo-600 text-xs hover:underline"
                      onClick={() => handleEditCard(card)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 text-xs hover:underline"
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Add / edit card form */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-3">
            {editingCardId ? 'Edit Card' : 'Add Card'}
          </p>
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <label className="text-xs text-gray-500 font-medium" htmlFor="card-name">
                Name
              </label>
              <input
                id="card-name"
                type="text"
                className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Ace of Spades"
                value={cardForm.name}
                onChange={(e) => handleCardFormChange('name', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-xs text-gray-500 font-medium" htmlFor="card-type">
                Type
              </label>
              <input
                id="card-type"
                type="text"
                className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="standard"
                value={cardForm.type}
                onChange={(e) => handleCardFormChange('type', e.target.value)}
              />
            </div>
            <button
              className="bg-indigo-600 text-white border-0 px-4 py-2 rounded-md text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:enabled:bg-indigo-700 self-end"
              onClick={handleAddOrUpdateCard}
              disabled={!cardForm.id.trim() || !cardForm.name.trim()}
            >
              {editingCardId ? 'Update' : 'Add Card'}
            </button>
            {editingCardId && (
              <button
                className="text-gray-500 border border-gray-300 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-gray-100 self-end"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
          {cardFormError && (
            <p className="text-red-500 text-xs mt-2">{cardFormError}</p>
          )}
        </div>
      </div>

      {/* Deck rules (Tasks 3.1–3.2) */}
      <div className="bg-white/95 rounded-xl px-6 py-5 mb-5">
        <h3 className="text-gray-800 font-semibold text-base mt-0 mb-4">Deck Rules</h3>
        <div className="flex gap-6 flex-wrap mb-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium" htmlFor="min-cards">
              Min Cards
            </label>
            <input
              id="min-cards"
              type="number"
              min={1}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-800 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={draft.deckRules.minCards}
              onChange={(e) => setDeckRuleField('minCards', Number(e.target.value))}
            />
            {draft.deckRules.minCards < 1 && (
              <p className="text-red-500 text-xs">Must be at least 1.</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium" htmlFor="max-cards">
              Max Cards
            </label>
            <input
              id="max-cards"
              type="number"
              min={1}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-800 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={draft.deckRules.maxCards}
              onChange={(e) => setDeckRuleField('maxCards', Number(e.target.value))}
            />
            {draft.deckRules.maxCards < draft.deckRules.minCards && (
              <p className="text-red-500 text-xs">Must be ≥ min cards.</p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
            Required Cards
          </p>
          {draft.cards.length === 0 ? (
            <p className="text-gray-400 text-xs italic">Add cards above to mark them as required.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {draft.cards.map((card) => (
                <label
                  key={card.id}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={draft.deckRules.requiredCardIds.includes(card.id)}
                    onChange={() => toggleRequiredCard(card.id)}
                  />
                  {card.name}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    )}
    </>
  );
};
