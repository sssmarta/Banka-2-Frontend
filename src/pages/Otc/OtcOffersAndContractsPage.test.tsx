import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OtcOffersAndContractsPage from './OtcOffersAndContractsPage';
import type { OtcOffer } from '@/types/celina3';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'stefan.jovanovic@gmail.com',
      username: 'client-1',
      firstName: 'Stefan',
      lastName: 'Jovanovic',
      permissions: [],
    },
    isAdmin: false,
    isAgent: false,
    isSupervisor: false,
  }),
}));

vi.mock('@/services/otcService', () => ({
  default: {
    listMyActiveOffers: vi.fn(),
    listMyContracts: vi.fn(),
    acceptOffer: vi.fn(),
    declineOffer: vi.fn(),
    counterOffer: vi.fn(),
    exerciseContract: vi.fn(),
  },
}));

vi.mock('@/services/interbankOtcService', () => ({
  default: {
    listMyContracts: vi.fn(),
    listMyOffers: vi.fn(),
    acceptOffer: vi.fn(),
    declineOffer: vi.fn(),
    counterOffer: vi.fn(),
    exerciseContract: vi.fn(),
  },
}));

vi.mock('@/services/accountService', () => ({
  accountService: {
    getMyAccounts: vi.fn(),
    getBankAccounts: vi.fn(),
  },
}));

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import otcService from '@/services/otcService';
import interbankOtcService from '@/services/interbankOtcService';
import { accountService } from '@/services/accountService';

const mockedOtcService = vi.mocked(otcService);
const mockedInterbankOtcService = vi.mocked(interbankOtcService);
const mockedAccountService = vi.mocked(accountService);

describe('OtcOffersAndContractsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedOtcService.listMyActiveOffers.mockResolvedValue([]);
    mockedOtcService.listMyContracts.mockResolvedValue([]);
    mockedInterbankOtcService.listMyContracts.mockResolvedValue([]);
    mockedInterbankOtcService.listMyOffers.mockResolvedValue([]);
    mockedAccountService.getMyAccounts.mockResolvedValue([] as never);
    // Reset localStorage so "previousEntranceTs" is 0 before each test.
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it('renders the local otc tabs by default and keeps the local view visible', async () => {
    render(<OtcOffersAndContractsPage />);

    expect(await screen.findByText('Moji aktivni pregovori')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Sklopljeni ugovori \(inter-bank\)/i })).toBeInTheDocument();
    expect(mockedInterbankOtcService.listMyContracts).not.toHaveBeenCalled();
  });

  it('loads the remote contracts tab on demand', async () => {
    const user = userEvent.setup();
    render(<OtcOffersAndContractsPage />);

    await screen.findByText('Moji aktivni pregovori');
    await user.click(screen.getByRole('tab', { name: /Sklopljeni ugovori \(inter-bank\)/i }));

    await waitFor(() => {
      expect(mockedInterbankOtcService.listMyContracts).toHaveBeenCalledWith(undefined);
    });
    expect(await screen.findByText('Sklopljeni inter-bank ugovori')).toBeInTheDocument();
  });

  // Spec Celina 4 (Nova) §2011-2095 — neprocitane ponude badge
  describe('unread offers badge', () => {
    const makeOffer = (
      overrides: Partial<{ id: number; lastModifiedById: number; lastModifiedAt: string }> = {},
    ): OtcOffer => ({
      id: overrides.id ?? 1,
      listingId: 1,
      listingTicker: 'AAPL',
      listingName: 'Apple Inc.',
      listingCurrency: 'USD',
      currentPrice: 175,
      buyerId: 1,
      buyerName: 'Stefan',
      sellerId: 2,
      sellerName: 'Milica',
      quantity: 5,
      pricePerStock: 170,
      premium: 5,
      settlementDate: '2026-12-31',
      status: 'ACTIVE',
      myTurn: true,
      waitingOnUserId: 1,
      createdAt: '2026-04-01T00:00:00Z',
      lastModifiedAt: overrides.lastModifiedAt ?? new Date().toISOString(),
      lastModifiedById: overrides.lastModifiedById ?? 2,
      lastModifiedByName: 'Milica',
    });

    it('does NOT show badge when there are no unread offers', async () => {
      // Set lastEntrance to "now" so any offer modified before would be considered read
      window.localStorage.setItem('otc:lastEntrance', String(Date.now() + 60_000));
      mockedOtcService.listMyActiveOffers.mockResolvedValue([
        makeOffer({ lastModifiedAt: new Date(Date.now() - 60_000).toISOString() }),
      ]);

      render(<OtcOffersAndContractsPage />);
      await screen.findByText('Moji aktivni pregovori');

      expect(screen.queryByTestId('unread-offers-local')).not.toBeInTheDocument();
    });

    it('shows badge when local offers were modified by someone else after last entrance', async () => {
      // Last entrance is in the past
      window.localStorage.setItem('otc:lastEntrance', String(Date.now() - 1_000_000));
      mockedOtcService.listMyActiveOffers.mockResolvedValue([
        makeOffer({ id: 1, lastModifiedById: 2, lastModifiedAt: new Date().toISOString() }),
        makeOffer({ id: 2, lastModifiedById: 3, lastModifiedAt: new Date().toISOString() }),
        // Offer modified by self (user.id=1) — should NOT count
        makeOffer({ id: 3, lastModifiedById: 1, lastModifiedAt: new Date().toISOString() }),
      ]);

      render(<OtcOffersAndContractsPage />);
      await screen.findByText('Moji aktivni pregovori');

      const badge = await screen.findByTestId('unread-offers-local');
      expect(badge).toHaveTextContent(/2 novih/);
    });

    it('hides the local badge after the user clicks the local offers tab', async () => {
      window.localStorage.setItem('otc:lastEntrance', String(Date.now() - 1_000_000));
      mockedOtcService.listMyActiveOffers.mockResolvedValue([
        makeOffer({ id: 1, lastModifiedById: 2, lastModifiedAt: new Date().toISOString() }),
      ]);

      const user = userEvent.setup();
      render(<OtcOffersAndContractsPage />);

      await screen.findByText('Moji aktivni pregovori');

      // Switch away to contracts-local first to mark offers-local as not viewed
      await user.click(screen.getByRole('tab', { name: /Sklopljeni ugovori \(intra-bank\)/i }));
      // Switch back to offers-local — this marks it as viewed
      await user.click(screen.getByRole('tab', { name: /Aktivne ponude \(intra-bank\)/i }));

      await waitFor(() => {
        expect(screen.queryByTestId('unread-offers-local')).not.toBeInTheDocument();
      });
    });
  });
});
