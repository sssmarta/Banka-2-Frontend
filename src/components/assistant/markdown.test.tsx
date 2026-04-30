/**
 * Vitest za ArbitroMarkdown — minimalni inline parser.
 * Verifikuje: bold/italic/code/lists, regular linkovi, #action:goto: dugmici.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ArbitroMarkdown } from './markdown';

function renderMd(content: string) {
  return render(
    <MemoryRouter>
      <ArbitroMarkdown content={content} />
    </MemoryRouter>
  );
}

describe('ArbitroMarkdown', () => {
  it('renders plain paragraphs', () => {
    renderMd('Zdravo svete');
    expect(screen.getByText('Zdravo svete')).toBeInTheDocument();
  });

  it('renders bold text', () => {
    renderMd('Ovo je **bold** tekst');
    const strong = screen.getByText('bold');
    expect(strong.tagName).toBe('STRONG');
  });

  it('renders inline code', () => {
    renderMd('Pozovi `useArbitro()` hook');
    const code = screen.getByText('useArbitro()');
    expect(code.tagName).toBe('CODE');
  });

  it('renders unordered list items', () => {
    renderMd('- prvi\n- drugi\n- treci');
    expect(screen.getByText('prvi')).toBeInTheDocument();
    expect(screen.getByText('drugi')).toBeInTheDocument();
    expect(screen.getByText('treci')).toBeInTheDocument();
  });

  it('renders ordered list items', () => {
    renderMd('1. korak jedan\n2. korak dva');
    expect(screen.getByText('korak jedan')).toBeInTheDocument();
    expect(screen.getByText('korak dva')).toBeInTheDocument();
  });

  it('renders external https link as <a>', () => {
    renderMd('Vidi [dokumentaciju](https://example.com)');
    const link = screen.getByText('dokumentaciju') as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('renders #action:goto: as button (not link)', () => {
    renderMd('Idi na [Plaćanja](#action:goto:/payments/new) sad');
    const btn = screen.getByText('Plaćanja') as HTMLButtonElement;
    expect(btn.tagName).toBe('BUTTON');
  });

  it('rejects invalid action paths and does not render as button or external link', () => {
    // Path ne matchuje #action:goto:/[a-z]... → security guard renderuje
    // kao plain span sa originalnim [HACK](...) tekstom (literal markdown).
    const { container } = renderMd('Try [HACK](#action:goto:javascript:alert) link');
    // Nista u dokumentu nije ni BUTTON ni A koji ima HACK tekst.
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    // Tekst sadrzi HACK negde (literal markdown ostao kao plain span).
    expect(container.textContent).toContain('HACK');
  });

  it('handles empty content gracefully', () => {
    const { container } = renderMd('');
    expect(container.firstChild).toBeNull();
  });
});
