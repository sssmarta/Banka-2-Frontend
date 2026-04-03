import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountRequestsPage from './AccountRequestsPage';
import { renderWithProviders } from '../../test/test-utils';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockRequests = [
  {
    id: 1,
    accountType: 'CHECKING',
    currency: 'RSD',
    initialDeposit: 50000,
    createCard: true,
    clientEmail: 'marko@email.com',
    clientName: 'Marko Petrovic',
    status: 'PENDING',
    createdAt: '2025-03-15T10:30:00',
  },
  {
    id: 2,
    accountType: 'FOREIGN',
    currency: 'EUR',
    initialDeposit: 1000,
    createCard: false,
    clientEmail: 'ana@email.com',
    clientName: 'Ana Jovanovic',
    status: 'APPROVED',
    createdAt: '2025-03-14T09:00:00',
    processedBy: 'admin@banka.rs',
  },
  {
    id: 3,
    accountType: 'BUSINESS',
    currency: 'RSD',
    initialDeposit: 200000,
    createCard: true,
    clientEmail: 'jovan@email.com',
    clientName: 'Jovan Markovic',
    status: 'REJECTED',
    createdAt: '2025-03-13T14:00:00',
  },
];

const mockGet = vi.fn().mockResolvedValue({ data: { content: mockRequests } });
const mockPatch = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../../services/api', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

describe('AccountRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: { content: mockRequests } });
    mockPatch.mockResolvedValue({ data: {} });
  });

  it('renders the page header', async () => {
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Zahtevi za racune')).toBeInTheDocument();
    });
    expect(screen.getByText(/Pregledajte i odobrite zahteve klijenata/i)).toBeInTheDocument();
  });

  it('renders stats cards', async () => {
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Ukupno').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Na cekanju').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Odobreni').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Odbijeni').length).toBeGreaterThan(0);
  });

  it('renders request cards with client info', async () => {
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });
    expect(screen.getByText('marko@email.com')).toBeInTheDocument();
    expect(screen.getByText('Ana Jovanovic')).toBeInTheDocument();
    expect(screen.getByText('ana@email.com')).toBeInTheDocument();
    expect(screen.getByText('Jovan Markovic')).toBeInTheDocument();
  });

  it('renders account type labels', async () => {
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Tekuci')).toBeInTheDocument();
    });
    expect(screen.getByText('Devizni')).toBeInTheDocument();
    expect(screen.getByText('Poslovni')).toBeInTheDocument();
  });

  it('renders status badges correctly', async () => {
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      // "Na cekanju" appears in stats and in the request badge
      const pendingBadges = screen.getAllByText('Na cekanju');
      expect(pendingBadges.length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Odobreno').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Odbijeno').length).toBeGreaterThan(0);
  });

  it('shows currency for each request', async () => {
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('RSD').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  it('shows card creation info', async () => {
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      const yesElements = screen.getAllByText('Da');
      expect(yesElements.length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Ne').length).toBeGreaterThan(0);
  });

  it('shows Odobri and Odbij buttons for pending requests', async () => {
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Odobri')).toBeInTheDocument();
    });
    expect(screen.getByText('Odbij')).toBeInTheDocument();
  });

  it('does not show action buttons for non-pending requests', async () => {
    // Only 1 pending request, so only 1 Odobri / 1 Odbij button
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Odobri').length).toBe(1);
    });
    expect(screen.getAllByText('Odbij').length).toBe(1);
  });

  it('calls approve API when Odobri is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Odobri')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Odobri'));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/accounts/requests/1/approve');
    });
  });

  it('calls reject API when Odbij is clicked', async () => {
    window.prompt = vi.fn(() => 'Nedovoljno sredstava');
    const user = userEvent.setup();
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Odbij')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Odbij'));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/accounts/requests/1/reject', { reason: 'Nedovoljno sredstava' });
    });
  });

  it('shows processedBy info for processed requests', async () => {
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Obradio: admin@banka.rs/)).toBeInTheDocument();
    });
  });

  it('shows loading skeletons while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AccountRequestsPage />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no requests', async () => {
    mockGet.mockResolvedValue({ data: { content: [] } });
    renderWithProviders(<AccountRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Nema zahteva za prikaz')).toBeInTheDocument();
    });
    expect(screen.getByText(/Trenutno nema zahteva za otvaranje racuna/i)).toBeInTheDocument();
  });
});
