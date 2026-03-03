"use client";

import { useState, useEffect } from 'react';
import { GameLobby } from './components/GameLobby';
import { GameRoom } from './components/GameRoom';
import { GameState } from './types/game';
import { createGame, joinGame, subscribeToGame } from './services/gameService';

function App() {
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [playerId] = useState(() => `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentGameId = currentGame?.id;

  useEffect(() => {
    if (!currentGameId) return;

    const unsubscribe = subscribeToGame(currentGameId, (gameState) => {
      setCurrentGame(gameState);
    });

    return () => unsubscribe();
  }, [currentGameId]);

  const handleCreateGame = async (playerName: string) => {
    setLoading(true);
    setError(null);
    try {
      const gameId = await createGame(playerId, playerName);
      // The subscription will update currentGame
      const unsubscribe = subscribeToGame(gameId, (gameState) => {
        setCurrentGame(gameState);
        unsubscribe();
      });
    } catch (err) {
      setError('Failed to create game. Please check your Firebase configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string, playerName: string) => {
    setLoading(true);
    setError(null);
    try {
      await joinGame(gameId, playerId, playerName);
      // The subscription will update currentGame
      const unsubscribe = subscribeToGame(gameId, (gameState) => {
        setCurrentGame(gameState);
        unsubscribe();
      });
    } catch (err) {
      setError('Failed to join game. Check the game ID and your Firebase configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <p>{error}</p>
          <button onClick={() => { setError(null); setCurrentGame(null); }}>
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {!currentGame ? (
        <GameLobby 
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
        />
      ) : (
        <GameRoom 
          game={currentGame}
          currentPlayerId={playerId}
        />
      )}
    </div>
  );
}

export default App;
