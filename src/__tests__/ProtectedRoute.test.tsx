import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import { Permission } from '../types';

// ---------------------------------------------------------------------------
// Mock useAuth
// ---------------------------------------------------------------------------
const mockUseAuth = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderRoute(
  props: { adminOnly?: boolean; requiredPermission?: Permission } = {},
  initialPath = '/protected'
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute {...props} />}>
          <Route path="/protected" element={<div data-testid="child">Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/403" element={<div data-testid="forbidden-page">Forbidden</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      hasPermission: () => false,
      isAdmin: false,
    });

    const { container } = renderRoute();
    // Should render null
    expect(container.innerHTML).toBe('');
  });

  it('redirects to /login if no user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      hasPermission: () => false,
      isAdmin: false,
    });

    renderRoute();
    expect(screen.getByTestId('login-page')).toBeTruthy();
  });

  it('redirects to /403 if adminOnly and user is not admin', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'klijent@banka.rs', role: 'CLIENT', permissions: [] },
      isLoading: false,
      hasPermission: () => false,
      isAdmin: false,
    });

    renderRoute({ adminOnly: true });
    expect(screen.getByTestId('forbidden-page')).toBeTruthy();
  });

  it('renders children if user is admin on adminOnly route', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'admin@banka.rs', role: 'ADMIN', permissions: [Permission.ADMIN] },
      isLoading: false,
      hasPermission: (p: Permission) => p === Permission.ADMIN,
      isAdmin: true,
    });

    renderRoute({ adminOnly: true });
    expect(screen.getByTestId('child')).toBeTruthy();
    expect(screen.getByTestId('child').textContent).toBe('Protected Content');
  });

  it('renders children for authenticated user without special requirements', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'klijent@banka.rs', role: 'CLIENT', permissions: [] },
      isLoading: false,
      hasPermission: () => false,
      isAdmin: false,
    });

    renderRoute();
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('redirects to /403 if requiredPermission is not met', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'klijent@banka.rs', role: 'CLIENT', permissions: [] },
      isLoading: false,
      hasPermission: () => false,
      isAdmin: false,
    });

    renderRoute({ requiredPermission: Permission.ADMIN });
    expect(screen.getByTestId('forbidden-page')).toBeTruthy();
  });

  it('renders children when requiredPermission is met', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'admin@banka.rs', role: 'ADMIN', permissions: [Permission.ADMIN] },
      isLoading: false,
      hasPermission: (p: Permission) => p === Permission.ADMIN,
      isAdmin: true,
    });

    renderRoute({ requiredPermission: Permission.ADMIN });
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // Edge cases: permission-based routing
  // ---------------------------------------------------------------------------

  it('redirects to /403 when user has TRADE_STOCKS but route requires ADMIN', () => {
    mockUseAuth.mockReturnValue({
      user: {
        email: 'broker@banka.rs',
        role: 'EMPLOYEE',
        permissions: [Permission.TRADE_STOCKS],
      },
      isLoading: false,
      hasPermission: (p: Permission) => p === Permission.TRADE_STOCKS,
      isAdmin: false,
    });

    renderRoute({ requiredPermission: Permission.ADMIN });
    expect(screen.getByTestId('forbidden-page')).toBeTruthy();
  });

  it('renders children when user has TRADE_STOCKS and route requires TRADE_STOCKS', () => {
    mockUseAuth.mockReturnValue({
      user: {
        email: 'broker@banka.rs',
        role: 'EMPLOYEE',
        permissions: [Permission.TRADE_STOCKS],
      },
      isLoading: false,
      hasPermission: (p: Permission) => p === Permission.TRADE_STOCKS,
      isAdmin: false,
    });

    renderRoute({ requiredPermission: Permission.TRADE_STOCKS });
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('renders children when user has multiple permissions and route requires one of them', () => {
    const userPermissions = [Permission.ADMIN, Permission.TRADE_STOCKS, Permission.VIEW_STOCKS];
    mockUseAuth.mockReturnValue({
      user: {
        email: 'superuser@banka.rs',
        role: 'ADMIN',
        permissions: userPermissions,
      },
      isLoading: false,
      hasPermission: (p: Permission) => userPermissions.includes(p),
      isAdmin: true,
    });

    renderRoute({ requiredPermission: Permission.VIEW_STOCKS });
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('redirects to /403 when user has multiple permissions but not the required one', () => {
    const userPermissions = [Permission.VIEW_STOCKS, Permission.TRADE_STOCKS];
    mockUseAuth.mockReturnValue({
      user: {
        email: 'broker@banka.rs',
        role: 'EMPLOYEE',
        permissions: userPermissions,
      },
      isLoading: false,
      hasPermission: (p: Permission) => userPermissions.includes(p),
      isAdmin: false,
    });

    renderRoute({ requiredPermission: Permission.CREATE_CONTRACTS });
    expect(screen.getByTestId('forbidden-page')).toBeTruthy();
  });

  it('allows admin to access adminOnly route even without requiredPermission', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'admin@banka.rs', role: 'ADMIN', permissions: [Permission.ADMIN] },
      isLoading: false,
      hasPermission: () => true,
      isAdmin: true,
    });

    renderRoute({ adminOnly: true });
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('renders nothing (null) during loading even when user data exists', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'admin@banka.rs', role: 'ADMIN', permissions: [Permission.ADMIN] },
      isLoading: true,
      hasPermission: () => true,
      isAdmin: true,
    });

    const { container } = renderRoute();
    // isLoading takes priority — should render null
    expect(container.innerHTML).toBe('');
  });

  it('redirects to /login when user is null and not loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      hasPermission: () => false,
      isAdmin: false,
    });

    renderRoute();
    expect(screen.getByTestId('login-page')).toBeTruthy();
    expect(screen.queryByTestId('child')).toBeNull();
  });

  it('renders children when no props are passed and user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'klijent@banka.rs', role: 'CLIENT', permissions: [] },
      isLoading: false,
      hasPermission: () => false,
      isAdmin: false,
    });

    // No adminOnly, no requiredPermission
    renderRoute({});
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('checks adminOnly before requiredPermission (non-admin blocked even with permission)', () => {
    mockUseAuth.mockReturnValue({
      user: {
        email: 'employee@banka.rs',
        role: 'EMPLOYEE',
        permissions: [Permission.TRADE_STOCKS],
      },
      isLoading: false,
      hasPermission: (p: Permission) => p === Permission.TRADE_STOCKS,
      isAdmin: false,
    });

    // adminOnly = true, but user is not admin => /403 regardless of permission
    renderRoute({ adminOnly: true, requiredPermission: Permission.TRADE_STOCKS });
    expect(screen.getByTestId('forbidden-page')).toBeTruthy();
  });
});
