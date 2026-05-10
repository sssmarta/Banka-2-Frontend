import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Search } from 'lucide-react';
import OtcHubCard from './OtcHubCard';

describe('OtcHubCard', () => {
  it('renders title, primary stat, and label', () => {
    render(
      <OtcHubCard
        icon={Search}
        title="Pretrazi"
        gradientFrom="from-indigo-500"
        gradientTo="to-violet-600"
        primaryStat="12"
        primaryStatLabel="javnih akcija"
        onClick={vi.fn()}
        dataTestId="hub-discovery"
      />,
    );
    expect(screen.getByText('Pretrazi')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('javnih akcija')).toBeInTheDocument();
  });

  it('renders secondaryStat when provided', () => {
    render(
      <OtcHubCard
        icon={Search}
        title="X"
        gradientFrom="from-indigo-500"
        gradientTo="to-violet-600"
        primaryStat="3"
        primaryStatLabel="aktivna"
        secondaryStat="iz 2 banke"
        onClick={vi.fn()}
        dataTestId="x"
      />,
    );
    expect(screen.getByText('iz 2 banke')).toBeInTheDocument();
  });

  it('shows warning badge when warningBadge is true', () => {
    render(
      <OtcHubCard
        icon={Search}
        title="X"
        gradientFrom="from-indigo-500"
        gradientTo="to-violet-600"
        primaryStat="3"
        primaryStatLabel="aktivna"
        warningBadge
        warningBadgeText="1 ceka tebe"
        onClick={vi.fn()}
        dataTestId="x"
      />,
    );
    expect(screen.getByText('1 ceka tebe')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <OtcHubCard
        icon={Search}
        title="X"
        gradientFrom="from-indigo-500"
        gradientTo="to-violet-600"
        primaryStat="3"
        primaryStatLabel="aktivna"
        onClick={onClick}
        dataTestId="hub-test"
      />,
    );
    fireEvent.click(screen.getByTestId('hub-test'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders skeleton when loading', () => {
    render(
      <OtcHubCard
        icon={Search}
        title="X"
        gradientFrom="from-indigo-500"
        gradientTo="to-violet-600"
        primaryStat="3"
        primaryStatLabel="aktivna"
        loading
        onClick={vi.fn()}
        dataTestId="x"
      />,
    );
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
