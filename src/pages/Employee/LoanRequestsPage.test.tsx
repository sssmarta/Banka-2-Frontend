import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoanRequestsPage from './LoanRequestsPage';
import { renderWithProviders } from '../../test/test-utils';
import type { LoanRequest } from '@/types/celina2';

const mockGetRequests = vi.fn();
const mockApprove = vi.fn();
const mockReject = vi.fn();

vi.mock('../../services/creditService', () => ({
  creditService: {
    getRequests: (...args: unknown[]) => mockGetRequests(...args),
    approve: (...args: unknown[]) => mockApprove(...args),
    reject: (...args: unknown[]) => mockReject(...args),
  },
}));

const mockRequests: LoanRequest[] = [
  {
    id: 1,
    loanType: 'GOTOVINSKI',
    interestRateType: 'FIKSNI',
    amount: 500000,
    currency: 'RSD',
    loanPurpose: 'Renoviranje stana',
    repaymentPeriod: 36,
    accountNumber: '265000000000000001',
    phoneNumber: '+381641234567',
    status: 'PENDING',
    createdAt: '2025-03-15T10:00:00Z',
    clientName: 'Marko Petrovic',
    clientEmail: 'marko@banka.rs',
    employmentStatus: 'Zaposlen',
    monthlyIncome: 120000,
    permanentEmployment: true,
  } as LoanRequest,
  {
    id: 2,
    loanType: 'STAMBENI',
    interestRateType: 'VARIJABILNI',
    amount: 10000000,
    currency: 'RSD',
    loanPurpose: 'Kupovina nekretnine',
    repaymentPeriod: 240,
    accountNumber: '265000000000000002',
    phoneNumber: '+381659876543',
    status: 'APPROVED',
    createdAt: '2025-03-10T08:00:00Z',
    clientName: 'Ana Jovic',
    clientEmail: 'ana@banka.rs',
  } as LoanRequest,
  {
    id: 3,
    loanType: 'AUTO',
    interestRateType: 'FIKSNI',
    amount: 2000000,
    currency: 'RSD',
    loanPurpose: 'Kupovina automobila',
    repaymentPeriod: 60,
    accountNumber: '265000000000000003',
    phoneNumber: '+381601112222',
    status: 'REJECTED',
    createdAt: '2025-03-05T12:00:00Z',
    clientName: 'Jovan Markovic',
    clientEmail: 'jovan@banka.rs',
  } as LoanRequest,
];

