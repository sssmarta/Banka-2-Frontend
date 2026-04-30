/**
 * Renderuje pojedinacnu Arbitro poruku — Liquid Glass bubbles.
 *
 * VAZNA OPTIMIZACIJA: Tokom streaming-a, content se prikazuje kao **plain
 * text** sa `whitespace-pre-wrap`, NE kao markdown. Razlog: ArbitroMarkdown
 * parser (regex + React node tree build) je O(n²) za inkrementalan tekst,
 * sa 100+ token chunkova zaledjuje main thread (UI postaje nereaktivan,
 * dugmad ne reaguju). Markdown se parsira tek kad je status='done'.
 *
 * Plus: ceo komponent je React.memo-vano da samo poruka koja se menja
 * re-render-uje, ne cela lista.
 */
import { AlertCircle, Bot, BookOpen, Check, Copy, Globe } from 'lucide-react';
import { memo, useState } from 'react';
import type { ArbitroMessage } from '../../types/arbitro';
import { ArbitroMarkdown } from './markdown';
import { ArbitroToolIndicator } from './ArbitroToolIndicator';
import { ArbitroThinkingIndicator } from './ArbitroThinkingIndicator';
import './arbitro.css';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard api blocked */
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      title={copied ? 'Kopirano' : 'Kopiraj odgovor'}
      className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/40 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-violet-300 backdrop-blur-sm"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function ArbitroMessageViewImpl({ message }: { message: ArbitroMessage }) {
  if (message.role === 'USER') {
    return (
      <div className="flex justify-end">
        <div className="arbitro-bubble-user max-w-[85%] text-sm">{message.content}</div>
      </div>
    );
  }

  const showSpinner =
    message.status === 'streaming' &&
    !message.content &&
    (!message.toolCalls || message.toolCalls.length === 0);

  // Tokom streaming-a NE pokrecemo skup markdown parser — koristimo plain
  // text sa whitespace-pre-wrap. Markdown se parsira tek kad je 'done'.
  // To resava UI freeze pri ~100+ token chunkova.
  const isStreaming = message.status === 'streaming';

  return (
    <div className="flex gap-2.5">
      <div className="arbitro-avatar relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl">
        <Bot className="h-4 w-4 text-white relative z-10" />
      </div>
      <div className="flex max-w-[85%] flex-col gap-2">
        {message.toolCalls?.map((t, idx) => (
          <ArbitroToolIndicator key={`${message.key}-tool-${idx}`} tool={t} />
        ))}
        {showSpinner && <ArbitroThinkingIndicator />}
        {message.content && (
          <div className="group/msg relative arbitro-bubble-assistant text-sm">
            {isStreaming ? (
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
            ) : (
              <ArbitroMarkdown content={message.content} />
            )}
            {message.status === 'done' && (
              <div className="absolute right-1.5 top-1.5 opacity-0 transition group-hover/msg:opacity-100">
                <CopyButton text={message.content} />
              </div>
            )}
          </div>
        )}
        {message.status === 'error' && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200/60 bg-rose-50/60 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 backdrop-blur-md">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{message.errorMessage ?? 'Doslo je do greske.'}</span>
          </div>
        )}
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map((s, idx) => (
              <span key={`${message.key}-src-${idx}`} className="arbitro-source">
                {s.type === 'wikipedia' ? <Globe className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                {s.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * React.memo sa custom comparator — re-render-uje samo kad se sadrzaj
 * KONKRETNE poruke promenio. Bez ovoga, svaki setMessages u parent-u
 * (svaki token tick) re-render-uje SVE poruke u listi.
 */
export const ArbitroMessageView = memo(ArbitroMessageViewImpl, (prev, next) => {
  if (prev.message === next.message) return true;
  const a = prev.message;
  const b = next.message;
  return (
    a.key === b.key &&
    a.content === b.content &&
    a.status === b.status &&
    a.errorMessage === b.errorMessage &&
    (a.toolCalls?.length ?? 0) === (b.toolCalls?.length ?? 0) &&
    (a.sources?.length ?? 0) === (b.sources?.length ?? 0)
  );
});
