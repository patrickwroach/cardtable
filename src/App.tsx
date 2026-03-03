"use client";

import { useState, useEffect } from 'react';
import { GameLobby } from './components/GameLobby';
import { GameRoom } from './components/GameRoom';
import type { GameState } from './types/game';
import { createGame, joinGame, subscribeToGame } from './services/gameService';

function App() {
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [currentGame, setCurrentGame]     = useState<GameState | null>(null);
  const [playerId]                         = useState(
    () => `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Single subscription managed by the effect — no duplicate subscribe/unsubscribe.
  useEffect(() => {
    if (!currentGameId) return;
    const unsubscribe = subscribeToGame(currentGameId, setCurrentGame);
    return () => unsubscribe();
  }, [currentGameId]);

  const handleCreateGame = async (playerName: string) => {
    setLoading(true);
    setError(null);
    try {
      const gameId = await createGame(playerId, playerName);
      setCurrentGameId(gameId);
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
      setCurrentGameId(gameId);
    } catch (err) {
      setError('Failed to join game. Check the game ID and your Firebase configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLobby = () => {
    setError(null);
    setCurrentGame(null);
    setCurrentGameId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800 flex flex-col items-center justify-center text-white text-xl">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800 flex flex-col items-center justify-center text-white text-xl text-center">
        <p className="bg-red-500/20 px-10 py-5 rounded-xl mb-5">{error}</p>
        <button
          onClick={handleBackToLobby}
          className="bg-white text-gray-800 border-0 px-6 py-3 rounded-lg font-semibold cursor-pointer transition-transform hover:-translate-y-0.5"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800">
      {!currentGame ? (
        <GameLobby
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          loading={loading}
        />
      ) : (
        <GameRoom game={currentGame} currentPlayerId={playerId} />
      )}
    </div>
  );
}

export default App;
