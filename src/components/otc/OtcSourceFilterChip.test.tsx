import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OtcSourceFilterChip, { type OtcSource } from './OtcSourceFilterChip';

describe('OtcSourceFilterChip', () => {
  it('renders 3 chips: Sve, Iz nase, Iz drugih', () => {
    render(<OtcSourceFilterChip value="all" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Sve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iz nase banke/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iz drugih banaka/i })).toBeInTheDocument();
  });

  it('marks active chip as selected', () => {
    render(<OtcSourceFilterChip value="intra" onChange={vi.fn()} />);
    const intraBtn = screen.getByRole('button', { name: /Iz nase banke/i });
    expect(intraBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange when chip clicked', () => {
    const onChange = vi.fn<(value: OtcSource) => void>();
    render(<OtcSourceFilterChip value="all" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Iz drugih banaka/i }));
    expect(onChange).toHaveBeenCalledWith('inter');
  });
});
