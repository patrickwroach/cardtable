"use client";

import { useState, useEffect } from 'react';
import { GameLobby } from './components/GameLobby';
import type { GameDefinitionSummary } from './components/GameLobby';
import { GameRoom } from './components/GameRoom';
import { GameDefinitionEditor } from './components/GameDefinitionEditor';
import type { GameState } from './types/game';
import { createGame, joinGame, joinGameByLink, subscribeToGame } from './services/gameService';
import { ensureAnonymousAuth } from './firebase/config';
import { listGameDefinitions } from './services/gameDefinitionService';

function App() {
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [currentGame, setCurrentGame]     = useState<GameState | null>(null);
  const [playerId, setPlayerId]           = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [showDefinitionEditor, setShowDefinitionEditor] = useState(false);
  const [gameDefinitions, setGameDefinitions] = useState<GameDefinitionSummary[]>([]);

  // Task 3.2: detect ?join=<gameId> URL param on mount
  const [roomToJoin] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('join');
  });

  // Sign in anonymously on mount so Firestore rules pass.
  useEffect(() => {
    ensureAnonymousAuth()
      .then((uid) => {
        setPlayerId(uid);
        return listGameDefinitions();
      })
      .then((defs) => setGameDefinitions(defs.map((d) => ({ id: d.id, name: d.name, minPlayers: d.minPlayers, maxPlayers: d.maxPlayers }))))
      .catch(() => setError('Could not connect to authentication service. Please refresh.'));
  }, []);

  // Single subscription managed by the effect — no duplicate subscribe/unsubscribe.
  useEffect(() => {
    if (!currentGameId) return;
    const unsubscribe = subscribeToGame(currentGameId, setCurrentGame);
    return () => unsubscribe();
  }, [currentGameId]);

  const handleCreateGame = async (playerName: string, definitionId?: string) => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    setLobbyError(null);
    try {
      const gameId = await createGame(playerId, playerName, definitionId);
      setCurrentGameId(gameId);
    } catch (err) {
      setError('Failed to create game. Please check your Firebase configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string, playerName: string) => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    setLobbyError(null);
    try {
      await joinGame(gameId, playerId, playerName);
      setCurrentGameId(gameId);
      // Task 3.2: clear the ?join= param from the URL after a successful link join
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (err) {
      // Task 2.3: surface join errors inline in the lobby, not as a full-page takeover
      setLobbyError('Game not found. Check the code and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByLink = async (gameId: string, playerName: string) => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    setLobbyError(null);
    try {
      await joinGameByLink(gameId, playerId, playerName);
      setCurrentGameId(gameId);
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (err) {
      setLobbyError(err instanceof Error ? err.message : 'Could not join via link. The room may no longer exist.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLobby = () => {
    setError(null);
    setLobbyError(null);
    setCurrentGame(null);
    setCurrentGameId(null);
  };

  // Show spinner only while anonymous auth is resolving (before we have a UID).
  // Lobby-level loading is handled by disabling buttons — we must NOT unmount
  // GameLobby while a join is in-flight or its local mode/error state resets.
  if (!playerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800 flex flex-col items-center justify-center text-white text-xl gap-4">
        <div
          className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin"
          aria-label="Connecting…"
        />
        <span>Connecting…</span>
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

  // Task 4.3: brief loading state while subscription delivers the first snapshot
  if (currentGameId && !currentGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800 flex flex-col items-center justify-center text-white text-xl gap-4">
        <div
          className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin"
          aria-label="Loading room…"
        />
        <span>Loading room…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800">
      {showDefinitionEditor && playerId ? (
        <GameDefinitionEditor
          creatorId={playerId}
          onClose={() => {
            setShowDefinitionEditor(false);
            listGameDefinitions()
              .then((defs) => setGameDefinitions(defs.map((d) => ({ id: d.id, name: d.name, minPlayers: d.minPlayers, maxPlayers: d.maxPlayers }))))
              .catch(() => {/* non-fatal */});
          }}
        />
      ) : !currentGame ? (
        <>
          <GameLobby
            onCreateGame={handleCreateGame}
            onJoinGame={handleJoinGame}
            onJoinByLink={handleJoinByLink}
            roomToJoin={roomToJoin}
            joinError={lobbyError}
            loading={loading}
            onOpenDefinitionEditor={() => setShowDefinitionEditor(true)}
            gameDefinitions={gameDefinitions}
          />
          {/* FEAT-007: definition editor access */}
        </>
      ) : (
        <GameRoom
            game={currentGame}
            currentPlayerId={playerId}
            onLeave={handleBackToLobby}
            gameMinPlayers={gameDefinitions.find((d) => d.id === currentGame.gameDefinitionId)?.minPlayers}
          />
      )}
    </div>
  );
}

export default App;
