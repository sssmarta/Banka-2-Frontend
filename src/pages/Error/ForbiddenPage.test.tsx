import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForbiddenPage from './ForbiddenPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/403']}>
      <ForbiddenPage />
    </MemoryRouter>
  );
}

describe('ForbiddenPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 403 error code', () => {
    renderPage();
    expect(screen.getByText('403')).toBeInTheDocument();
  });

  it('renders error heading', () => {
    renderPage();
    expect(screen.getByText('Nemate dozvolu za pristup')).toBeInTheDocument();
  });

  it('renders error description', () => {
    renderPage();
    expect(screen.getByText(/Nemate potrebna prava da pristupite ovoj stranici/)).toBeInTheDocument();
  });

  it('renders help suggestions', () => {
    renderPage();
    expect(screen.getByText(/Nemate potrebne permisije za ovu stranicu/)).toBeInTheDocument();
    expect(screen.getByText(/Kontaktirajte administratora/)).toBeInTheDocument();
  });

  it('navigates to home on button click', async () => {
    const user = userEvent.setup();
    renderPage();

    const btn = screen.getByRole('button', { name: /Nazad na početnu/i });
    await user.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
