import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RouteErrorBoundary from '../components/shared/RouteErrorBoundary';

// ---------------------------------------------------------------------------
// Mock window.location.reload
// ---------------------------------------------------------------------------
const reloadMock = vi.fn();

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, reload: reloadMock },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// A component that throws on demand
// ---------------------------------------------------------------------------
function ThrowingChild({ shouldThrow, message }: { shouldThrow: boolean; message?: string }) {
  if (shouldThrow) {
    throw new Error(message ?? 'Test error');
  }
  return <div data-testid="child">Child content</div>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error from React error boundary logging
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <RouteErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </RouteErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('displays error UI when a child throws', () => {
    render(
      <RouteErrorBoundary>
        <ThrowingChild shouldThrow={true} message="Something broke" />
      </RouteErrorBoundary>
    );

    // Error heading
    expect(screen.getByText('Greška pri prikazu stranice')).toBeInTheDocument();

    // Error description
    expect(
      screen.getByText(/Sadržaj nije mogao da se prikaže/)
    ).toBeInTheDocument();

    // Error detail message
    expect(screen.getByText(/Something broke/)).toBeInTheDocument();

    // Child should not be rendered
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('shows the recovery button', () => {
    render(
      <RouteErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </RouteErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /Osveži stranicu/i });
    expect(button).toBeInTheDocument();
  });

  it('calls window.location.reload when recovery button is clicked', () => {
    render(
      <RouteErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </RouteErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /Osveži stranicu/i });
    fireEvent.click(button);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('displays fallback message when error has no message', () => {
    // Component that throws an error without a message
    function ThrowEmpty() {
      throw new Error();
    }

    render(
      <RouteErrorBoundary>
        <ThrowEmpty />
      </RouteErrorBoundary>
    );

    expect(screen.getByText('Greška pri prikazu stranice')).toBeInTheDocument();
    // The detail should show empty or the fallback from getDerivedStateFromError
    expect(screen.getByText(/Detalj:/)).toBeInTheDocument();
  });

  it('logs error to console via componentDidCatch', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <RouteErrorBoundary>
        <ThrowingChild shouldThrow={true} message="Logged error" />
      </RouteErrorBoundary>
    );

    // React + our componentDidCatch both log
    expect(consoleSpy).toHaveBeenCalled();
    // Check our custom log message was included
    const calls = consoleSpy.mock.calls.flat().map(String);
    expect(calls.some((c) => c.includes('Route rendering error'))).toBe(true);
  });

  it('renders inside a styled card container', () => {
    const { container } = render(
      <RouteErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </RouteErrorBoundary>
    );

    const card = container.querySelector('.rounded-lg.border');
    expect(card).not.toBeNull();
  });
});
