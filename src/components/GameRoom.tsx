import React from 'react';
import type { GameState } from '../types/game';
import { GameTable } from './GameTable';
import { PlayerHand } from './PlayerHand';
import { drawCardFromDeck, playCard, startGame } from '../services/gameService';

interface GameRoomProps {
  game: GameState;
  currentPlayerId: string;
}

export const GameRoom: React.FC<GameRoomProps> = ({ game, currentPlayerId }) => {
  const currentPlayer = game.players[currentPlayerId];
  const isHost = game.hostId === currentPlayerId;
  const otherPlayers = Object.values(game.players).filter(p => p.id !== currentPlayerId);

  const handleDrawCard = async () => {
    try {
      await drawCardFromDeck(game.id, currentPlayerId, 1);
    } catch (error) {
      console.error('Error drawing card:', error);
      alert('Failed to draw card');
    }
  };

  const handlePlayCard = async (cardId: string) => {
    try {
      await playCard(game.id, currentPlayerId, cardId);
    } catch (error) {
      console.error('Error playing card:', error);
      alert('Failed to play card');
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame(game.id);
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game');
    }
  };

  const copyGameId = () => {
    navigator.clipboard.writeText(game.id);
    alert('Game ID copied to clipboard!');
  };

  return (
    <div className="game-room">
      <div className="game-header">
        <div className="game-info">
          <h2>Card Game</h2>
          <div className="game-id-section">
            <span className="game-id-label">Game ID:</span>
            <code className="game-id">{game.id}</code>
            <button className="btn-copy" onClick={copyGameId}>📋 Copy</button>
          </div>
        </div>
        
        <div className="game-status">
          <span className={`status-badge ${game.status}`}>
            {game.status === 'waiting' ? 'Waiting for players' : 
             game.status === 'playing' ? 'In Progress' : 'Finished'}
          </span>
          <span className="player-count">
            {Object.keys(game.players).length} player(s)
          </span>
        </div>
      </div>

      <div className="players-list">
        <h3>Players:</h3>
        <div className="player-tags">
          {Object.values(game.players).map(player => (
            <span key={player.id} className={`player-tag ${player.id === currentPlayerId ? 'current' : ''}`}>
              {player.name} {player.id === game.hostId && '👑'}
              {player.id === currentPlayerId && ' (You)'}
            </span>
          ))}
        </div>
      </div>

      {game.status === 'waiting' && isHost && (
        <div className="waiting-section">
          <p>Waiting for players to join. Share the Game ID above.</p>
          <button className="btn btn-primary" onClick={handleStartGame}>
            Start Game
          </button>
        </div>
      )}

      {game.status === 'playing' && (
        <>
          <GameTable 
            playedCards={game.playedCards} 
            deckCount={game.deck.length}
          />

          <div className="game-actions">
            <button 
              className="btn btn-primary" 
              onClick={handleDrawCard}
              disabled={game.deck.length === 0}
            >
              Draw Card {game.deck.length > 0 && `(${game.deck.length} left)`}
            </button>
          </div>

          <PlayerHand
            cards={currentPlayer?.hand || []}
            onCardClick={handlePlayCard}
            isCurrentPlayer={true}
          />

          {otherPlayers.map(player => (
            <div key={player.id} className="opponent-section">
              <h4>{player.name}&apos;s Hand ({player.hand.length} cards)</h4>
              <div className="opponent-hand">
                {player.hand.map((card, idx) => (
                  <div key={`${player.id}-${idx}`} className="opponent-card"></div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
