import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MainLayout from '../components/layout/MainLayout';

// ---------------------------------------------------------------------------
// Mock ClientSidebar
// ---------------------------------------------------------------------------
vi.mock('../components/shared/ClientSidebar', () => ({
  default: () => <aside data-testid="client-sidebar">Sidebar</aside>,
}));

// ---------------------------------------------------------------------------
// Mock RouteErrorBoundary — pass through children
// ---------------------------------------------------------------------------
vi.mock('../components/shared/RouteErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Mock AuthContext (ClientSidebar uses it internally)
// ---------------------------------------------------------------------------
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@banka.rs', role: 'CLIENT', permissions: [] },
    isAuthenticated: true,
    isLoading: false,
    isAdmin: false,
    hasPermission: () => false,
    logout: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function renderLayout(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={<div data-testid="child-page">Dashboard Content</div>}
          />
          <Route
            path="/accounts"
            element={<div data-testid="accounts-page">Accounts Content</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sidebar', () => {
    renderLayout();
    expect(screen.getByTestId('client-sidebar')).toBeInTheDocument();
  });

  it('renders child route content via Outlet', () => {
    renderLayout();
    expect(screen.getByTestId('child-page')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('wraps outlet in RouteErrorBoundary', () => {
    renderLayout();
    const errorBoundary = screen.getByTestId('error-boundary');
    expect(errorBoundary).toBeInTheDocument();
    // Child should be inside error boundary
    expect(errorBoundary).toContainElement(screen.getByTestId('child-page'));
  });

  it('renders main element with responsive left margin class', () => {
    renderLayout();
    const main = document.querySelector('main');
    expect(main).not.toBeNull();
    expect(main!.className).toContain('md:ml-64');
  });

  it('renders main with min-h-screen for full viewport height', () => {
    renderLayout();
    const main = document.querySelector('main');
    expect(main!.className).toContain('min-h-screen');
  });

  it('renders a content container inside main with proper padding', () => {
    renderLayout();
    const container = document.querySelector('main > div');
    expect(container).not.toBeNull();
    expect(container!.className).toContain('py-6');
    expect(container!.className).toContain('max-w-screen-2xl');
  });

  it('renders different child routes based on path', () => {
    renderLayout('/accounts');
    expect(screen.getByTestId('accounts-page')).toBeInTheDocument();
    expect(screen.getByText('Accounts Content')).toBeInTheDocument();
  });
});
