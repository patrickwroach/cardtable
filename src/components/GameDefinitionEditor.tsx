"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type {
  GameDefinition,
  CardDefinition,
  ZoneDefinition,
  ResourcePoolDefinition,
  TurnPhase,
  WinCondition,
  PhaseTransitionCondition,
} from '../types/gameDefinition';
import { CURRENT_SCHEMA_VERSION } from '../types/gameDefinition';
import {
  validateCardAndDeckRules,
  validateRulesDefinition,
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
    zones: [],
    resourcePools: [],
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
  const rulesValidation = useMemo(() => validateRulesDefinition(draft), [draft]);
  const playerCountInvalid =
    draft.minPlayers !== undefined && draft.maxPlayers !== undefined &&
    draft.maxPlayers < draft.minPlayers;
  const canSave = draft.name.trim() !== '' && rulesValidation.errors.length === 0 && !playerCountInvalid;

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

  // -----------  Zone helpers  -----------

  const EMPTY_ZONE_FORM: Omit<ZoneDefinition, ''> & Record<string, unknown> = {
    id: '', label: '', owner: 'global' as ZoneDefinition['owner'],
    visibility: 'public' as ZoneDefinition['visibility'],
    ordered: false, interactable: false, persistent: false,
  };
  const [zoneForm, setZoneForm] = useState(EMPTY_ZONE_FORM);
  const [zoneFormError, setZoneFormError] = useState<string | null>(null);

  const handleZoneFormChange = (field: string, value: unknown) => {
    setZoneFormError(null);
    if (field === 'label' && !zoneForm.id) {
      const autoId = slugify(value as string);
      setZoneForm((f) => ({ ...f, label: value as string, id: autoId }));
    } else {
      setZoneForm((f) => ({ ...f, [field]: value }));
    }
  };

  const handleAddZone = () => {
    const zone: ZoneDefinition = {
      id: zoneForm.id.trim(),
      label: zoneForm.label.trim(),
      owner: zoneForm.owner as ZoneDefinition['owner'],
      visibility: zoneForm.visibility as ZoneDefinition['visibility'],
      ordered: zoneForm.ordered as boolean,
      interactable: zoneForm.interactable as boolean,
      persistent: zoneForm.persistent as boolean,
    };
    if (!zone.id || !zone.label) { setZoneFormError('ID and label are required.'); return; }
    if (draft.zones.some((z) => z.id === zone.id)) {
      setZoneFormError(`Zone id "${zone.id}" already exists.`);
      return;
    }
    setDraft((d) => ({ ...d, zones: [...d.zones, zone], updatedAt: Date.now() }));
    setZoneForm(EMPTY_ZONE_FORM);
    setZoneFormError(null);
  };

  const handleDeleteZone = (id: string) =>
    setDraft((d) => ({ ...d, zones: d.zones.filter((z) => z.id !== id), updatedAt: Date.now() }));

  // -----------  Resource Pool helpers  -----------

  const EMPTY_POOL_FORM = {
    id: '', label: '',
    scope: 'persistent' as ResourcePoolDefinition['scope'],
    initialValue: 0, min: '', max: '',
    direction: 'bidirectional' as ResourcePoolDefinition['direction'],
    spendable: false, expireUnspent: false,
    owner: 'player' as ResourcePoolDefinition['owner'],
  };
  const [poolForm, setPoolForm] = useState(EMPTY_POOL_FORM);
  const [poolFormError, setPoolFormError] = useState<string | null>(null);

  const handlePoolFormChange = (field: string, value: unknown) => {
    setPoolFormError(null);
    if (field === 'label' && !poolForm.id) {
      const autoId = slugify(value as string);
      setPoolForm((f) => ({ ...f, label: value as string, id: autoId }));
    } else {
      setPoolForm((f) => ({ ...f, [field]: value }));
    }
  };

  const handleAddPool = () => {
    const pool: ResourcePoolDefinition = {
      id: poolForm.id.trim(),
      label: poolForm.label.trim(),
      scope: poolForm.scope,
      initialValue: Number(poolForm.initialValue),
      direction: poolForm.direction,
      spendable: poolForm.spendable,
      expireUnspent: poolForm.expireUnspent,
      owner: poolForm.owner,
      ...(poolForm.min !== '' ? { min: Number(poolForm.min) } : {}),
      ...(poolForm.max !== '' ? { max: Number(poolForm.max) } : {}),
    };
    if (!pool.id || !pool.label) { setPoolFormError('ID and label are required.'); return; }
    if (draft.resourcePools.some((p) => p.id === pool.id)) {
      setPoolFormError(`Pool id "${pool.id}" already exists.`);
      return;
    }
    setDraft((d) => ({ ...d, resourcePools: [...d.resourcePools, pool], updatedAt: Date.now() }));
    setPoolForm(EMPTY_POOL_FORM);
    setPoolFormError(null);
  };

  const handleDeletePool = (id: string) =>
    setDraft((d) => ({ ...d, resourcePools: d.resourcePools.filter((p) => p.id !== id), updatedAt: Date.now() }));

  // -----------  Turn Phase helpers  -----------

  const EMPTY_PHASE_FORM = { id: '', label: '', nextPhaseId: '' };
  const [phaseForm, setPhaseForm] = useState(EMPTY_PHASE_FORM);
  const [phaseFormError, setPhaseFormError] = useState<string | null>(null);

  const handlePhaseFormChange = (field: string, value: string) => {
    setPhaseFormError(null);
    if (field === 'label' && !phaseForm.id) {
      setPhaseForm((f) => ({ ...f, label: value, id: slugify(value) }));
    } else {
      setPhaseForm((f) => ({ ...f, [field]: value }));
    }
  };

  const handleAddPhase = () => {
    const phase: TurnPhase = {
      id: phaseForm.id.trim(),
      label: phaseForm.label.trim(),
      nextPhaseId: phaseForm.nextPhaseId.trim() || null,
      poolReplenishments: [],
      transitionConditions: [],
    };
    if (!phase.id || !phase.label) { setPhaseFormError('ID and label are required.'); return; }
    if (draft.turnPhases.some((p) => p.id === phase.id)) {
      setPhaseFormError(`Phase id "${phase.id}" already exists.`);
      return;
    }
    if (phase.nextPhaseId && !draft.turnPhases.some((p) => p.id === phase.nextPhaseId) && phaseForm.nextPhaseId.trim() !== '') {
      setPhaseFormError(`nextPhaseId "${phase.nextPhaseId}" does not match an existing phase — add the target phase first, or leave blank.`);
      return;
    }
    setDraft((d) => ({ ...d, turnPhases: [...d.turnPhases, phase], updatedAt: Date.now() }));
    setPhaseForm(EMPTY_PHASE_FORM);
    setPhaseFormError(null);
  };

  const handleDeletePhase = (id: string) =>
    setDraft((d) => ({
      ...d,
      turnPhases: d.turnPhases.filter((p) => p.id !== id),
      updatedAt: Date.now(),
    }));

  const handlePhaseNextChange = (phaseId: string, nextId: string) =>
    setDraft((d) => ({
      ...d,
      turnPhases: d.turnPhases.map((p) =>
        p.id === phaseId ? { ...p, nextPhaseId: nextId || null } : p
      ),
      updatedAt: Date.now(),
    }));

  // -----------  Win Condition helpers  -----------

  const EMPTY_WIN_FORM = {
    id: '', description: '',
    subject: 'any_player' as WinCondition['trigger']['subject'],
    poolId: '',
    operator: 'lte' as WinCondition['trigger']['operator'],
    value: 0,
    outcome: 'subject_wins' as WinCondition['outcome'],
  };
  const [winForm, setWinForm] = useState(EMPTY_WIN_FORM);
  const [winFormError, setWinFormError] = useState<string | null>(null);

  const handleWinFormChange = (field: string, value: unknown) => {
    setWinFormError(null);
    setWinForm((f) => ({ ...f, [field]: value }));
  };

  const handleAddWinCondition = () => {
    const wc: WinCondition = {
      id: winForm.id.trim() || `wc-${draft.winConditions.length + 1}`,
      ...(winForm.description.trim() ? { description: winForm.description.trim() } : {}),
      trigger: {
        subject: winForm.subject,
        poolId: winForm.poolId.trim(),
        operator: winForm.operator,
        value: Number(winForm.value),
      },
      outcome: winForm.outcome,
    };
    if (!wc.trigger.poolId) { setWinFormError('Pool ID is required.'); return; }
    if (!draft.resourcePools.some((p) => p.id === wc.trigger.poolId)) {
      setWinFormError(`Pool "${wc.trigger.poolId}" is not defined. Add a resource pool first.`);
      return;
    }
    if (draft.winConditions.some((w) => w.id === wc.id)) {
      setWinFormError(`Win condition id "${wc.id}" already exists.`);
      return;
    }
    setDraft((d) => ({ ...d, winConditions: [...d.winConditions, wc], updatedAt: Date.now() }));
    setWinForm(EMPTY_WIN_FORM);
    setWinFormError(null);
  };

  const handleDeleteWinCondition = (id: string) =>
    setDraft((d) => ({ ...d, winConditions: d.winConditions.filter((w) => w.id !== id), updatedAt: Date.now() }));

  // -----------  Phase sub-editor state (4.2, 4.3)  -----------

  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);
  const EMPTY_REPLENISH_FORM = { poolId: '', amount: '' };
  const [replenishForm, setReplenishForm] = useState(EMPTY_REPLENISH_FORM);
  const [replenishFormError, setReplenishFormError] = useState<string | null>(null);
  const EMPTY_TCOND_FORM = { type: 'pool_threshold', poolId: '', zoneId: '', operator: 'lte' as PhaseTransitionCondition['operator'], value: '' };
  const [tcondForm, setTcondForm] = useState(EMPTY_TCOND_FORM);
  const [tcondFormError, setTcondFormError] = useState<string | null>(null);

  const handleAddReplenishment = (phaseId: string) => {
    if (!replenishForm.poolId.trim()) { setReplenishFormError('Pool is required.'); return; }
    if (!draft.resourcePools.some((p) => p.id === replenishForm.poolId)) {
      setReplenishFormError(`Pool "${replenishForm.poolId}" not defined.`);
      return;
    }
    const amount: number | 'full' = replenishForm.amount === 'full' ? 'full' : Number(replenishForm.amount);
    setDraft((d) => ({
      ...d,
      turnPhases: d.turnPhases.map((ph) =>
        ph.id === phaseId
          ? { ...ph, poolReplenishments: [...ph.poolReplenishments, { poolId: replenishForm.poolId, amount }] }
          : ph
      ),
      updatedAt: Date.now(),
    }));
    setReplenishForm(EMPTY_REPLENISH_FORM);
    setReplenishFormError(null);
  };

  const handleRemoveReplenishment = (phaseId: string, poolId: string) =>
    setDraft((d) => ({
      ...d,
      turnPhases: d.turnPhases.map((ph) =>
        ph.id === phaseId
          ? { ...ph, poolReplenishments: ph.poolReplenishments.filter((r) => r.poolId !== poolId) }
          : ph
      ),
      updatedAt: Date.now(),
    }));

  const handleAddTransitionCondition = (phaseId: string) => {
    const needsPool = ['pool_threshold', 'pool_depleted', 'pool_full'].includes(tcondForm.type);
    const needsZone = ['zone_empty', 'zone_full'].includes(tcondForm.type);
    if (needsPool && !tcondForm.poolId.trim()) { setTcondFormError('Pool is required for this condition type.'); return; }
    if (needsPool && !draft.resourcePools.some((p) => p.id === tcondForm.poolId)) {
      setTcondFormError(`Pool "${tcondForm.poolId}" is not defined.`); return;
    }
    if (needsZone && !tcondForm.zoneId.trim()) { setTcondFormError('Zone is required for this condition type.'); return; }
    if (needsZone && !draft.zones.some((z) => z.id === tcondForm.zoneId)) {
      setTcondFormError(`Zone "${tcondForm.zoneId}" is not defined.`); return;
    }
    const cond: PhaseTransitionCondition = {
      type: tcondForm.type,
      ...(tcondForm.poolId.trim() ? { poolId: tcondForm.poolId.trim() } : {}),
      ...(tcondForm.zoneId.trim() ? { zoneId: tcondForm.zoneId.trim() } : {}),
      ...(tcondForm.operator ? { operator: tcondForm.operator } : {}),
      ...(tcondForm.value !== '' ? { value: Number(tcondForm.value) } : {}),
    };
    setDraft((d) => ({
      ...d,
      turnPhases: d.turnPhases.map((ph) =>
        ph.id === phaseId
          ? { ...ph, transitionConditions: [...ph.transitionConditions, cond] }
          : ph
      ),
      updatedAt: Date.now(),
    }));
    setTcondForm(EMPTY_TCOND_FORM);
    setTcondFormError(null);
  };

  const handleRemoveTransitionCondition = (phaseId: string, index: number) =>
    setDraft((d) => ({
      ...d,
      turnPhases: d.turnPhases.map((ph) =>
        ph.id === phaseId
          ? { ...ph, transitionConditions: ph.transitionConditions.filter((_, i) => i !== index) }
          : ph
      ),
      updatedAt: Date.now(),
    }));

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
            title={
              draft.name.trim() === ''
                ? 'A name is required before saving'
                : playerCountInvalid
                ? 'Max players must be ≥ min players'
                : rulesValidation.errors.length > 0
                ? 'Fix rule errors before saving'
                : validationErrors.length > 0 || rulesValidation.warnings.length > 0
                ? 'Saving with warnings — definition marked as incomplete'
                : undefined
            }
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

        {/* Player count */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="def-min-players">
              Min Players
            </label>
            <input
              id="def-min-players"
              type="number"
              min={1}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g. 2"
              value={draft.minPlayers ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : Math.max(1, parseInt(e.target.value, 10));
                setDraft((d) => ({ ...d, minPlayers: v, updatedAt: Date.now() }));
              }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="def-max-players">
              Max Players
            </label>
            <input
              id="def-max-players"
              type="number"
              min={draft.minPlayers ?? 1}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g. 4"
              value={draft.maxPlayers ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : Math.max(draft.minPlayers ?? 1, parseInt(e.target.value, 10));
                setDraft((d) => ({ ...d, maxPlayers: v, updatedAt: Date.now() }));
              }}
            />
          </div>
        </div>
        {draft.minPlayers !== undefined && draft.maxPlayers !== undefined && draft.maxPlayers < draft.minPlayers && (
          <p className="text-red-500 text-xs mt-1">Max players must be ≥ min players.</p>
        )}
      </div>

      {/* Validation errors panel (Task 4.2 / 6.5) */}
      {(validationErrors.length > 0 || rulesValidation.errors.length > 0 || rulesValidation.warnings.length > 0) && (
        <div className="rounded-lg px-4 py-3 mb-5 space-y-3">
          {rulesValidation.errors.length > 0 && (
            <div role="alert" className="bg-red-100 border-2 border-red-500 text-red-900 rounded-lg px-4 py-3">
              <p className="font-semibold text-sm mb-1">✕ Errors — save is blocked until these are resolved:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {rulesValidation.errors.map((err) => <li key={err}>{err}</li>)}
              </ul>
            </div>
          )}
          {(validationErrors.length > 0 || rulesValidation.warnings.length > 0) && (
            <div role="alert" className="bg-yellow-500/15 border border-yellow-400 text-yellow-800 rounded-lg px-4 py-3">
              <p className="font-semibold text-sm mb-1">⚠ Warnings — definition will be saved as incomplete:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {[...validationErrors, ...rulesValidation.warnings].map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          )}
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

      {/* Zones (Task 2.1–2.2) */}
      <div className="bg-white/95 rounded-xl px-6 py-5 mb-5">
        <h3 className="text-gray-800 font-semibold text-base mt-0 mb-4">Zones</h3>
        {draft.zones.length === 0 ? (
          <p className="text-gray-400 text-sm italic mb-4">No zones yet. Add one below.</p>
        ) : (
          <table className="w-full text-sm mb-4 border-collapse">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-200">
                <th className="pb-2 pr-3 font-semibold">ID</th>
                <th className="pb-2 pr-3 font-semibold">Label</th>
                <th className="pb-2 pr-3 font-semibold">Owner</th>
                <th className="pb-2 pr-3 font-semibold">Visibility</th>
                <th className="pb-2 pr-3 font-semibold">Flags</th>
                <th className="pb-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {draft.zones.map((z) => (
                <tr key={z.id} className="border-b border-gray-100">
                  <td className="py-2 pr-3 font-mono text-gray-700 text-xs">{z.id}</td>
                  <td className="py-2 pr-3">{z.label}</td>
                  <td className="py-2 pr-3 text-gray-500 capitalize">{z.owner}</td>
                  <td className="py-2 pr-3 text-gray-500 capitalize">{z.visibility}</td>
                  <td className="py-2 pr-3 text-gray-500 text-xs">
                    {[z.ordered && 'ordered', z.interactable && 'interactable', z.persistent && 'persistent']
                      .filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="py-2">
                    <button className="text-red-500 text-xs hover:underline" onClick={() => handleDeleteZone(z.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-3">Add Zone</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Label</label>
              <input type="text" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Hand" value={zoneForm.label as string}
                onChange={(e) => handleZoneFormChange('label', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">ID</label>
              <input type="text" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="hand" value={zoneForm.id as string}
                onChange={(e) => handleZoneFormChange('id', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Owner</label>
              <select className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={zoneForm.owner as string} onChange={(e) => handleZoneFormChange('owner', e.target.value)}>
                <option value="global">Global</option>
                <option value="per-player">Per-player</option>
                <option value="per-team">Per-team</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Visibility</label>
              <select className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={zoneForm.visibility as string} onChange={(e) => handleZoneFormChange('visibility', e.target.value)}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              {(['ordered', 'interactable', 'persistent'] as const).map((flag) => (
                <label key={flag} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer capitalize">
                  <input type="checkbox" className="rounded" checked={zoneForm[flag] as boolean}
                    onChange={(e) => handleZoneFormChange(flag, e.target.checked)} />
                  {flag}
                </label>
              ))}
            </div>
          </div>
          <button
            className="mt-4 bg-indigo-600 text-white border-0 px-4 py-2 rounded-md text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:enabled:bg-indigo-700"
            onClick={handleAddZone}
            disabled={!(zoneForm.id as string).trim() || !(zoneForm.label as string).trim()}
          >
            Add Zone
          </button>
          {zoneFormError && <p className="text-red-500 text-xs mt-2">{zoneFormError}</p>}
        </div>
      </div>

      {/* Resource Pools (Task 3.1–3.3) */}
      <div className="bg-white/95 rounded-xl px-6 py-5 mb-5">
        <h3 className="text-gray-800 font-semibold text-base mt-0 mb-4">Resource Pools</h3>
        {draft.resourcePools.length === 0 ? (
          <p className="text-gray-400 text-sm italic mb-4">No resource pools yet. Add one below.</p>
        ) : (
          <table className="w-full text-sm mb-4 border-collapse">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-200">
                <th className="pb-2 pr-3 font-semibold">ID</th>
                <th className="pb-2 pr-3 font-semibold">Label</th>
                <th className="pb-2 pr-3 font-semibold">Scope</th>
                <th className="pb-2 pr-3 font-semibold">Init</th>
                <th className="pb-2 pr-3 font-semibold">Dir</th>
                <th className="pb-2 pr-3 font-semibold">Owner</th>
                <th className="pb-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {draft.resourcePools.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-2 pr-3 font-mono text-gray-700 text-xs">{p.id}</td>
                  <td className="py-2 pr-3">{p.label}</td>
                  <td className="py-2 pr-3 text-gray-500 capitalize">{p.scope}</td>
                  <td className="py-2 pr-3 text-gray-500">{p.initialValue}</td>
                  <td className="py-2 pr-3 text-gray-500 capitalize">{p.direction}</td>
                  <td className="py-2 pr-3 text-gray-500 capitalize">{p.owner}</td>
                  <td className="py-2">
                    {p.direction === 'up' && p.expireUnspent && (
                      <span className="text-yellow-600 text-xs mr-2" title="Warning: 'up-only' direction with expireUnspent=true will discard gains each phase.">⚠</span>
                    )}
                    <button className="text-red-500 text-xs hover:underline" onClick={() => handleDeletePool(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-3">Add Resource Pool</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Label</label>
              <input type="text" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Life Points" value={poolForm.label}
                onChange={(e) => handlePoolFormChange('label', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">ID</label>
              <input type="text" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="life-points" value={poolForm.id}
                onChange={(e) => handlePoolFormChange('id', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Scope</label>
              <select className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={poolForm.scope} onChange={(e) => handlePoolFormChange('scope', e.target.value as ResourcePoolDefinition['scope'])}>
                <option value="persistent">Persistent</option>
                <option value="round">Round</option>
                <option value="turn">Turn</option>
                <option value="phase">Phase</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Initial Value</label>
              <input type="number" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={poolForm.initialValue} onChange={(e) => handlePoolFormChange('initialValue', Number(e.target.value))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Min (optional)</label>
              <input type="number" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="—" value={poolForm.min} onChange={(e) => handlePoolFormChange('min', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Max (optional)</label>
              <input type="number" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="—" value={poolForm.max} onChange={(e) => handlePoolFormChange('max', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Direction</label>
              <select className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={poolForm.direction} onChange={(e) => handlePoolFormChange('direction', e.target.value as ResourcePoolDefinition['direction'])}>
                <option value="bidirectional">Bidirectional</option>
                <option value="up">Up only</option>
                <option value="down">Down only</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Owner</label>
              <select className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={poolForm.owner} onChange={(e) => handlePoolFormChange('owner', e.target.value as ResourcePoolDefinition['owner'])}>
                <option value="player">Player</option>
                <option value="team">Team</option>
                <option value="global">Global</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              {(['spendable', 'expireUnspent'] as const).map((flag) => (
                <label key={flag} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" className="rounded" checked={poolForm[flag]}
                    onChange={(e) => handlePoolFormChange(flag, e.target.checked)} />
                  {flag === 'expireUnspent' ? 'Expire unspent' : 'Spendable'}
                </label>
              ))}
            </div>
          </div>
          <button
            className="mt-4 bg-indigo-600 text-white border-0 px-4 py-2 rounded-md text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:enabled:bg-indigo-700"
            onClick={handleAddPool}
            disabled={!poolForm.id.trim() || !poolForm.label.trim()}
          >
            Add Pool
          </button>
          {poolForm.direction === 'up' && poolForm.expireUnspent && (
            <p className="text-yellow-700 text-xs mt-2">⚠ Warning: up-only direction with expireUnspent will discard all accumulated value each phase reset.</p>
          )}
          {poolFormError && <p className="text-red-500 text-xs mt-2">{poolFormError}</p>}
        </div>
      </div>

      {/* Turn Phases (Task 4.1–4.5) */}
      <div className="bg-white/95 rounded-xl px-6 py-5 mb-5">
        <h3 className="text-gray-800 font-semibold text-base mt-0 mb-4">Turn Phases</h3>
        {draft.turnPhases.length === 0 ? (
          <p className="text-gray-400 text-sm italic mb-4">No phases yet. Add one below.</p>
        ) : (
          <div className="mb-4 space-y-2">
            {draft.turnPhases.map((ph) => (
              <div key={ph.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Phase header row */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50">
                  <span className="font-mono text-xs text-gray-500 w-28 shrink-0">{ph.id}</span>
                  <span className="text-sm text-gray-800 flex-1">{ph.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500">→</span>
                    <select
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      value={ph.nextPhaseId ?? ''}
                      onChange={(e) => handlePhaseNextChange(ph.id, e.target.value)}
                    >
                      <option value="">— loop / none —</option>
                      {draft.turnPhases.filter((p) => p.id !== ph.id).map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="text-indigo-600 text-xs hover:underline shrink-0"
                    onClick={() => setExpandedPhaseId(expandedPhaseId === ph.id ? null : ph.id)}
                  >
                    {expandedPhaseId === ph.id ? 'Close' : 'Configure'}
                  </button>
                  <button className="text-red-500 text-xs hover:underline shrink-0" onClick={() => handleDeletePhase(ph.id)}>Delete</button>
                </div>

                {/* Expandable sub-editor */}
                {expandedPhaseId === ph.id && (
                  <div className="border-t border-gray-200 px-4 py-4 bg-white space-y-5">

                    {/* Pool replenishments (4.2) */}
                    <div>
                      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Pool Replenishments at Phase Start</p>
                      {ph.poolReplenishments.length === 0 ? (
                        <p className="text-gray-400 text-xs italic mb-2">None.</p>
                      ) : (
                        <ul className="space-y-1 mb-2">
                          {ph.poolReplenishments.map((r) => (
                            <li key={r.poolId} className="flex items-center gap-3 text-xs text-gray-700">
                              <span className="font-mono">{r.poolId}</span>
                              <span className="text-gray-400">→</span>
                              <span>{r.amount === 'full' ? 'full restore' : `+${r.amount}`}</span>
                              <button className="text-red-500 hover:underline ml-auto" onClick={() => handleRemoveReplenishment(ph.id, r.poolId)}>×</button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-2 items-end flex-wrap">
                        {draft.resourcePools.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Pool</label>
                            <select className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              value={replenishForm.poolId} onChange={(e) => { setReplenishFormError(null); setReplenishForm((f) => ({ ...f, poolId: e.target.value })); }}>
                              <option value="">— select —</option>
                              {draft.resourcePools.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                          </div>
                        ) : (
                          <p className="text-yellow-700 text-xs">Define resource pools first.</p>
                        )}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-500">Amount (number or &quot;full&quot;)</label>
                          <input type="text" className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-24"
                            placeholder="5 or full" value={replenishForm.amount}
                            onChange={(e) => { setReplenishFormError(null); setReplenishForm((f) => ({ ...f, amount: e.target.value })); }} />
                        </div>
                        <button className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-md font-semibold disabled:opacity-40 transition-colors hover:enabled:bg-indigo-700"
                          disabled={!replenishForm.poolId || !replenishForm.amount}
                          onClick={() => handleAddReplenishment(ph.id)}>
                          Add
                        </button>
                      </div>
                      {replenishFormError && <p className="text-red-500 text-xs mt-1">{replenishFormError}</p>}
                    </div>

                    {/* Transition conditions (4.3 / 4.5) */}
                    <div>
                      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Transition Conditions</p>
                      {ph.transitionConditions.length === 0 ? (
                        <p className="text-gray-400 text-xs italic mb-2">None — phase advances manually.</p>
                      ) : (
                        <ul className="space-y-1 mb-2">
                          {ph.transitionConditions.map((c, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                              <span className="bg-gray-100 rounded px-1.5 py-0.5 font-mono">{c.type}</span>
                              {c.poolId && <span className="text-gray-500">pool: {c.poolId}</span>}
                              {c.zoneId && <span className="text-gray-500">zone: {c.zoneId}</span>}
                              {c.operator && <span>{c.operator} {c.value}</span>}
                              <button className="text-red-500 hover:underline ml-auto" onClick={() => handleRemoveTransitionCondition(ph.id, i)}>×</button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-2 items-end flex-wrap">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-500">Type</label>
                          <select className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            value={tcondForm.type}
                            onChange={(e) => { setTcondFormError(null); setTcondForm((f) => ({ ...f, type: e.target.value, poolId: '', zoneId: '', value: '' })); }}>
                            <option value="pool_threshold">Pool threshold</option>
                            <option value="pool_depleted">Pool depleted</option>
                            <option value="pool_full">Pool full</option>
                            <option value="zone_empty">Zone empty</option>
                            <option value="zone_full">Zone full</option>
                            <option value="turn_count">Turn count</option>
                            <option value="manual">Manual</option>
                          </select>
                        </div>
                        {['pool_threshold', 'pool_depleted', 'pool_full'].includes(tcondForm.type) && (
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Pool</label>
                            <select className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              value={tcondForm.poolId}
                              onChange={(e) => { setTcondFormError(null); setTcondForm((f) => ({ ...f, poolId: e.target.value })); }}>
                              <option value="">— select —</option>
                              {draft.resourcePools.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                          </div>
                        )}
                        {['zone_empty', 'zone_full'].includes(tcondForm.type) && (
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Zone</label>
                            <select className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              value={tcondForm.zoneId}
                              onChange={(e) => { setTcondFormError(null); setTcondForm((f) => ({ ...f, zoneId: e.target.value })); }}>
                              <option value="">— select —</option>
                              {draft.zones.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
                            </select>
                          </div>
                        )}
                        {['pool_threshold', 'turn_count'].includes(tcondForm.type) && (
                          <>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">Operator</label>
                              <select className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                value={tcondForm.operator ?? 'lte'}
                                onChange={(e) => setTcondForm((f) => ({ ...f, operator: e.target.value as PhaseTransitionCondition['operator'] }))}>
                                <option value="eq">=</option>
                                <option value="lt">&lt;</option>
                                <option value="lte">≤</option>
                                <option value="gt">&gt;</option>
                                <option value="gte">≥</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">Value</label>
                              <input type="number" className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-16"
                                value={tcondForm.value} onChange={(e) => setTcondForm((f) => ({ ...f, value: e.target.value }))} />
                            </div>
                          </>
                        )}
                        <button className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-md font-semibold transition-colors hover:bg-indigo-700 self-end"
                          onClick={() => handleAddTransitionCondition(ph.id)}>
                          Add Condition
                        </button>
                      </div>
                      {tcondFormError && <p className="text-red-500 text-xs mt-1">{tcondFormError}</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-3">Add Phase</p>
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <label className="text-xs text-gray-500 font-medium">Label</label>
              <input type="text" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Draw" value={phaseForm.label}
                onChange={(e) => handlePhaseFormChange('label', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-xs text-gray-500 font-medium">ID</label>
              <input type="text" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="draw" value={phaseForm.id}
                onChange={(e) => handlePhaseFormChange('id', e.target.value)} />
            </div>
            <button
              className="bg-indigo-600 text-white border-0 px-4 py-2 rounded-md text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:enabled:bg-indigo-700 self-end"
              onClick={handleAddPhase}
              disabled={!phaseForm.id.trim() || !phaseForm.label.trim()}
            >
              Add Phase
            </button>
          </div>
          {phaseFormError && <p className="text-red-500 text-xs mt-2">{phaseFormError}</p>}
        </div>
      </div>

      {/* Win / Loss Conditions (Task 5.1–5.3) */}
      <div className="bg-white/95 rounded-xl px-6 py-5 mb-5">
        <h3 className="text-gray-800 font-semibold text-base mt-0 mb-1">Win / Loss Conditions</h3>
        {draft.resourcePools.length === 0 && (
          <p className="text-yellow-700 text-xs italic mb-4">Define at least one resource pool above before adding win conditions.</p>
        )}
        {draft.winConditions.length === 0 ? (
          <p className="text-gray-400 text-sm italic mb-4">No conditions yet. Add one below.</p>
        ) : (
          <table className="w-full text-sm mb-4 border-collapse">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-200">
                <th className="pb-2 pr-3 font-semibold">ID</th>
                <th className="pb-2 pr-3 font-semibold">Description</th>
                <th className="pb-2 pr-3 font-semibold">Trigger</th>
                <th className="pb-2 pr-3 font-semibold">Outcome</th>
                <th className="pb-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {draft.winConditions.map((wc) => (
                <tr key={wc.id} className="border-b border-gray-100">
                  <td className="py-2 pr-3 font-mono text-gray-700 text-xs">{wc.id}</td>
                  <td className="py-2 pr-3 text-gray-500 text-xs">{wc.description ?? '—'}</td>
                  <td className="py-2 pr-3 text-gray-500 text-xs">
                    {wc.trigger.subject} · {wc.trigger.poolId} {wc.trigger.operator} {wc.trigger.value}
                  </td>
                  <td className="py-2 pr-3 text-gray-500 capitalize text-xs">{wc.outcome.replace(/_/g, ' ')}</td>
                  <td className="py-2">
                    <button className="text-red-500 text-xs hover:underline" onClick={() => handleDeleteWinCondition(wc.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-3">Add Condition</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Subject</label>
              <select className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={winForm.subject} onChange={(e) => handleWinFormChange('subject', e.target.value as WinCondition['trigger']['subject'])}>
                <option value="self">Self</option>
                <option value="opponent">Opponent</option>
                <option value="any_player">Any player</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Pool</label>
              {draft.resourcePools.length > 0 ? (
                <select className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={winForm.poolId} onChange={(e) => handleWinFormChange('poolId', e.target.value)}>
                  <option value="">— select pool —</option>
                  {draft.resourcePools.map((p) => (
                    <option key={p.id} value={p.id}>{p.label} ({p.id})</option>
                  ))}
                </select>
              ) : (
                <input type="text" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="pool-id" value={winForm.poolId}
                  onChange={(e) => handleWinFormChange('poolId', e.target.value)} />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Operator</label>
              <select className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={winForm.operator} onChange={(e) => handleWinFormChange('operator', e.target.value as WinCondition['trigger']['operator'])}>
                <option value="eq">= (equals)</option>
                <option value="lt">&lt; (less than)</option>
                <option value="lte">≤ (less than or equal)</option>
                <option value="gt">&gt; (greater than)</option>
                <option value="gte">≥ (greater than or equal)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Value</label>
              <input type="number" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={winForm.value} onChange={(e) => handleWinFormChange('value', Number(e.target.value))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Outcome</label>
              <select className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={winForm.outcome} onChange={(e) => handleWinFormChange('outcome', e.target.value as WinCondition['outcome'])}>
                <option value="subject_wins">Subject wins</option>
                <option value="subject_loses">Subject loses</option>
                <option value="draw">Draw</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Description (optional)</label>
              <input type="text" className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Player runs out of life" value={winForm.description}
                onChange={(e) => handleWinFormChange('description', e.target.value)} />
            </div>
          </div>
          <button
            className="mt-4 bg-indigo-600 text-white border-0 px-4 py-2 rounded-md text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:enabled:bg-indigo-700"
            onClick={handleAddWinCondition}
            disabled={!winForm.poolId.trim()}
          >
            Add Condition
          </button>
          {winFormError && <p className="text-red-500 text-xs mt-2">{winFormError}</p>}
        </div>
      </div>
    </div>
    )}
    </>
  );
};
