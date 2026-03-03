import React, { useState } from 'react';

interface GameLobbyProps {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  /** Disables submit buttons while a create/join request is in-flight */
  loading?: boolean;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  onCreateGame,
  onJoinGame,
  loading = false,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId]         = useState('');
  const [mode, setMode]             = useState<'menu' | 'create' | 'join'>('menu');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) onCreateGame(playerName.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && gameId.trim()) onJoinGame(gameId.trim(), playerName.trim());
  };

  const inputClass =
    'w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-200 focus:outline-none focus:border-indigo-500 box-border';
  const labelClass = 'block mb-2 text-gray-700 font-semibold text-sm';

  if (mode === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="bg-white/95 rounded-2xl p-10 max-w-lg w-full shadow-2xl">
          <h1 className="text-3xl font-bold text-center text-gray-800 mt-0 mb-2.5">
            Card Game Platform
          </h1>
          <p className="text-gray-500 text-center mb-10 text-base">Multiplayer card games in real-time</p>
          <div className="flex flex-col gap-4">
            <button className="btn-primary" onClick={() => setMode('create')}>
              Create New Game
            </button>
            <button className="btn-secondary" onClick={() => setMode('join')}>
              Join Existing Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="bg-white/95 rounded-2xl p-10 max-w-lg w-full shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-gray-800 mt-0 mb-8">
            Create New Game
          </h2>
          <form onSubmit={handleCreate}>
            <div className="mb-5">
              <label htmlFor="create-player-name" className={labelClass}>
                Your Name
              </label>
              <input
                id="create-player-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
                className={inputClass}
              />
            </div>
            <div className="flex gap-3 mt-8">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating…' : 'Create Game'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMode('menu')}
                disabled={loading}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="bg-white/95 rounded-2xl p-10 max-w-lg w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-gray-800 mt-0 mb-8">Join Game</h2>
        <form onSubmit={handleJoin}>
          <div className="mb-5">
            <label htmlFor="join-player-name" className={labelClass}>
              Your Name
            </label>
            <input
              id="join-player-name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              required
              className={inputClass}
            />
          </div>
          <div className="mb-5">
            <label htmlFor="join-game-id" className={labelClass}>
              Game ID
            </label>
            <input
              id="join-game-id"
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter game ID"
              required
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 mt-8">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Joining…' : 'Join Game'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMode('menu')}
              disabled={loading}
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
