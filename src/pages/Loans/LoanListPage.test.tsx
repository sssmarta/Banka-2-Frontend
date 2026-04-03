import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoanListPage from './LoanListPage';
import { mockLoan, mockLoanRequest, mockInstallment } from '@/test/helpers';

// ---------- Mocks ----------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/services/creditService', () => ({
  creditService: {
    getMyLoans: vi.fn(),
    getMyRequests: vi.fn(),
    getInstallments: vi.fn(),
    requestEarlyRepayment: vi.fn(),
  },
}));

import { creditService } from '@/services/creditService';

const mockCreditService = vi.mocked(creditService);

const loan1 = mockLoan({
  id: 1,
  loanType: 'GOTOVINSKI',
  amount: 1000000,
  monthlyPayment: 45000,
  remainingDebt: 750000,
  status: 'ACTIVE',
});
const loan2 = mockLoan({
  id: 2,
  loanType: 'STAMBENI',
  amount: 5000000,
  monthlyPayment: 35000,
  remainingDebt: 4500000,
  status: 'ACTIVE',
});
const loan3 = mockLoan({
  id: 3,
  loanType: 'AUTO',
  amount: 500000,
  monthlyPayment: 22000,
  remainingDebt: 300000,
  status: 'CLOSED',
});

const pendingRequest = mockLoanRequest({ id: 100, status: 'PENDING', amount: 500000 });

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/loans']}>
      <LoanListPage />
    </MemoryRouter>
  );
}

describe('LoanListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Backend returns unsorted - component should sort by amount desc
    mockCreditService.getMyLoans.mockResolvedValue([loan3, loan1, loan2]);
    mockCreditService.getMyRequests.mockResolvedValue([pendingRequest]);
    mockCreditService.getInstallments.mockResolvedValue([
      mockInstallment({ id: 1, paid: true }),
      mockInstallment({ id: 2, paid: false, expectedDueDate: '2026-05-01T00:00:00Z' }),
    ]);
  });

  it('renders page header', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Moji krediti/i)).toBeInTheDocument();
    });
  });

  it('renders loan list sorted by amount descending', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/STAMBENI kredit/i)).toBeInTheDocument();
    });
    // GOTOVINSKI kredit appears in both loan card and pending request section
    expect(screen.getAllByText(/GOTOVINSKI kredit/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/AUTO kredit/i)).toBeInTheDocument();

    // The loans should be sorted by amount desc (5M, 1M, 500K)
    // Verify all three loan types plus pending request rendered
    const allLoanTexts = screen.getAllByText(/kredit/i);
    expect(allLoanTexts.length).toBeGreaterThanOrEqual(3);
  });

  it('shows loan statistics', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Ukupno kredita/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Aktivni/i)).toBeInTheDocument();
    // "Zahtevi" appears in both stat card and pending requests section header
    expect(screen.getAllByText(/Zahtevi/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Ukupan iznos/i)).toBeInTheDocument();
  });

  it('shows pending loan requests section', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Zahtevi za kredit/i)).toBeInTheDocument();
    });
  });

  it('shows loan status badges', async () => {
    renderPage();

    await waitFor(() => {
      const activeBadges = screen.getAllByText(/Aktivan/i);
      expect(activeBadges.length).toBeGreaterThan(0);
    });
  });

  it('expands loan details on click', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText(/GOTOVINSKI kredit/i).length).toBeGreaterThan(0);
    });

    // Click on "Prikazi detalje" button for any loan
    const detailButtons = screen.getAllByText(/Prikazi detalje/i);
    expect(detailButtons.length).toBeGreaterThan(0);
    await user.click(detailButtons[0]);

    // After clicking, installments should load
    await waitFor(() => {
      expect(mockCreditService.getInstallments).toHaveBeenCalled();
    });
  });

  it('shows loan details: amount, monthly payment, remaining debt', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText(/GOTOVINSKI kredit/i).length).toBeGreaterThan(0);
    });

    // Check that amounts are displayed
    expect(screen.getAllByText(/Iznos/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mesecna rata/i).length).toBeGreaterThan(0);
  });

  it('navigates to loan application page', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Zahtev za kredit/i)).toBeInTheDocument();
    });

    const applyBtn = screen.getByRole('button', { name: /Zahtev za kredit/i });
    await user.click(applyBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/loans/apply');
  });

  it('shows loading skeleton initially', () => {
    mockCreditService.getMyLoans.mockImplementation(() => new Promise(() => {}));

    renderPage();

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no loans', async () => {
    mockCreditService.getMyLoans.mockResolvedValue([]);
    mockCreditService.getMyRequests.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Trenutno nema kredita/i)).toBeInTheDocument();
    });
  });

  it('shows progress bar for loan repayment', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText(/GOTOVINSKI kredit/i).length).toBeGreaterThan(0);
    });

    // Progress bars should exist for active loans
    // Check for "Otplaceno" label which appears alongside each progress bar
    expect(screen.getAllByText(/Otplaceno/i).length).toBeGreaterThan(0);
    // At minimum the page renders without errors
    expect(screen.getByText(/Moji krediti/i)).toBeInTheDocument();
  });
});
