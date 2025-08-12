import { render, screen } from '@testing-library/react';
import App from './App';

test('renders title and reset button', () => {
  render(<App />);
  expect(screen.getByText(/Tic Tac Toe/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /reset game/i })).toBeInTheDocument();
});

test('renders status for next player', () => {
  render(<App />);
  expect(screen.getByText(/Next: X/i)).toBeInTheDocument();
});
