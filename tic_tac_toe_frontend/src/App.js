import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { getSupabaseEnv } from './supabaseConfig';

// PUBLIC_INTERFACE
function App() {
  /** Main application component rendering the Tic Tac Toe game and controls. */
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const supabaseEnv = useMemo(() => getSupabaseEnv(), []);

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

  // PUBLIC_INTERFACE
  const handleClick = (i) => {
    /** Handle a click on a square at index i. */
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
  };

  const status = winnerInfo
    ? `Winner: ${winnerInfo.winner}`
    : draw
    ? 'Draw!'
    : `Next: ${xIsNext ? 'X' : 'O'}`;

  const supabaseStatus =
    supabaseEnv.url && supabaseEnv.key
      ? 'Supabase env loaded'
      : 'Supabase env not set';

  return (
    <div className="app-container">
      <div className="game-card">
        <header className="game-header">
          <h1 className="title">Tic Tac Toe</h1>
          <div className="player-indicators" aria-label="Player turn indicators">
            <div
              className={`chip chip-x ${
                !winnerInfo && !draw && xIsNext ? 'active' : ''
              }`}
              aria-current={!winnerInfo && !draw && xIsNext ? 'true' : 'false'}
            >
              X
            </div>
            <div
              className={`chip chip-o ${
                !winnerInfo && !draw && !xIsNext ? 'active' : ''
              }`}
              aria-current={!winnerInfo && !draw && !xIsNext ? 'true' : 'false'}
            >
              O
            </div>
          </div>
        </header>

        <main className="board-wrapper">
          <div className="board" role="grid" aria-label="Tic Tac Toe board">
            {squares.map((value, i) => {
              const isWinning =
                winnerInfo && winnerInfo.line && winnerInfo.line.includes(i);
              return (
                <Square
                  key={i}
                  value={value}
                  onClick={() => handleClick(i)}
                  isWinning={!!isWinning}
                />
              );
            })}
          </div>
        </main>

        <div className="status" aria-live="polite">
          {status}
        </div>

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
    </div>
  );
}

// PUBLIC_INTERFACE
function Square({ value, onClick, isWinning }) {
  /** Render a single square button in the board. */
  const label = value ? `Cell value ${value}` : 'Empty cell';
  return (
    <button
      type="button"
      className={`square ${value === 'X' ? 'x' : value === 'O' ? 'o' : ''} ${
        isWinning ? 'winning' : ''
      }`}
      onClick={onClick}
      aria-label={label}
      role="gridcell"
      disabled={!!value || undefined}
    >
      {value}
    </button>
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
