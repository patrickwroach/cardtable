import React, { useState } from 'react';
import type { GameState } from '../types/game';
import { GameTable } from './GameTable';
import { PlayerHand } from './PlayerHand';
import { drawCardFromDeck, playCard, startGame, generateShareableLink, advanceTurnOrPhase, forceEndSession } from '../services/gameService';

/** Minimum number of players required before the host can start. */
const MIN_PLAYERS_TO_START = 2;

interface GameRoomProps {
  game: GameState;
  currentPlayerId: string;
  onLeave?: () => void;
  /** minPlayers from the attached game definition, used to gate the Start button. */
  gameMinPlayers?: number;
}

const statusBadgeClass: Record<string, string> = {
  waiting:  'bg-yellow-400 text-gray-800',
  playing:  'bg-green-500 text-white',
  finished: 'bg-gray-400 text-white',
  aborted:  'bg-red-500 text-white',
};

const statusLabel: Record<string, string> = {
  waiting:  'Waiting for players',
  playing:  'In Progress',
  finished: 'Finished',
  aborted:  'Abandoned',
};

const endReasonLabel: Record<string, string> = {
  'win-condition': 'Win condition met',
  'force-ended':   'Session force-ended by host',
  'abandoned':     'Session abandoned',
};

export const GameRoom: React.FC<GameRoomProps> = ({ game, currentPlayerId, onLeave, gameMinPlayers }) => {
  const [actionError, setActionError]       = useState<string | null>(null);
  const [linkCopied, setLinkCopied]         = useState(false);
  const [showForceEndConfirm, setShowForceEndConfirm] = useState(false);

  const currentPlayer  = game.players[currentPlayerId];
  const isHost         = game.hostId === currentPlayerId;
  const otherPlayers   = Object.values(game.players).filter((p) => p.id !== currentPlayerId);
  const playerCount    = Object.keys(game.players).length;
  const minRequired    = gameMinPlayers ?? MIN_PLAYERS_TO_START;
  const canStart       = playerCount >= minRequired;

  // FEAT-004: derived turn / phase values (Tasks 4.1–4.3)
  const isMyTurn          = game.activePlayerId === currentPlayerId;
  const activePlayerName  = game.activePlayerId ? game.players[game.activePlayerId]?.name : undefined;
  const currentPhaseName  = game.phase ?? undefined;

  // FEAT-006: terminal-state helpers
  const isTerminal = game.status === 'finished' || game.status === 'aborted';
  const winnerName = game.winner ? (game.players[game.winner]?.name ?? game.winner) : null;

  const handleDrawCard = async () => {
    setActionError(null);
    try {
      await drawCardFromDeck(game.id, currentPlayerId, 1);
    } catch (error) {
      console.error('Error drawing card:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to draw card. Please try again.');
    }
  };

  const handlePlayCard = async (cardId: string) => {
    setActionError(null);
    try {
      await playCard(game.id, currentPlayerId, cardId);
    } catch (error) {
      console.error('Error playing card:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to play card. Please try again.');
    }
  };

  const handleStartGame = async () => {
    setActionError(null);
    try {
      await startGame(game.id);
    } catch (error) {
      console.error('Error starting game:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to start game. Please try again.');
    }
  };

  // FEAT-006: host force-end handlers (Tasks 3.2–3.3)
  const handleForceEnd = () => {
    setShowForceEndConfirm(true);
  };

  const handleForceEndConfirm = async () => {
    setShowForceEndConfirm(false);
    setActionError(null);
    try {
      await forceEndSession(game.id, currentPlayerId);
    } catch (error) {
      console.error('Error force-ending session:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to end session.');
    }
  };

  // FEAT-004: advance the turn / phase (Task 4.3 + 2.1)
  const handleEndTurn = async () => {
    setActionError(null);
    try {
      await advanceTurnOrPhase(game.id, currentPlayerId);
    } catch (error) {
      console.error('Error advancing turn:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to advance turn.');
    }
  };

  const copyGameId = () => {
    writeToClipboard(game.id);
  };

  const copyShareLink = () => {
    writeToClipboard(generateShareableLink(game.id));
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  /** Clipboard helper: prefers the async API, falls back to execCommand for non-secure contexts. */
  const writeToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(console.error);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-5">
      {/* Header */}
      <div className="bg-white/95 rounded-xl px-5 py-5 mb-5 flex justify-between items-center flex-wrap gap-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mt-0 mb-2.5">Card Game</h2>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-gray-500 text-sm">Room ID:</span>
            <code className="bg-gray-100 px-3 py-1.5 rounded-md font-mono text-sm text-gray-800">
              {game.id}
            </code>
            <button
              className="bg-indigo-500 text-white border-0 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors hover:bg-indigo-600"
              onClick={copyGameId}
              aria-label="Copy room ID to clipboard"
            >
              Copy ID
            </button>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              statusBadgeClass[game.status] ?? 'bg-gray-200 text-gray-800'
            }`}
          >
            {statusLabel[game.status] ?? game.status}
          </span>
          <span className="bg-black/10 px-4 py-2 rounded-full text-sm font-semibold text-gray-800">
            {Object.keys(game.players).length} player(s)
          </span>
          {onLeave && (
            <button
              className="bg-white/20 text-gray-800 border border-gray-300 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors hover:bg-white/50"
              onClick={onLeave}
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Inline action error */}
      {actionError && (
        <div
          role="alert"
          className="bg-red-500/20 border border-red-400 text-white rounded-lg px-4 py-3 mb-4 flex justify-between items-center"
        >
          <span>{actionError}</span>
          <button
            className="bg-transparent border-0 text-white cursor-pointer text-xl leading-none"
            onClick={() => setActionError(null)}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {/* Players list */}
      <div className="bg-white/95 rounded-xl px-5 py-4 mb-5">
        <h3 className="text-gray-800 text-base font-semibold mt-0 mb-2.5">Players:</h3>
        <div className="flex gap-2.5 flex-wrap">
          {Object.values(game.players).map((player) => (
            <span
              key={player.id}
              className={`px-3 py-1.5 rounded-md text-sm ${
                player.id === currentPlayerId
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {player.name}
              {player.id === game.hostId && ' 👑'}
              {player.id === currentPlayerId && ' (You)'}
            </span>
          ))}
        </div>
      </div>

      {/* FEAT-006 Task 2.1–2.2: End-game screen for terminal states */}
      {isTerminal && (
        <div className="bg-white/95 rounded-xl px-5 py-10 mb-5 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mt-0 mb-3">
            {game.status === 'finished' ? 'Game Over' : 'Session Ended'}
          </h3>
          {winnerName && (
            <p className="text-lg text-gray-700 mb-2">
              Winner: <span className="font-semibold text-indigo-600">{winnerName}</span>
            </p>
          )}
          {!winnerName && game.status === 'finished' && (
            <p className="text-lg text-gray-700 mb-2">It&apos;s a draw!</p>
          )}
          {game.endReason && (
            <p className="text-sm text-gray-500 mb-6">
              {endReasonLabel[game.endReason] ?? game.endReason}
            </p>
          )}
          {onLeave && (
            <button
              className="bg-indigo-500 text-white border-0 px-6 py-2.5 rounded-md cursor-pointer text-sm font-semibold transition-colors hover:bg-indigo-600"
              onClick={onLeave}
            >
              Leave Room
            </button>
          )}
        </div>
      )}

      {/* Waiting state — share panel + host controls */}
      {game.status === 'waiting' && (
        <div className="bg-white/95 rounded-xl px-5 py-8 mb-5">
          {/* Task 1.3: room code and shareable link */}
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm mb-3 font-semibold uppercase tracking-wide">Share this room</p>
            <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
              <span className="text-gray-500 text-sm">Room ID:</span>
              <code className="bg-gray-100 px-3 py-1.5 rounded-md font-mono text-sm text-gray-800">
                {game.id}
              </code>
              <button
                className="bg-indigo-500 text-white border-0 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors hover:bg-indigo-600"
                onClick={copyGameId}
                aria-label="Copy room ID"
              >
                Copy ID
              </button>
            </div>
            <button
              className="bg-green-500 text-white border-0 px-4 py-2 rounded-md cursor-pointer text-sm transition-colors hover:bg-green-600"
              onClick={copyShareLink}
              aria-label="Copy shareable link"
            >
              {linkCopied ? '✓ Link copied!' : 'Copy share link'}
            </button>
          </div>

          {/* Task 4.2: live roster with waiting count */}
          <p className="text-center text-gray-500 text-sm mb-5">
            {playerCount} player{playerCount !== 1 ? 's' : ''} in room
            {!canStart && ` — need at least ${minRequired} to start`}
          </p>

          {/* Task 5.2 & 5.3: start button host-only, disabled until min players met */}
          {isHost && (
            <div className="text-center">
              <button
                className="btn-primary--block"
                onClick={handleStartGame}
                disabled={!canStart}
                title={!canStart ? `Need at least ${minRequired} players to start` : undefined}
              >
                Start Game
              </button>
            </div>
          )}
          {!isHost && (
            <p className="text-center text-gray-500 text-sm">Waiting for the host to start…</p>
          )}
        </div>
      )}

      {/* Playing state */}
      {game.status === 'playing' && (
        <>
          {/* FEAT-006 Task 3.2–3.3: Host force-end control with confirmation */}
          {isHost && !showForceEndConfirm && (
            <div className="flex justify-end mb-3">
              <button
                className="bg-red-500 text-white border-0 px-4 py-2 rounded-md cursor-pointer text-sm font-semibold transition-colors hover:bg-red-600"
                onClick={handleForceEnd}
                aria-label="Force end this session"
              >
                Force End Session
              </button>
            </div>
          )}
          {isHost && showForceEndConfirm && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="force-end-heading"
              className="bg-red-50 border border-red-400 rounded-xl px-5 py-4 mb-3 flex flex-col gap-3"
            >
              <p id="force-end-heading" className="text-red-800 font-semibold text-sm">
                Are you sure you want to force-end this session? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  className="bg-red-600 text-white border-0 px-4 py-2 rounded-md cursor-pointer text-sm font-semibold transition-colors hover:bg-red-700"
                  onClick={handleForceEndConfirm}
                >
                  Yes, end session
                </button>
                <button
                  className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md cursor-pointer text-sm transition-colors hover:bg-gray-50"
                  onClick={() => setShowForceEndConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <GameTable
            playedCards={game.playedCards}
            deckCount={game.deck.length}
            activePlayerName={activePlayerName}
            currentPhaseName={currentPhaseName}
            turn={game.turn}
          />

          <div className="flex justify-center gap-4 my-5">
            <button
              className="btn-primary--block"
              onClick={handleDrawCard}
              disabled={!isMyTurn || game.deck.length === 0}
              title={!isMyTurn ? 'Wait for your turn' : undefined}
            >
              Draw Card{game.deck.length > 0 && ` (${game.deck.length} left)`}
            </button>
            {/* FEAT-004: End Turn button — only enabled when it is this player's turn */}
            <button
              className="btn-primary--block"
              onClick={handleEndTurn}
              disabled={!isMyTurn}
              title={!isMyTurn ? 'Wait for your turn' : undefined}
            >
              End Turn
            </button>
          </div>

          <PlayerHand
            cards={currentPlayer?.hand ?? []}
            onCardClick={handlePlayCard}
            isCurrentPlayer
            isActive={isMyTurn}
          />

          {otherPlayers.map((player) => (
            <div key={player.id} className="bg-white/10 rounded-xl p-5 my-5">
              <h4 className="text-white font-semibold mt-0 mb-4">
                {player.name}&apos;s Hand ({player.hand.length} cards)
              </h4>
              <div className="flex gap-2.5 flex-wrap">
                {player.hand.map((card) => (
                  <div
                    key={card.id}
                    className="w-[60px] h-[84px] rounded-md"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
