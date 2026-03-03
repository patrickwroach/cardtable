import React, { useState } from 'react';

interface GameLobbyProps {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({ onCreateGame, onJoinGame }) => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateGame(playerName.trim());
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && gameId.trim()) {
      onJoinGame(gameId.trim(), playerName.trim());
    }
  };

  if (mode === 'menu') {
    return (
      <div className="game-lobby">
        <div className="lobby-card">
          <h1>Card Game Platform</h1>
          <p className="subtitle">Multiplayer card games in real-time</p>
          <div className="menu-buttons">
            <button className="btn btn-primary" onClick={() => setMode('create')}>
              Create New Game
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('join')}>
              Join Existing Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="game-lobby">
        <div className="lobby-card">
          <h2>Create New Game</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn btn-primary">
                Create Game
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setMode('menu')}>
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="game-lobby">
      <div className="lobby-card">
        <h2>Join Game</h2>
        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="form-group">
            <label>Game ID</label>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter game ID"
              required
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn btn-primary">
              Join Game
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setMode('menu')}>
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
