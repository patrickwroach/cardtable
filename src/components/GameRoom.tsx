import React, { useState } from 'react';
import type { GameState } from '../types/game';
import { GameTable } from './GameTable';
import { PlayerHand } from './PlayerHand';
import { drawCardFromDeck, playCard, startGame } from '../services/gameService';

interface GameRoomProps {
  game: GameState;
  currentPlayerId: string;
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

export const GameRoom: React.FC<GameRoomProps> = ({ game, currentPlayerId }) => {
  const [actionError, setActionError] = useState<string | null>(null);

  const currentPlayer = game.players[currentPlayerId];
  const isHost        = game.hostId === currentPlayerId;
  const otherPlayers  = Object.values(game.players).filter((p) => p.id !== currentPlayerId);

  const handleDrawCard = async () => {
    setActionError(null);
    try {
      await drawCardFromDeck(game.id, currentPlayerId, 1);
    } catch (error) {
      console.error('Error drawing card:', error);
      setActionError('Failed to draw card. Please try again.');
    }
  };

  const handlePlayCard = async (cardId: string) => {
    setActionError(null);
    try {
      await playCard(game.id, currentPlayerId, cardId);
    } catch (error) {
      console.error('Error playing card:', error);
      setActionError('Failed to play card. Please try again.');
    }
  };

  const handleStartGame = async () => {
    setActionError(null);
    try {
      await startGame(game.id);
    } catch (error) {
      console.error('Error starting game:', error);
      setActionError('Failed to start game. Please try again.');
    }
  };

  const copyGameId = () => {
    navigator.clipboard.writeText(game.id);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-5">
      {/* Header */}
      <div className="bg-white/95 rounded-xl px-5 py-5 mb-5 flex justify-between items-center flex-wrap gap-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mt-0 mb-2.5">Card Game</h2>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-gray-500 text-sm">Game ID:</span>
            <code className="bg-gray-100 px-3 py-1.5 rounded-md font-mono text-sm text-gray-800">
              {game.id}
            </code>
            <button
              className="bg-indigo-500 text-white border-0 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors hover:bg-indigo-600"
              onClick={copyGameId}
              aria-label="Copy game ID to clipboard"
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

      {/* Waiting state — host controls */}
      {game.status === 'waiting' && isHost && (
        <div className="bg-white/95 rounded-xl px-5 py-8 mb-5 text-center">
          <p className="text-gray-500 mb-5 text-base">Waiting for players to join. Share the Game ID above.</p>
          <button className="btn-primary--block" onClick={handleStartGame}>
            Start Game
          </button>
        </div>
      )}

      {/* Playing state */}
      {game.status === 'playing' && (
        <>
          <GameTable playedCards={game.playedCards} deckCount={game.deck.length} />

          <div className="flex justify-center gap-4 my-5">
            <button
              className="btn-primary--block"
              onClick={handleDrawCard}
              disabled={game.deck.length === 0}
            >
              Draw Card{game.deck.length > 0 && ` (${game.deck.length} left)`}
            </button>
          </div>

          <PlayerHand
            cards={currentPlayer?.hand ?? []}
            onCardClick={handlePlayCard}
            isCurrentPlayer
          />

          {otherPlayers.map((player) => (
            <div key={player.id} className="bg-white/10 rounded-xl p-5 my-5">
              <h4 className="text-white font-semibold mt-0 mb-4">
                {player.name}&apos;s Hand ({player.hand.length} cards)
              </h4>
              <div className="flex gap-2.5 flex-wrap">
                {player.hand.map((_, idx) => (
                  <div
                    key={`${player.id}-${idx}`}
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
