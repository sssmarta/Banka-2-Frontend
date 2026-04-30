/**
 * Inline tool call indikator — Liquid Glass pill sa expand-on-click args.
 */
import { Check, ChevronRight, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import type { ArbitroToolCallIndicator } from '../../types/arbitro';
import './arbitro.css';

const ICON_MAP: Record<string, string> = {
  wikipedia_search: '🔍',
  wikipedia_summary: '🔍',
  rag_search_spec: '📚',
  get_user_balance_summary: '📊',
  get_recent_orders: '📊',
  exchange_rate: '💱',
  calculator: '🧮',
};

const HUMAN_NAME_MAP: Record<string, string> = {
  wikipedia_search: 'Pretrazujem Wikipediju',
  wikipedia_summary: 'Citam Wikipedia clanak',
  rag_search_spec: 'Trazim u Banka 2 spec-u',
  get_user_balance_summary: 'Citam tvoje racune',
  get_recent_orders: 'Citam tvoje ordere',
  exchange_rate: 'Proveravam kurs',
  calculator: 'Racunam',
};

export function ArbitroToolIndicator({ tool }: { tool: ArbitroToolCallIndicator }) {
  const icon = ICON_MAP[tool.name] ?? '⚙';
  const human = HUMAN_NAME_MAP[tool.name] ?? tool.name;
  const inFlight = tool.ok === undefined;
  const [expanded, setExpanded] = useState(false);

  const hasArgs =
    tool.args !== null && tool.args !== undefined && Object.keys(tool.args as object).length > 0;
  const canExpand = !inFlight && hasArgs;

  return (
    <div className="arbitro-tool flex-col">
      <button
        type="button"
        disabled={!canExpand}
        onClick={() => canExpand && setExpanded((p) => !p)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${
          canExpand ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        {canExpand && (
          <ChevronRight
            className={`h-3 w-3 shrink-0 text-zinc-400 transition ${expanded ? 'rotate-90' : ''}`}
          />
        )}
        <span aria-hidden="true" className="text-base leading-none">{icon}</span>
        <span className="font-medium text-zinc-700 dark:text-zinc-200">{human}</span>
        {inFlight ? (
          <Loader2 className="h-3 w-3 animate-spin text-indigo-500 ml-auto" />
        ) : tool.ok ? (
          <span className="flex items-center gap-1 ml-auto text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" />
            {tool.summary && (
              <span className="text-zinc-500 dark:text-zinc-400 font-normal">· {tool.summary}</span>
            )}
          </span>
        ) : (
          <span className="flex items-center gap-1 ml-auto text-rose-600 dark:text-rose-400">
            <X className="h-3 w-3" />
            {tool.summary && (
              <span className="text-zinc-500 dark:text-zinc-400 font-normal">· {tool.summary}</span>
            )}
          </span>
        )}
      </button>
      {expanded && hasArgs && (
        <div className="border-t border-indigo-500/15 px-3 py-2 bg-white/30 dark:bg-white/5 backdrop-blur-sm">
          <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-mono">
            {JSON.stringify(tool.args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
