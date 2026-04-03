import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExchangesPage from './ExchangesPage';
import type { Exchange } from '@/types/celina3';

// ---------- Mocks ----------

const mockIsAdmin = vi.fn(() => false);

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAdmin: mockIsAdmin(),
    user: { id: 1, email: 'admin@banka.rs', role: 'ADMIN' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('@/services/exchangeManagementService', () => ({
  default: {
    getAll: vi.fn(),
    setTestMode: vi.fn(),
  },
}));

import exchangeManagementService from '@/services/exchangeManagementService';
const mockService = vi.mocked(exchangeManagementService);

const exchanges: Exchange[] = [
  {
    id: 1,
    name: 'New York Stock Exchange',
    acronym: 'NYSE',
    micCode: 'XNYS',
    country: 'SAD',
    currency: 'USD',
    timeZone: 'America/New_York',
    openTime: '09:30',
    closeTime: '16:00',
    isOpen: true,
    testMode: false,
  },
  {
    id: 2,
    name: 'Beogradska Berza',
    acronym: 'BELEX',
    micCode: 'XBEL',
    country: 'Srbija',
    currency: 'RSD',
    timeZone: 'Europe/Belgrade',
    openTime: '10:00',
    closeTime: '14:00',
    isOpen: false,
    testMode: true,
  },
];

function renderPage() {
  return render(<ExchangesPage />);
}

describe('ExchangesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdmin.mockReturnValue(false);
    mockService.getAll.mockResolvedValue(exchanges);
  });

  it('shows loading skeleton initially', () => {
    mockService.getAll.mockImplementation(() => new Promise(() => {}));
    renderPage();

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders page header', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Berze')).toBeInTheDocument();
    });
    expect(screen.getByText(/Pregled svetskih berzi i radnog vremena/)).toBeInTheDocument();
  });

  it('renders exchange list after loading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('New York Stock Exchange')).toBeInTheDocument();
    });
    expect(screen.getByText('Beogradska Berza')).toBeInTheDocument();
  });

  it('renders exchange count in card title', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Svetske berze \(2\)/)).toBeInTheDocument();
    });
  });

  it('renders acronym badges', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('NYSE')).toBeInTheDocument();
    });
    expect(screen.getByText('BELEX')).toBeInTheDocument();
  });

  it('renders MIC codes', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('XNYS')).toBeInTheDocument();
    });
    expect(screen.getByText('XBEL')).toBeInTheDocument();
  });

  it('renders countries', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('SAD')).toBeInTheDocument();
    });
    expect(screen.getByText('Srbija')).toBeInTheDocument();
  });

  it('renders currencies', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('USD')).toBeInTheDocument();
    });
    expect(screen.getByText('RSD')).toBeInTheDocument();
  });

  it('renders market hours', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('09:30 - 16:00')).toBeInTheDocument();
    });
    expect(screen.getByText('10:00 - 14:00')).toBeInTheDocument();
  });

  it('shows Otvorena badge for open exchanges', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Otvorena')).toBeInTheDocument();
    });
  });

  it('shows Zatvorena badge for closed exchanges', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Zatvorena')).toBeInTheDocument();
    });
  });

  it('shows TEST badge for exchanges in test mode', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('TEST')).toBeInTheDocument();
    });
  });

  it('shows empty state when no exchanges', async () => {
    mockService.getAll.mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nema dostupnih berzi')).toBeInTheDocument();
    });
  });

  it('shows empty state on error', async () => {
    mockService.getAll.mockRejectedValue(new Error('Server error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nema dostupnih berzi')).toBeInTheDocument();
    });
  });

  it('handles 404 as empty list (no error toast)', async () => {
    mockService.getAll.mockRejectedValue({ response: { status: 404 } });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nema dostupnih berzi')).toBeInTheDocument();
    });
  });

  it('does not show test mode toggle for non-admin users', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('New York Stock Exchange')).toBeInTheDocument();
    });

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('shows test mode toggle for admin users', async () => {
    mockIsAdmin.mockReturnValue(true);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('New York Stock Exchange')).toBeInTheDocument();
    });

    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(2);
  });

  it('toggles test mode via service on switch click', async () => {
    mockIsAdmin.mockReturnValue(true);
    mockService.setTestMode.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('New York Stock Exchange')).toBeInTheDocument();
    });

    const switches = screen.getAllByRole('switch');
    // NYSE has testMode=false, clicking should set to true
    await user.click(switches[0]);

    await waitFor(() => {
      expect(mockService.setTestMode).toHaveBeenCalledWith('NYSE', true);
    });
  });
});
