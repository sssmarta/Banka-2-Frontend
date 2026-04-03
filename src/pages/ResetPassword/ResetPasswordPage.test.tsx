import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from './ResetPasswordPage';
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

const mockResetPassword = vi.fn();

vi.mock('../../services/authService', () => ({
  authService: {
    resetPassword: (...args: unknown[]) => mockResetPassword(...args),
  },
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('shows error when no token in URL', () => {
    renderWithProviders(<ResetPasswordPage />);

    expect(screen.getByText(/nevažeći link za resetovanje lozinke/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zatraži novi link/i })).toBeInTheDocument();
  });

  it('navigates to forgot-password when requesting new link (no token)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.click(screen.getByRole('button', { name: /zatraži novi link/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('renders password form when token is present', () => {
    mockSearchParams = new URLSearchParams('token=valid-token-123');
    renderWithProviders(<ResetPasswordPage />);

    expect(screen.getByText(/resetovanje lozinke/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nova lozinka/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/potvrdite lozinku/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /postavi novu lozinku/i })).toBeInTheDocument();
  });

  it('shows password constraints info box', () => {
    mockSearchParams = new URLSearchParams('token=valid-token-123');
    renderWithProviders(<ResetPasswordPage />);

    expect(screen.getByText(/8-32 karaktera/i)).toBeInTheDocument();
  });

  it('validates password constraints - too short', async () => {
    mockSearchParams = new URLSearchParams('token=valid-token-123');
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'Ab12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'Ab12');
    await user.click(screen.getByRole('button', { name: /postavi novu lozinku/i }));

    await waitFor(() => {
      expect(screen.getByText(/najmanje 8 karaktera/i)).toBeInTheDocument();
    });
  });

  it('validates password mismatch', async () => {
    mockSearchParams = new URLSearchParams('token=valid-token-123');
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'DifferentPass12');
    await user.click(screen.getByRole('button', { name: /postavi novu lozinku/i }));

    await waitFor(() => {
      expect(screen.getByText(/lozinke se ne poklapaju/i)).toBeInTheDocument();
    });
  });

  it('calls resetPassword service with token and new password', async () => {
    mockSearchParams = new URLSearchParams('token=valid-token-123');
    mockResetPassword.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'ValidPass12');
    await user.click(screen.getByRole('button', { name: /postavi novu lozinku/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: 'valid-token-123',
        newPassword: 'ValidPass12',
      });
    });
  });

  it('shows success message after reset', async () => {
    mockSearchParams = new URLSearchParams('token=valid-token-123');
    mockResetPassword.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'ValidPass12');
    await user.click(screen.getByRole('button', { name: /postavi novu lozinku/i }));

    await waitFor(() => {
      expect(screen.getByText(/lozinka uspešno promenjena/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /idi na prijavu/i })).toBeInTheDocument();
  });

  it('navigates to login from success view', async () => {
    mockSearchParams = new URLSearchParams('token=valid-token-123');
    mockResetPassword.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'ValidPass12');
    await user.click(screen.getByRole('button', { name: /postavi novu lozinku/i }));

    await waitFor(() => {
      expect(screen.getByText(/lozinka uspešno promenjena/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /idi na prijavu/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows server error on failed reset', async () => {
    mockSearchParams = new URLSearchParams('token=expired-token');
    mockResetPassword.mockRejectedValueOnce({
      response: { data: { message: 'Token expired' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'ValidPass12');
    await user.click(screen.getByRole('button', { name: /postavi novu lozinku/i }));

    await waitFor(() => {
      expect(screen.getByText('Token expired')).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    mockSearchParams = new URLSearchParams('token=valid-token-123');
    mockResetPassword.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/nova lozinka/i), 'ValidPass12');
    await user.type(screen.getByLabelText(/potvrdite lozinku/i), 'ValidPass12');
    await user.click(screen.getByRole('button', { name: /postavi novu lozinku/i }));

    await waitFor(() => {
      expect(screen.getByText(/postavljanje/i)).toBeInTheDocument();
    });
  });
});
