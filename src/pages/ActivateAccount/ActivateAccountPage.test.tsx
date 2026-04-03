import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivateAccountPage from './ActivateAccountPage';
import { renderWithProviders } from '../../test/test-utils';

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

const mockActivateAccount = vi.fn();

vi.mock('../../services/authService', () => ({
  authService: {
    activateAccount: (...args: unknown[]) => mockActivateAccount(...args),
  },
}));

describe('ActivateAccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('shows error when no token in URL', () => {
    renderWithProviders(<ActivateAccountPage />);

    expect(screen.getByText(/nevažeći link za aktivaciju/i)).toBeInTheDocument();
  });

  it('renders activation form when token is present', () => {
    mockSearchParams = new URLSearchParams('token=activation-token-abc');
    renderWithProviders(<ActivateAccountPage />);

    expect(screen.getByText(/aktivacija naloga/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nova lozinka/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/potvrdite lozinku/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aktiviraj nalog/i })).toBeInTheDocument();
  });

  it('shows password constraint info', () => {
    mockSearchParams = new URLSearchParams('token=activation-token-abc');
    renderWithProviders(<ActivateAccountPage />);

    expect(screen.getByText(/8-32 karaktera/i)).toBeInTheDocument();
  });

  it('validates password - shows error on empty submit', async () => {
    mockSearchParams = new URLSearchParams('token=activation-token-abc');
    const user = userEvent.setup();
    renderWithProviders(<ActivateAccountPage />);

    await user.click(screen.getByRole('button', { name: /aktiviraj nalog/i }));

    await waitFor(() => {
      expect(screen.getByText(/najmanje 8 karaktera/i)).toBeInTheDocument();
    });
  });

  it('validates password mismatch', async () => {
    mockSearchParams = new URLSearchParams('token=activation-token-abc');
    const user = userEvent.setup();
    renderWithProviders(<ActivateAccountPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'Mismatch12');
    await user.click(screen.getByRole('button', { name: /aktiviraj nalog/i }));

    await waitFor(() => {
      expect(screen.getByText(/lozinke se ne poklapaju/i)).toBeInTheDocument();
    });
  });

  it('validates password needs uppercase', async () => {
    mockSearchParams = new URLSearchParams('token=activation-token-abc');
    const user = userEvent.setup();
    renderWithProviders(<ActivateAccountPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'nouppercase12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'nouppercase12');
    await user.click(screen.getByRole('button', { name: /aktiviraj nalog/i }));

    await waitFor(() => {
      expect(screen.getByText(/veliko slovo/i)).toBeInTheDocument();
    });
  });

  it('calls activateAccount service with token and password', async () => {
    mockSearchParams = new URLSearchParams('token=activation-token-abc');
    mockActivateAccount.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ActivateAccountPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'ValidPass12');
    await user.click(screen.getByRole('button', { name: /aktiviraj nalog/i }));

    await waitFor(() => {
      expect(mockActivateAccount).toHaveBeenCalledWith({
        token: 'activation-token-abc',
        password: 'ValidPass12',
      });
    });
  });

  it('shows success message after activation', async () => {
    mockSearchParams = new URLSearchParams('token=activation-token-abc');
    mockActivateAccount.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ActivateAccountPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'ValidPass12');
    await user.click(screen.getByRole('button', { name: /aktiviraj nalog/i }));

    await waitFor(() => {
      expect(screen.getByText(/nalog uspešno aktiviran/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /idi na prijavu/i })).toBeInTheDocument();
  });

  it('navigates to login from success view', async () => {
    mockSearchParams = new URLSearchParams('token=activation-token-abc');
    mockActivateAccount.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ActivateAccountPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'ValidPass12');
    await user.click(screen.getByRole('button', { name: /aktiviraj nalog/i }));

    await waitFor(() => {
      expect(screen.getByText(/nalog uspešno aktiviran/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /idi na prijavu/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows server error on failed activation', async () => {
    mockSearchParams = new URLSearchParams('token=expired-token');
    mockActivateAccount.mockRejectedValueOnce({
      response: { data: { message: 'Token istekao' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<ActivateAccountPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'ValidPass12');
    await user.click(screen.getByRole('button', { name: /aktiviraj nalog/i }));

    await waitFor(() => {
      expect(screen.getByText('Token istekao')).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    mockSearchParams = new URLSearchParams('token=activation-token-abc');
    mockActivateAccount.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<ActivateAccountPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'ValidPass12');
    await user.click(screen.getByRole('button', { name: /aktiviraj nalog/i }));

    await waitFor(() => {
      // "Aktivacija..." is the loading text on the submit button
      expect(screen.getByText('Aktivacija...')).toBeInTheDocument();
    });
  });
});
