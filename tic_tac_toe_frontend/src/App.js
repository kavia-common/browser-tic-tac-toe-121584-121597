import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { getSupabaseEnv } from './supabaseConfig';
import { getClient, ensurePlayers, fetchPlayerStats, recordDraw, recordWin } from './supabaseClient';

// PUBLIC_INTERFACE
function App() {
  /**
   * Main application component rendering the Tic Tac Toe game and controls.
   * Enhancements:
   *  - Prompts players to enter names before allowing play.
   *  - Connects to Supabase via REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.
   *  - Stores and retrieves per-player stats (wins, draws) and refreshes after each game.
   */
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  // Player names and gate to allow playing
  const [playerX, setPlayerX] = useState('');
  const [playerO, setPlayerO] = useState('');
  const namesSet = useMemo(() => Boolean(playerX && playerO), [playerX, playerO]);

  // Stats map: { [name]: { wins, draws } }
  const [stats, setStats] = useState({});

  const supabaseEnv = useMemo(() => getSupabaseEnv(), []);
  const supabase = useMemo(() => getClient(), []);
  const resultProcessedRef = useRef(false);

  const winnerInfo = useMemo(() => calculateWinner(squares), [squares]);
  const draw = useMemo(() => !winnerInfo && squares.every(Boolean), [winnerInfo, squares]);

  // Update document title with current game state
  useEffect(() => {
    if (winnerInfo) {
      document.title = `Tic Tac Toe — Winner: ${winnerInfo.winner}`;
    } else if (draw) {
      document.title = 'Tic Tac Toe — Draw';
    } else {
      document.title = `Tic Tac Toe — Next: ${xIsNext ? 'X' : 'O'}`;
    }
  }, [winnerInfo, draw, xIsNext]);

  // Initialize players in Supabase and fetch stats once names are set
  useEffect(() => {
    async function initAndLoad() {
      if (!namesSet || !supabase) return;
      await ensurePlayers([playerX, playerO]);
      const s = await fetchPlayerStats([playerX, playerO]);
      setStats(s);
    }
    initAndLoad();
  }, [namesSet, playerX, playerO, supabase]);

  // After a game completes, persist stats and fetch fresh values
  useEffect(() => {
    async function persistResult() {
      if (!namesSet || !supabase) return;
      if (resultProcessedRef.current) return;
      if (winnerInfo) {
        const winnerName = winnerInfo.winner === 'X' ? playerX : playerO;
        await recordWin(winnerName);
        resultProcessedRef.current = true;
      } else if (draw) {
        await recordDraw([playerX, playerO]);
        resultProcessedRef.current = true;
      } else {
        return;
      }
      // Refresh stats after update
      const s = await fetchPlayerStats([playerX, playerO]);
      setStats(s);
    }
    persistResult();
  }, [winnerInfo, draw, namesSet, playerX, playerO, supabase]);

  // PUBLIC_INTERFACE
  const handleClick = (i) => {
    /** Handle a click on a square at index i. */
    if (!namesSet) return; // Prevent play until names are set
    if (squares[i] || winnerInfo) return; // ignore if occupied or game over
    const next = squares.slice();
    next[i] = xIsNext ? 'X' : 'O';
    setSquares(next);
    setXIsNext(!xIsNext);
  };

  // PUBLIC_INTERFACE
  const resetGame = () => {
    /** Reset the board to initial state. */
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    resultProcessedRef.current = false;
  };

  const status = winnerInfo
    ? `Winner: ${winnerInfo.winner} (${winnerInfo.winner === 'X' ? playerX || 'Player X' : playerO || 'Player O'})`
    : draw
    ? 'Draw!'
    : `Next: ${xIsNext ? 'X' : 'O'}`;

  const supabaseStatus =
    supabaseEnv.url && supabaseEnv.key ? 'Supabase env loaded' : 'Supabase env not set';

  return (
    <div className="app-container">
      <div className="game-card">
        <header className="game-header">
          <h1 className="title">Tic Tac Toe</h1>
          <div className="player-indicators" aria-label="Player turn indicators">
            <div
              className={`chip chip-x ${!winnerInfo && !draw && xIsNext ? 'active' : ''}`}
              aria-current={!winnerInfo && !draw && xIsNext ? 'true' : 'false'}
              title={playerX ? `X — ${playerX}` : 'Player X'}
            >
              X {playerX ? `• ${playerX}` : ''}
            </div>
            <div
              className={`chip chip-o ${!winnerInfo && !draw && !xIsNext ? 'active' : ''}`}
              aria-current={!winnerInfo && !draw && !xIsNext ? 'true' : 'false'}
              title={playerO ? `O — ${playerO}` : 'Player O'}
            >
              O {playerO ? `• ${playerO}` : ''}
            </div>
          </div>
        </header>

        <main className="board-wrapper">
          <div className="board" role="grid" aria-label="Tic Tac Toe board">
            {squares.map((value, i) => {
              const isWinning = winnerInfo && winnerInfo.line && winnerInfo.line.includes(i);
              const canPlay = namesSet && !winnerInfo && !draw;
              return (
                <Square
                  key={i}
                  value={value}
                  onClick={() => handleClick(i)}
                  isWinning={!!isWinning}
                  disabled={!canPlay || !!value}
                />
              );
            })}
          </div>
        </main>

        <div className="status" aria-live="polite">
          {status}
        </div>

        {namesSet && (
          <section className="stats">
            <div className="stats-row">
              <PlayerStatsCard
                label={`X — ${playerX}`}
                wins={stats[playerX]?.wins ?? 0}
                draws={stats[playerX]?.draws ?? 0}
                color="x"
              />
              <PlayerStatsCard
                label={`O — ${playerO}`}
                wins={stats[playerO]?.wins ?? 0}
                draws={stats[playerO]?.draws ?? 0}
                color="o"
              />
            </div>
          </section>
        )}

        <div className="controls">
          <button className="btn-reset" onClick={resetGame} aria-label="Reset game">
            Reset Game
          </button>
        </div>

        <footer className="footer">
          <span className={`supabase-status ${supabaseEnv.url && supabaseEnv.key ? 'ok' : 'warn'}`}>
            {supabaseStatus}
          </span>
        </footer>
      </div>

      {!namesSet && (
        <NameOverlay
          onSubmit={async (x, o) => {
            setPlayerX(x.trim());
            setPlayerO(o.trim());
            // ensure and load stats will be handled by effect
          }}
          supabaseReady={Boolean(supabase)}
        />
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function Square({ value, onClick, isWinning, disabled }) {
  /** Render a single square button in the board. */
  const label = value ? `Cell value ${value}` : 'Empty cell';
  return (
    <button
      type="button"
      className={`square ${value === 'X' ? 'x' : value === 'O' ? 'o' : ''} ${isWinning ? 'winning' : ''}`}
      onClick={onClick}
      aria-label={label}
      role="gridcell"
      disabled={disabled || undefined}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function PlayerStatsCard({ label, wins, draws, color = 'x' }) {
  /** Display a compact stats card for a single player. */
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-values">
        <span className="stat-pill">Wins: {wins}</span>
        <span className="stat-pill">Draws: {draws}</span>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function NameOverlay({ onSubmit, supabaseReady }) {
  /**
   * Modal-like overlay to collect player names before the game can be played.
   * If Supabase is not configured, the overlay still allows local play,
   * but statistics will be disabled.
   */
  const [xName, setXName] = useState('');
  const [oName, setOName] = useState('');

  const canStart = xName.trim().length > 0 && oName.trim().length > 0;

  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2 className="overlay-title">Enter Player Names</h2>
        <p className="overlay-subtitle">Players must provide names before starting.</p>

        <div className="form-grid">
          <label className="input-group">
            <span className="input-label">Player X</span>
            <input
              className="input"
              type="text"
              placeholder="e.g., Alice"
              value={xName}
              onChange={(e) => setXName(e.target.value)}
            />
          </label>
          <label className="input-group">
            <span className="input-label">Player O</span>
            <input
              className="input"
              type="text"
              placeholder="e.g., Bob"
              value={oName}
              onChange={(e) => setOName(e.target.value)}
            />
          </label>
        </div>

        <div className="overlay-footer">
          <span className={`supabase-hint ${supabaseReady ? 'ok' : 'warn'}`}>
            {supabaseReady ? 'Stats will be saved to Supabase' : 'Supabase not configured — stats disabled'}
          </span>
          <button
            className="btn-primary"
            disabled={!canStart}
            onClick={() => onSubmit(xName, oName)}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function calculateWinner(sq) {
  /**
   * Determine the winner of the board, if any.
   * Returns:
   *  - null if no winner yet
   *  - { winner: 'X' | 'O', line: number[] } when a winning line exists
   */
  const lines = [
    [0, 1, 2], // rows
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6], // cols
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8], // diagonals
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (sq[a] && sq[a] === sq[b] && sq[a] === sq[c]) {
      return { winner: sq[a], line: [a, b, c] };
    }
  }
  return null;
}

export default App;
