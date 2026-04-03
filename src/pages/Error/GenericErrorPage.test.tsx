import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GenericErrorPage from './GenericErrorPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { ...window.location, reload: mockReload },
  writable: true,
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/error']}>
      <GenericErrorPage />
    </MemoryRouter>
  );
}

describe('GenericErrorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error heading', () => {
    renderPage();
    expect(screen.getByText(/Nešto je pošlo naopako/)).toBeInTheDocument();
  });

  it('renders error description', () => {
    renderPage();
    expect(screen.getByText(/Došlo je do neočekivane greške/)).toBeInTheDocument();
  });

  it('calls window.location.reload on retry button click', async () => {
    const user = userEvent.setup();
    renderPage();

    const btn = screen.getByRole('button', { name: /Pokušaj ponovo/i });
    await user.click(btn);

    expect(mockReload).toHaveBeenCalled();
  });

  it('navigates to home on home button click', async () => {
    const user = userEvent.setup();
    renderPage();

    const btn = screen.getByRole('button', { name: /Nazad na početnu/i });
    await user.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
