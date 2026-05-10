import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OtcNegotiationsPage from './OtcNegotiationsPage';

vi.mock('@/services/otcService', () => ({
  default: {
    listMyActiveOffers: vi.fn().mockResolvedValue([
      {
        id: 1, listingTicker: 'AAPL', listingName: 'Apple Inc.', listingCurrency: 'USD',
        buyerId: 1, buyerName: 'Stefan Jovanovic', sellerId: 2, sellerName: 'Milica',
        quantity: 5, pricePerStock: 100, premium: 10, currentPrice: 100,
        settlementDate: '2026-06-04', lastModifiedById: 1, lastModifiedByName: 'Stefan',
        lastModifiedAt: '2026-05-09T10:00:00', waitingOnUserId: 2, myTurn: false, status: 'ACTIVE',
        createdAt: '2026-05-09T10:00:00',
      },
    ]),
    acceptOffer: vi.fn(),
    counterOffer: vi.fn(),
    declineOffer: vi.fn(),
  },
}));
vi.mock('@/services/accountService', () => ({
  accountService: {
    getMyAccounts: vi.fn().mockResolvedValue([]),
    getBankAccounts: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'CLIENT' }, isAdmin: false, isAgent: false, isSupervisor: false }),
}));
vi.mock('./OtcInterBankOffersTab', () => ({
  default: () => <div data-testid="inter-bank-offers">[InterBank]</div>,
}));

beforeEach(() => vi.clearAllMocks());

describe('OtcNegotiationsPage', () => {
  it('renders source filter chip', async () => {
    render(<MemoryRouter><OtcNegotiationsPage /></MemoryRouter>);
    await waitFor(() => screen.getByText(/Iz nase banke/i));
    expect(screen.getByRole('button', { name: /Sve/i })).toBeInTheDocument();
  });

  it('shows local offers under "Sve" filter', async () => {
    render(<MemoryRouter><OtcNegotiationsPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('AAPL')).toBeInTheDocument());
  });

  it('renders VI badge for current user', async () => {
    render(<MemoryRouter><OtcNegotiationsPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('AAPL'));
    expect(screen.getByText('VI')).toBeInTheDocument();
  });
});
