import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotFoundPage from './NotFoundPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/404']}>
      <NotFoundPage />
    </MemoryRouter>
  );
}

describe('NotFoundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 404 error code', () => {
    renderPage();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders error heading', () => {
    renderPage();
    expect(screen.getByText('Stranica nije pronađena')).toBeInTheDocument();
  });

  it('renders error description', () => {
    renderPage();
    expect(screen.getByText(/Stranica koju pokušavate da otvorite ne postoji/)).toBeInTheDocument();
  });

  it('renders help suggestions', () => {
    renderPage();
    expect(screen.getByText(/Proverite da li ste ispravno uneli adresu/)).toBeInTheDocument();
    expect(screen.getByText(/Možda je stranica premeštena ili obrisana/)).toBeInTheDocument();
  });

  it('navigates to home on home button click', async () => {
    const user = userEvent.setup();
    renderPage();

    const btn = screen.getByRole('button', { name: /Nazad na početnu/i });
    await user.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to login on login button click', async () => {
    const user = userEvent.setup();
    renderPage();

    const btn = screen.getByRole('button', { name: /Prijavi se/i });
    await user.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
