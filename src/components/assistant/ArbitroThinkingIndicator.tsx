/**
 * Thinking indikator — 3 pulsing tackice + rotirajuca rec ispod, liquid glass stil.
 */
import { useEffect, useState } from 'react';
import './arbitro.css';

const PHRASES = [
  'Razmišljam',
  'Konsultujem znanje',
  'Analiziram pitanje',
  'Tražim podatke',
  'Pripremam odgovor',
];

export function ArbitroThinkingIndicator() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % PHRASES.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-indigo-500/10">
      <div className="flex items-center gap-1">
        <span className="arbitro-thinking-dot" />
        <span className="arbitro-thinking-dot" />
        <span className="arbitro-thinking-dot" />
      </div>
      <span
        key={index}
        className="text-xs italic text-zinc-600 dark:text-zinc-400 font-medium"
        style={{ animation: 'arbitro-fade-in-up 320ms ease' }}
      >
        {PHRASES[index]}…
      </span>
    </div>
  );
}