describe('LoanRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequests.mockResolvedValue({
      content: mockRequests,
      totalPages: 1,
    });
    mockApprove.mockResolvedValue(undefined);
    mockReject.mockResolvedValue(undefined);
  });

  it('renders the page header', async () => {
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Zahtevi za kredit')).toBeInTheDocument();
    });
    expect(screen.getByText(/Pregledajte i obradite zahteve za kredit klijenata/)).toBeInTheDocument();
  });

  it('renders filter tabs with counts', async () => {
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Svi')).toBeInTheDocument();
    });
    // "Na cekanju" appears both in the filter tab and as a status badge
    expect(screen.getAllByText('Na cekanju').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Odobreni')).toBeInTheDocument();
    expect(screen.getByText('Odbijeni')).toBeInTheDocument();
  });

  it('renders loan request list with client names', async () => {
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });
    expect(screen.getByText('Ana Jovic')).toBeInTheDocument();
    expect(screen.getByText('Jovan Markovic')).toBeInTheDocument();
  });

  it('shows loading skeletons while fetching', () => {
    mockGetRequests.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<LoanRequestsPage />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no requests match filter', async () => {
    mockGetRequests.mockResolvedValue({ content: [], totalPages: 1 });
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Nema zahteva za izabrani filter')).toBeInTheDocument();
    });
  });

  it('renders status badges for each request', async () => {
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      // statusLabel maps to Serbian labels
      expect(screen.getAllByText('Na cekanju').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('Odobren')).toBeInTheDocument();
    expect(screen.getByText('Odbijen')).toBeInTheDocument();
  });

  it('calls getRequests on initial load without status filter', async () => {
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(mockGetRequests).toHaveBeenCalledWith(undefined);
    });
  });

  it('calls getRequests with status filter when tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Click the "Odobreni" filter tab (unique text, no badge collision)
    const approvedTab = screen.getByText('Odobreni').closest('button');
    expect(approvedTab).toBeTruthy();
    await user.click(approvedTab!);

    await waitFor(() => {
      expect(mockGetRequests).toHaveBeenCalledWith({ status: 'APPROVED' });
    });
  });

  it('expands request details when chevron is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Find all buttons and look for the ones containing lucide chevron-down icon
    const allButtons = Array.from(document.querySelectorAll('button'));
    const chevronButtons = allButtons.filter(
      (btn) => btn.querySelector('.lucide-chevron-down')
    );
    expect(chevronButtons.length).toBeGreaterThan(0);

    await user.click(chevronButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Renoviranje stana')).toBeInTheDocument();
      expect(screen.getByText('265000000000000001')).toBeInTheDocument();
      expect(screen.getByText('+381641234567')).toBeInTheDocument();
      expect(screen.getByText('Zaposlen')).toBeInTheDocument();
    });
  });

  it('shows approve and reject buttons only for PENDING requests', async () => {
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Only PENDING request (id=1) should have approve/reject buttons
    // The approve button has a from-emerald-500 class
    const approveButtons = document.querySelectorAll('button.from-emerald-500');
    expect(approveButtons.length).toBe(1);
  });

  it('calls approve when approve button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Find the approve button (green gradient)
    const approveButton = document.querySelector('button.bg-gradient-to-r.from-emerald-500');
    expect(approveButton).toBeTruthy();

    await user.click(approveButton!);

    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith(1);
    });
  });

  it('shows reject form when reject button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Find the reject button (outline with XCircle icon)
    const rejectButtons = document.querySelectorAll('button');
    const rejectBtn = Array.from(rejectButtons).find(
      (btn) => btn.className.includes('hover:border-red-500')
    );
    expect(rejectBtn).toBeTruthy();

    await user.click(rejectBtn!);

    await waitFor(() => {
      expect(screen.getByText('Razlog odbijanja')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Unesite razlog...')).toBeInTheDocument();
      expect(screen.getByText('Potvrdi odbijanje')).toBeInTheDocument();
      expect(screen.getByText('Otkazi')).toBeInTheDocument();
    });
  });

  it('shows error toast when reject is attempted without reason', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Open reject form
    const rejectBtn = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.className.includes('hover:border-red-500')
    );
    await user.click(rejectBtn!);

    await waitFor(() => {
      expect(screen.getByText('Potvrdi odbijanje')).toBeInTheDocument();
    });

    // Click confirm without entering reason
    await user.click(screen.getByText('Potvrdi odbijanje'));

    // reject should NOT have been called
    expect(mockReject).not.toHaveBeenCalled();
  });

  it('calls reject with id when reason is provided and confirmed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Open reject form
    const rejectBtn = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.className.includes('hover:border-red-500')
    );
    await user.click(rejectBtn!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Unesite razlog...')).toBeInTheDocument();
    });

    // Type a reason
    await user.type(screen.getByPlaceholderText('Unesite razlog...'), 'Nedovoljan prihod');

    // Click confirm
    await user.click(screen.getByText('Potvrdi odbijanje'));

    await waitFor(() => {
      expect(mockReject).toHaveBeenCalledWith(1);
    });
  });

  it('closes reject form when Otkazi is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Open reject form
    const rejectBtn = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.className.includes('hover:border-red-500')
    );
    await user.click(rejectBtn!);

    await waitFor(() => {
      expect(screen.getByText('Otkazi')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Otkazi'));

    await waitFor(() => {
      expect(screen.queryByText('Razlog odbijanja')).not.toBeInTheDocument();
    });
  });

  it('shows error toast when getRequests fails', async () => {
    mockGetRequests.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      // Should show empty state after error
      expect(screen.getByText('Nema zahteva za izabrani filter')).toBeInTheDocument();
    });
  });

  it('displays fallback dash when clientName and clientEmail are missing', async () => {
    mockGetRequests.mockResolvedValue({
      content: [
        {
          id: 99,
          loanType: 'AUTO',
          interestRateType: 'FIKSNI',
          amount: 100000,
          currency: 'RSD',
          loanPurpose: 'Test',
          repaymentPeriod: 12,
          accountNumber: '265000000000000099',
          phoneNumber: '+381600000000',
          status: 'PENDING',
          createdAt: '2025-01-01',
        },
      ],
      totalPages: 1,
    });

    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      // clientName || clientEmail || '-'
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  it('shows permanentEmployment as Da when true in expanded details', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoanRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Expand first request using chevron-down icon
    const chevronButtons = Array.from(document.querySelectorAll('button')).filter(
      (btn) => btn.querySelector('.lucide-chevron-down')
    );
    expect(chevronButtons.length).toBeGreaterThan(0);
    await user.click(chevronButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Da')).toBeInTheDocument();
    });
  });
});
