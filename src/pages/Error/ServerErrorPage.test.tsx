import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ServerErrorPage from './ServerErrorPage';

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
    <MemoryRouter initialEntries={['/500']}>
      <ServerErrorPage />
    </MemoryRouter>
  );
}

describe('ServerErrorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 500 error code', () => {
    renderPage();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('renders error heading', () => {
    renderPage();
    expect(screen.getByText('Došlo je do greške na serveru')).toBeInTheDocument();
  });

  it('renders error description', () => {
    renderPage();
    expect(screen.getByText(/Trenutno nismo u mogućnosti da obradimo vaš zahtev/)).toBeInTheDocument();
  });

  it('renders help suggestions', () => {
    renderPage();
    expect(screen.getByText(/Pokušajte ponovo za par minuta/)).toBeInTheDocument();
    expect(screen.getByText(/Ako se problem ponavlja, kontaktirajte podršku/)).toBeInTheDocument();
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
