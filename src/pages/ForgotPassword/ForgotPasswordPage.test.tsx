import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from './ForgotPasswordPage';
import { renderWithProviders } from '../../test/test-utils';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockForgotPassword = vi.fn();

vi.mock('../../services/authService', () => ({
  authService: {
    forgotPassword: (...args: unknown[]) => mockForgotPassword(...args),
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the email input and submit button', () => {
    renderWithProviders(<ForgotPasswordPage />);

    expect(screen.getByLabelText(/email adresa/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pošalji link za resetovanje/i })).toBeInTheDocument();
  });

  it('renders the page heading', () => {
    renderWithProviders(<ForgotPasswordPage />);

    expect(screen.getByText(/zaboravljena lozinka/i)).toBeInTheDocument();
    expect(screen.getByText(/unesite vašu email adresu/i)).toBeInTheDocument();
  });

  it('validates email format - shows error on empty submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.click(screen.getByRole('button', { name: /pošalji link/i }));

    await waitFor(() => {
      expect(screen.getByText(/email je obavezan/i)).toBeInTheDocument();
    });
  });

  it('validates email format - shows error on invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email adresa/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /pošalji link/i }));

    await waitFor(() => {
      expect(screen.getByText(/validan email/i)).toBeInTheDocument();
    });
  });

  it('calls forgotPassword service with correct data', async () => {
    mockForgotPassword.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email adresa/i), 'test@banka.rs');
    await user.click(screen.getByRole('button', { name: /pošalji link/i }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'test@banka.rs' });
    });
  });

  it('shows success message after successful submission', async () => {
    mockForgotPassword.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email adresa/i), 'test@banka.rs');
    await user.click(screen.getByRole('button', { name: /pošalji link/i }));

    await waitFor(() => {
      expect(screen.getByText(/proverite vaš email/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/ukoliko nalog sa unetim email-om postoji/i)).toBeInTheDocument();
  });

  it('shows success message even on API error (no leak of user existence)', async () => {
    mockForgotPassword.mockRejectedValueOnce(new Error('Not found'));
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email adresa/i), 'test@banka.rs');
    await user.click(screen.getByRole('button', { name: /pošalji link/i }));

    await waitFor(() => {
      expect(screen.getByText(/proverite vaš email/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    mockForgotPassword.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email adresa/i), 'test@banka.rs');
    await user.click(screen.getByRole('button', { name: /pošalji link/i }));

    await waitFor(() => {
      expect(screen.getByText(/slanje/i)).toBeInTheDocument();
    });
  });

  it('success view has button that navigates back to login', async () => {
    mockForgotPassword.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email adresa/i), 'test@banka.rs');
    await user.click(screen.getByRole('button', { name: /pošalji link/i }));

    await waitFor(() => {
      expect(screen.getByText(/proverite vaš email/i)).toBeInTheDocument();
    });

    // There are two "Nazad na prijavu" buttons (top nav + success view); click the one inside the success card
    const buttons = screen.getAllByRole('button', { name: /nazad na prijavu/i });
    await user.click(buttons[buttons.length - 1]);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
