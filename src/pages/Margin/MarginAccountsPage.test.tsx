import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MarginAccountsPage from './MarginAccountsPage';
import type { MarginAccount, MarginTransaction } from '@/services/marginService';

// ---------- Mocks ----------

vi.mock('@/services/marginService', () => ({
  default: {
    getMyAccounts: vi.fn(),
    deposit: vi.fn(),
    withdraw: vi.fn(),
    getTransactions: vi.fn(),
  },
}));

import marginService from '@/services/marginService';
const mockMarginService = vi.mocked(marginService);

const activeAccount: MarginAccount = {
  id: 1,
  accountNumber: 'MA-001',
  linkedAccountId: 100,
  linkedAccountNumber: '265000000000000001',
  status: 'ACTIVE',
  initialMargin: 50000,
  loanValue: 200000,
  maintenanceMargin: 30000,
  bankParticipation: 25,
  currency: 'RSD',
};

const blockedAccount: MarginAccount = {
  id: 2,
  accountNumber: 'MA-002',
  linkedAccountId: 101,
  linkedAccountNumber: '265000000000000002',
  status: 'BLOCKED',
  initialMargin: 10000,
  loanValue: 50000,
  maintenanceMargin: 8000,
  bankParticipation: 30,
  currency: 'EUR',
};

const transactions: MarginTransaction[] = [
  {
    id: 1,
    marginAccountId: 1,
    type: 'DEPOSIT',
    amount: 25000,
    currency: 'RSD',
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 2,
    marginAccountId: 1,
    type: 'WITHDRAWAL',
    amount: 5000,
    currency: 'RSD',
    createdAt: '2026-03-16T14:00:00Z',
  },
];

function renderPage() {
  return render(<MarginAccountsPage />);
}

describe('MarginAccountsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMarginService.getMyAccounts.mockResolvedValue([activeAccount, blockedAccount]);
    mockMarginService.getTransactions.mockResolvedValue(transactions);
    mockMarginService.deposit.mockResolvedValue(undefined);
    mockMarginService.withdraw.mockResolvedValue(undefined);
  });

  it('shows loading skeleton initially', () => {
    mockMarginService.getMyAccounts.mockImplementation(() => new Promise(() => {}));
    renderPage();

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders page header', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Marzni racuni')).toBeInTheDocument();
    });
    expect(screen.getByText(/Pregled i upravljanje vasim marznim racunima/)).toBeInTheDocument();
  });

  it('renders account cards after loading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('MA-001')).toBeInTheDocument();
    });
    expect(screen.getByText('MA-002')).toBeInTheDocument();
  });

  it('shows linked account numbers', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/265000000000000001/)).toBeInTheDocument();
    });
    expect(screen.getByText(/265000000000000002/)).toBeInTheDocument();
  });

  it('shows AKTIVAN badge for active account', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('AKTIVAN')).toBeInTheDocument();
    });
  });

  it('shows BLOKIRAN badge and warning for blocked account', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('BLOKIRAN')).toBeInTheDocument();
    });
    expect(screen.getByText(/Racun je blokiran/)).toBeInTheDocument();
  });

  it('renders margin stats (initial margin, loan value, maintenance, bank participation)', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText(/Inicijalna margina/).length).toBe(2);
    });
    expect(screen.getAllByText(/Vrednost kredita/).length).toBe(2);
    expect(screen.getAllByText(/Margina odrzavanja/).length).toBe(2);
    expect(screen.getAllByText(/Ucesce banke/).length).toBe(2);
  });

  it('shows empty state when no accounts', async () => {
    mockMarginService.getMyAccounts.mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nemate otvorenih marznih racuna')).toBeInTheDocument();
    });
  });

  it('shows error alert on load failure', async () => {
    mockMarginService.getMyAccounts.mockRejectedValue(new Error('Server error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Greska pri ucitavanju')).toBeInTheDocument();
    });
  });

  it('handles 404 gracefully as empty state', async () => {
    const error404 = { response: { status: 404 } };
    mockMarginService.getMyAccounts.mockRejectedValue(error404);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nemate otvorenih marznih racuna')).toBeInTheDocument();
    });
  });

  it('disables withdraw button for blocked account', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('MA-002')).toBeInTheDocument();
    });

    const withdrawButtons = screen.getAllByRole('button', { name: /Isplati/i });
    // The blocked account's withdraw button should be disabled
    // blockedAccount is the second card, so its withdraw is the second one
    expect(withdrawButtons[1]).toBeDisabled();
  });

  it('expands transaction history on click', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('MA-001')).toBeInTheDocument();
    });

    const historyButtons = screen.getAllByText('Istorija transakcija');
    await user.click(historyButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Uplata')).toBeInTheDocument();
      expect(screen.getByText('Isplata')).toBeInTheDocument();
    });
  });

  it('shows empty transaction message when no transactions', async () => {
    mockMarginService.getTransactions.mockResolvedValue([]);
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('MA-001')).toBeInTheDocument();
    });

    const historyButtons = screen.getAllByText('Istorija transakcija');
    await user.click(historyButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Nema transakcija za prikaz.')).toBeInTheDocument();
    });
  });

  it('opens deposit modal on Uplati button click', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('MA-001')).toBeInTheDocument();
    });

    const depositButtons = screen.getAllByRole('button', { name: /Uplati/i });
    await user.click(depositButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Uplata na marzni racun')).toBeInTheDocument();
    });
  });

  it('opens withdraw modal on Isplati button click', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('MA-001')).toBeInTheDocument();
    });

    const withdrawButtons = screen.getAllByRole('button', { name: /Isplati/i });
    await user.click(withdrawButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Isplata sa marznog racuna')).toBeInTheDocument();
    });
  });

  it('submits deposit via marginService.deposit', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('MA-001')).toBeInTheDocument();
    });

    const depositButtons = screen.getAllByRole('button', { name: /Uplati/i });
    await user.click(depositButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Uplata na marzni racun')).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/Iznos/i);
    await user.type(amountInput, '10000');

    // Click the submit button inside the modal (not the "Uplati" in card)
    const submitBtn = screen.getByRole('button', { name: /^Uplati$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockMarginService.deposit).toHaveBeenCalledWith(1, 10000);
    });
  });
});
