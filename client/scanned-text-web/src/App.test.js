import { render, screen } from '@testing-library/react';
import App from './App';

test('renders session check state', () => {
  render(<App />);
  expect(screen.getByText(/checking session/i)).toBeInTheDocument();
});
