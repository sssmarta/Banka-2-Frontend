import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LandingPage from './LandingPage';

// ---------------------------------------------------------------------------
// Mock react-router-dom
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// ---------------------------------------------------------------------------
// Mock ThemeContext
// ---------------------------------------------------------------------------
const mockSetTheme = vi.fn();
let currentTheme = 'light';

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: currentTheme,
    setTheme: mockSetTheme,
  }),
}));

// ---------------------------------------------------------------------------
// Mock fetch for backend status check
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  currentTheme = 'light';
  mockFetch.mockResolvedValue({ ok: true });

  // Mock IntersectionObserver to trigger visibility
  const mockIntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn().mockImplementation((el: Element) => {
      // Immediately trigger as visible
      callback([{ isIntersecting: true, target: el }]);
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: mockIntersectionObserver,
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('LandingPage', () => {
  it('renders the hero heading', () => {
    render(<LandingPage />);
    expect(screen.getByText('Moderno bankarstvo')).toBeInTheDocument();
    expect(screen.getByText('na dohvat ruke')).toBeInTheDocument();
  });

  it('renders the hero subtitle', () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/Platforma za upravljanje bankarskim poslovanjem/)
    ).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<LandingPage />);
    // Multiple "Prijavi se" buttons exist (navbar + hero + CTA section)
    const loginButtons = screen.getAllByText(/Prijavi se/);
    expect(loginButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('navigates to /login when hero CTA is clicked', () => {
    render(<LandingPage />);
    // The first "Prijavi se" is the navbar button
    const loginButtons = screen.getAllByText(/Prijavi se/);
    fireEvent.click(loginButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders "Saznaj više" button', () => {
    render(<LandingPage />);
    expect(screen.getByText('Saznaj više')).toBeInTheDocument();
  });

  it('renders all 6 feature cards', () => {
    render(<LandingPage />);
    expect(screen.getByText('Upravljanje zaposlenima')).toBeInTheDocument();
    expect(screen.getByText('Sigurna autentifikacija')).toBeInTheDocument();
    expect(screen.getByText('Bankarsko poslovanje')).toBeInTheDocument();
    expect(screen.getByText('Trgovina hartijama')).toBeInTheDocument();
    expect(screen.getByText('Sistem permisija')).toBeInTheDocument();
    expect(screen.getByText('Više valuta')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/Kreiranje, pregled i upravljanje nalozima zaposlenih/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/JWT autentifikacija sa access\/refresh tokenima/)
    ).toBeInTheDocument();
  });

  it('renders the features section heading', () => {
    render(<LandingPage />);
    expect(screen.getByText('Mogućnosti')).toBeInTheDocument();
    expect(screen.getByText('Sve što vam je potrebno')).toBeInTheDocument();
  });

  it('renders the CTA section', () => {
    render(<LandingPage />);
    expect(screen.getByText('Spremni da počnete?')).toBeInTheDocument();
    expect(screen.getByText('Prijavi se na portal')).toBeInTheDocument();
  });

  it('navigates to /login from CTA section button', () => {
    render(<LandingPage />);
    const portalButton = screen.getByText('Prijavi se na portal');
    fireEvent.click(portalButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders the logo in navbar, CTA, and footer', () => {
    render(<LandingPage />);
    const logos = screen.getAllByAltText(/BANKA 2025|Banka 2025/i);
    expect(logos.length).toBe(3); // navbar, CTA, footer
    logos.forEach((logo) => {
      expect(logo).toHaveAttribute('src', '/logo.svg');
    });
  });

  it('renders the branding text', () => {
    render(<LandingPage />);
    // Navbar and footer both have branding
    const brandings = screen.getAllByText(/BANKA 2025/);
    expect(brandings.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the currency ticker with all currencies', () => {
    render(<LandingPage />);
    // Currencies are repeated 4x in the ticker, use getAllByText
    expect(screen.getAllByText('RSD').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('EUR').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('USD').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CHF').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('GBP').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('JPY').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CAD').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('AUD').length).toBeGreaterThanOrEqual(1);
  });

  it('renders currency symbols', () => {
    render(<LandingPage />);
    expect(screen.getAllByText('€').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('$').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('£').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('¥').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the theme toggle button', () => {
    render(<LandingPage />);
    const themeButton = screen.getByTitle(/Tema:/);
    expect(themeButton).toBeInTheDocument();
  });

  it('cycles theme on toggle click: light -> dark -> system -> light', () => {
    currentTheme = 'light';
    render(<LandingPage />);
    const themeButton = screen.getByTitle('Tema: Svetla');
    fireEvent.click(themeButton);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles theme from dark to system', () => {
    currentTheme = 'dark';
    render(<LandingPage />);
    const themeButton = screen.getByTitle('Tema: Tamna');
    fireEvent.click(themeButton);
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('cycles theme from system to light', () => {
    currentTheme = 'system';
    render(<LandingPage />);
    const themeButton = screen.getByTitle('Tema: Sistemska');
    fireEvent.click(themeButton);
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('displays backend status checking initially', () => {
    // Make fetch hang so status stays "checking"
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<LandingPage />);
    expect(screen.getByText('Provera servera...')).toBeInTheDocument();
  });

  it('renders the footer with university info', () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/Softversko inženjerstvo — Računarski fakultet/)
    ).toBeInTheDocument();
  });

  it('renders the scroll indicator', () => {
    const { container } = render(<LandingPage />);
    // The scroll indicator is a small rounded-full div with animate-float
    const scrollIndicator = container.querySelector('.animate-float');
    expect(scrollIndicator).not.toBeNull();
  });

  it('renders the sticky navbar', () => {
    render(<LandingPage />);
    const nav = document.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav!.className).toContain('sticky');
  });
});
