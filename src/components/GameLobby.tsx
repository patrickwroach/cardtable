import React, { useState } from 'react';

export interface GameDefinitionSummary {
  id: string;
  name: string;
  minPlayers?: number;
  maxPlayers?: number;
}

interface GameLobbyProps {
  onCreateGame: (playerName: string, definitionId?: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  gameDefinitions?: GameDefinitionSummary[];
  /** Called when joining via a ?join= URL param link */
  onJoinByLink: (gameId: string, playerName: string) => void;
  /** Pre-populate the join form with this room ID (from ?join= URL param) */
  roomToJoin?: string | null;
  /** Inline error to show in the join form (e.g. room not found) */
  joinError?: string | null;
  /** Disables submit buttons while a create/join request is in-flight */
  loading?: boolean;
  /** Opens the game definition editor */
  onOpenDefinitionEditor?: () => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  onCreateGame,
  onJoinGame,
  onJoinByLink,
  roomToJoin,
  joinError,
  loading = false,
  onOpenDefinitionEditor,
  gameDefinitions = [],
}) => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId]         = useState(roomToJoin ?? '');
  const [selectedDefinitionId, setSelectedDefinitionId] = useState('');

  // If arriving via a shareable link, go straight to the join form.
  const initialMode = roomToJoin ? 'join' : 'menu';
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>(initialMode);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) onCreateGame(playerName.trim(), selectedDefinitionId || undefined);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !gameId.trim()) return;
    if (roomToJoin && gameId.trim() === roomToJoin) {
      onJoinByLink(gameId.trim(), playerName.trim());
    } else {
      onJoinGame(gameId.trim(), playerName.trim());
    }
  };

  const inputClass =
    'w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-200 focus:outline-none focus:border-indigo-500 box-border';
  const labelClass = 'block mb-2 text-gray-700 font-semibold text-sm';

  if (mode === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="bg-white/95 rounded-2xl p-10 max-w-lg w-full shadow-2xl">
          <h1 className="text-3xl font-bold text-center text-gray-800 mt-0 mb-2.5">
            Card Table
          </h1>
          <p className="text-gray-500 text-center mb-10 text-base">Create and test stuff yo</p>
          <div className="flex flex-col gap-4">
            <button className="btn-primary" onClick={() => setMode('create')}>
              Create New Room
            </button>
            <button className="btn-secondary" onClick={() => setMode('join')}>
              Join Existing Room
            </button>
            {onOpenDefinitionEditor && (
              <button className="btn-secondary" onClick={onOpenDefinitionEditor}>
                Game Definition Editor
              </button>
            )}
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
            Create New Room
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
            {gameDefinitions.length > 0 && (
              <div className="mb-5">
                <label htmlFor="create-game-def" className={labelClass}>
                  Game
                </label>
                <select
                  id="create-game-def"
                  value={selectedDefinitionId}
                  onChange={(e) => setSelectedDefinitionId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Pick a game (optional) —</option>
                  {gameDefinitions.map((def) => {
                    const players =
                      def.minPlayers !== undefined || def.maxPlayers !== undefined
                        ? ` (${def.minPlayers ?? 1}–${def.maxPlayers ?? '∞'} players)`
                        : '';
                    return (
                      <option key={def.id} value={def.id}>
                        {def.name}{players}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            <div className="flex gap-3 mt-8">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating…' : 'Create Room'}
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

  // join mode
  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="bg-white/95 rounded-2xl p-10 max-w-lg w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-gray-800 mt-0 mb-8">
          {roomToJoin ? 'Join Room via Link' : 'Join Room'}
        </h2>

        {/* Task 2.3: inline join error */}
        {joinError && (
          <div
            role="alert"
            className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm"
          >
            {joinError}
          </div>
        )}

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
              Room ID
            </label>
            <input
              id="join-game-id"
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter room ID"
              required
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 mt-8">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Joining…' : 'Join Room'}
            </button>
            {!roomToJoin && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMode('menu')}
                disabled={loading}
              >
                Back
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
