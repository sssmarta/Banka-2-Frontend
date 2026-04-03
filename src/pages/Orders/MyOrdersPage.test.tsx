import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyOrdersPage from './MyOrdersPage';
import { renderWithProviders } from '../../test/test-utils';
import type { Order, PaginatedResponse } from '@/types/celina3';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockOrders: Order[] = [
  {
    id: 1,
    listingId: 10,
    userName: 'Marko Petrovic',
    userRole: 'CLIENT',
    listingTicker: 'AAPL',
    listingName: 'Apple Inc.',
    listingType: 'STOCK',
    orderType: 'MARKET',
    quantity: 10,
    contractSize: 1,
    pricePerUnit: 178.50,
    direction: 'BUY',
    status: 'PENDING',
    approvedBy: '',
    isDone: false,
    remainingPortions: 10,
    afterHours: false,
    allOrNone: false,
    margin: false,
    approximatePrice: 1785.0,
    createdAt: '2026-03-20T10:00:00Z',
    lastModification: '2026-03-20T10:00:00Z',
  },
  {
    id: 2,
    listingId: 20,
    userName: 'Marko Petrovic',
    userRole: 'CLIENT',
    listingTicker: 'MSFT',
    listingName: 'Microsoft Corp.',
    listingType: 'STOCK',
    orderType: 'LIMIT',
    quantity: 5,
    contractSize: 1,
    pricePerUnit: 415.20,
    limitValue: 410.0,
    direction: 'SELL',
    status: 'DONE',
    approvedBy: 'Admin',
    isDone: true,
    remainingPortions: 0,
    afterHours: false,
    allOrNone: false,
    margin: false,
    approximatePrice: 2076.0,
    createdAt: '2026-03-19T15:30:00Z',
    lastModification: '2026-03-19T16:00:00Z',
  },
];

const mockPaginatedResponse: PaginatedResponse<Order> = {
  content: mockOrders,
  totalPages: 1,
  totalElements: 2,
  number: 0,
  size: 10,
};

const mockGetMy = vi.fn().mockResolvedValue(mockPaginatedResponse);
const mockCancelOrder = vi.fn().mockResolvedValue(undefined);

vi.mock('../../services/orderService', () => ({
  default: {
    getMy: (...args: unknown[]) => mockGetMy(...args),
    cancelOrder: (...args: unknown[]) => mockCancelOrder(...args),
  },
}));

describe('MyOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMy.mockResolvedValue(mockPaginatedResponse);
  });

  it('renders the page header', async () => {
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Moji nalozi')).toBeInTheDocument();
    });
  });

  it('renders user orders after loading', async () => {
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/AAPL/)).toBeInTheDocument();
    });

    expect(screen.getByText(/MSFT/)).toBeInTheDocument();
  });

  it('renders status filter buttons', async () => {
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Svi/)).toBeInTheDocument();
    });

    // "Na cekanju" appears in both filter button and status badge; use getAllByText
    expect(screen.getAllByText(/Na cekanju/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Odobreni/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Zavrseni/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Odbijeni/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Cancel button for PENDING orders', async () => {
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Otkazi')).toBeInTheDocument();
    });
  });

  it('shows cancel confirmation dialog when clicking Cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Otkazi')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Otkazi'));

    await waitFor(() => {
      expect(screen.getByText(/Da li ste sigurni da zelite da otkazete nalog/)).toBeInTheDocument();
    });
  });

  it('calls cancel service and reloads when confirming cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Otkazi')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Otkazi'));

    await waitFor(() => {
      expect(screen.getByText('Potvrdi otkazivanje')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Potvrdi otkazivanje'));

    await waitFor(() => {
      expect(mockCancelOrder).toHaveBeenCalledWith(1);
    });
  });

  it('renders Details button for each order', async () => {
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Detalji').length).toBe(2);
    });
  });

  it('opens detail dialog when clicking Details', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Detalji').length).toBe(2);
    });

    await user.click(screen.getAllByText('Detalji')[0]);

    await waitFor(() => {
      expect(screen.getByText('Detalji naloga')).toBeInTheDocument();
    });
  });

  it('renders Nova kupovina button that navigates to securities', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Nova kupovina')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nova kupovina'));
    expect(mockNavigate).toHaveBeenCalledWith('/securities');
  });

  it('shows loading skeletons while loading', () => {
    mockGetMy.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<MyOrdersPage />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no orders exist', async () => {
    mockGetMy.mockResolvedValue({
      content: [],
      totalPages: 1,
      totalElements: 0,
      number: 0,
      size: 10,
    });

    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Nema kreiranih naloga')).toBeInTheDocument();
    });
  });

  it('filters orders by status', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Na cekanju/).length).toBeGreaterThanOrEqual(1);
    });

    // Click the filter button (first match is the filter button)
    await user.click(screen.getAllByText(/Na cekanju/)[0]);

    // After filtering, only PENDING orders should be visible
    await waitFor(() => {
      const rows = screen.getAllByText(/AAPL/);
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  it('renders Refresh button', async () => {
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Osvezi')).toBeInTheDocument();
    });
  });

  it('displays order status badges', async () => {
    renderWithProviders(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Na cekanju')).toBeInTheDocument();
    });

    expect(screen.getByText('Zavrsen')).toBeInTheDocument();
  });
});
