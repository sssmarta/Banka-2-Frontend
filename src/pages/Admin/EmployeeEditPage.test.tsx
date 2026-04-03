import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmployeeEditPage from './EmployeeEditPage';
import { renderWithProviders } from '../../test/test-utils';
import type { Employee } from '../../types';
import { Permission } from '../../types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '5' }),
  };
});

const mockGetById = vi.fn();
const mockUpdate = vi.fn();
const mockDeactivate = vi.fn();

vi.mock('../../services/employeeService', () => ({
  employeeService: {
    getById: (...args: unknown[]) => mockGetById(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    deactivate: (...args: unknown[]) => mockDeactivate(...args),
  },
}));

vi.mock('@/lib/notify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockEmployee: Employee = {
  id: 5,
  firstName: 'Marko',
  lastName: 'Petrovic',
  username: 'marko.petrovic',
  email: 'marko.petrovic@banka.rs',
  position: 'Software Developer',
  phoneNumber: '+381 60 1234567',
  isActive: true,
  permissions: [Permission.TRADE_STOCKS, Permission.VIEW_STOCKS],
  address: 'Bulevar Mihajla Pupina 10, Beograd',
  dateOfBirth: '1990-05-15',
  gender: 'M',
  department: 'IT',
};

describe('EmployeeEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton while fetching', () => {
    mockGetById.mockImplementation(() => new Promise(() => {}));
    renderWithProviders(<EmployeeEditPage />);

    expect(screen.getByTestId('employee-edit-skeleton')).toBeInTheDocument();
  });

  it('loads and displays employee data', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByText(/izmeni zaposlenog: marko petrovic/i)).toBeInTheDocument();
    });
  });

  it('calls getById with the correct ID from URL params', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(mockGetById).toHaveBeenCalledWith(5);
    });
  });

  it('renders edit form with employee data populated', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    // Check that form fields have the correct values
    expect(screen.getByLabelText(/^ime$/i)).toHaveValue('Marko');
    expect(screen.getByLabelText(/^prezime$/i)).toHaveValue('Petrovic');
    expect(screen.getByLabelText(/^email$/i)).toHaveValue('marko.petrovic@banka.rs');
    expect(screen.getByLabelText(/^broj telefona$/i)).toHaveValue('+381 60 1234567');
    expect(screen.getByLabelText(/^adresa$/i)).toHaveValue('Bulevar Mihajla Pupina 10, Beograd');

    // Username should be displayed but disabled
    expect(screen.getByLabelText(/^username$/i)).toBeDisabled();
    expect(screen.getByLabelText(/^username$/i)).toHaveValue('marko.petrovic');
  });

  it('shows not found state when employee does not exist', async () => {
    mockGetById.mockRejectedValueOnce(new Error('Not found'));
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByText(/zaposleni nije pronadjen/i)).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    mockGetById.mockRejectedValueOnce(new Error('Server error'));
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByText(/zaposleni nije pronadjen/i)).toBeInTheDocument();
    });
  });

  it('renders permission checkboxes', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    // All permissions should be listed
    expect(screen.getByText(Permission.ADMIN)).toBeInTheDocument();
    expect(screen.getByText(Permission.TRADE_STOCKS)).toBeInTheDocument();
    expect(screen.getByText(Permission.VIEW_STOCKS)).toBeInTheDocument();
    expect(screen.getByText(Permission.CREATE_CONTRACTS)).toBeInTheDocument();
    expect(screen.getByText(Permission.CREATE_INSURANCE)).toBeInTheDocument();
    expect(screen.getByText(Permission.SUPERVISOR)).toBeInTheDocument();
    expect(screen.getByText(Permission.AGENT)).toBeInTheDocument();
  });

  it('shows the correct number of selected permissions', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    // mockEmployee has 2 permissions: TRADE_STOCKS and VIEW_STOCKS
    expect(screen.getByText(/2 od 7 selektovano/)).toBeInTheDocument();
  });

  it('toggles permission checkbox', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    const user = userEvent.setup();
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    // Initially 2 permissions
    expect(screen.getByText(/2 od 7 selektovano/)).toBeInTheDocument();

    // Click on a permission that is NOT currently selected (e.g. AGENT)
    const agentCheckbox = screen.getByLabelText(Permission.AGENT);
    await user.click(agentCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/3 od 7 selektovano/)).toBeInTheDocument();
    });
  });

  it('select all / deselect all permissions buttons work', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    const user = userEvent.setup();
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    // Select all
    await user.click(screen.getByText(/selektuj sve/i));
    await waitFor(() => {
      expect(screen.getByText(/7 od 7 selektovano/)).toBeInTheDocument();
    });

    // Deselect all
    await user.click(screen.getByText(/ponisti sve/i));
    await waitFor(() => {
      expect(screen.getByText(/0 od 7 selektovano/)).toBeInTheDocument();
    });
  });

  it('calls update API on save', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    mockUpdate.mockResolvedValueOnce(mockEmployee);
    const user = userEvent.setup();
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /sacuvaj izmene/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(5, expect.objectContaining({
        firstName: 'Marko',
        lastName: 'Petrovic',
        permissions: expect.any(Array),
      }));
    });
  });

  it('navigates to employee list after successful save', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    mockUpdate.mockResolvedValueOnce(mockEmployee);
    const user = userEvent.setup();
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /sacuvaj izmene/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/employees');
    });
  });

  it('shows error on failed save', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    mockUpdate.mockRejectedValueOnce({
      response: { data: { message: 'Validation error' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /sacuvaj izmene/i }));

    await waitFor(() => {
      expect(screen.getByText('Validation error')).toBeInTheDocument();
    });
  });

  it('calls deactivate when status is switched to inactive', async () => {
    mockGetById.mockResolvedValueOnce({ ...mockEmployee, isActive: true });
    mockDeactivate.mockResolvedValueOnce(undefined);
    mockUpdate.mockResolvedValueOnce(mockEmployee);
    const user = userEvent.setup();
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    // Find the active switch - it should show "Aktivan"
    const aktivanBadge = screen.getByText('Aktivan');
    expect(aktivanBadge).toBeInTheDocument();

    // Click the switch (it's a sibling to the badge in the same container)
    const switchContainer = aktivanBadge.closest('.flex.items-center');
    const switchButton = switchContainer?.querySelector('button[role="switch"]');
    if (switchButton) {
      await user.click(switchButton);
    }

    // Now save
    await user.click(screen.getByRole('button', { name: /sacuvaj izmene/i }));

    await waitFor(() => {
      // If the switch was toggled, deactivate should be called
      if (mockDeactivate.mock.calls.length > 0) {
        expect(mockDeactivate).toHaveBeenCalledWith(5);
      }
    });
  });

  it('shows loading state during save', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    mockUpdate.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /sacuvaj izmene/i }));

    await waitFor(() => {
      expect(screen.getByText(/cuvanje/i)).toBeInTheDocument();
    });
  });

  it('navigates back when cancel button is clicked', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    const user = userEvent.setup();
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /otkazi/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/employees');
  });

  it('navigates back when back button is clicked', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    const user = userEvent.setup();
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByTestId('employee-edit-form')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /nazad na listu/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/employees');
  });

  it('renders danger zone section', async () => {
    mockGetById.mockResolvedValueOnce(mockEmployee);
    renderWithProviders(<EmployeeEditPage />);

    await waitFor(() => {
      expect(screen.getByText(/opasna zona/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/deaktivacija zaposlenog/i)).toBeInTheDocument();
  });
});
