/**
 * Minimalan markdown renderer za Arbitro odgovore.
 * Bez vanjskog dependency-ja (react-markdown nije u repo-u).
 *
 * Podrzava:
 *  - **bold**, *italic*, `code`
 *  - liste (- ili 1. )
 *  - linkovi [text](url)
 *  - **#action:goto:/path** linkovi → renderuju se kao indigo dugme + navigate
 *
 * NE podrzava:
 *  - tabele (treba slozenije parsiranje)
 *  - blockquote-ove
 *  - inline images
 *  - LaTeX
 *
 * Ako neki future use-case trazi vise, ucitati react-markdown + rehype-sanitize.
 */
import { ArrowRight } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const ACTION_LINK_PATTERN = /^#action:goto:(\/[a-z][a-zA-Z0-9/_\-?=&%]*)$/;

function ArbitroActionButton({ href, label }: { href: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className="arbitro-action-btn"
    >
      {label}
      <ArrowRight className="h-3 w-3" />
    </button>
  );
}

function renderInline(line: string, key: number): ReactNode {
  // Markdown link [text](url) — najbitnije zbog #action: dugmadi
  const segments: ReactNode[] = [];
  let cursor = 0;
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  let counter = 0;
  while ((match = linkRe.exec(line)) !== null) {
    if (match.index > cursor) {
      segments.push(renderTextSegment(line.slice(cursor, match.index), `${key}-t-${counter}`));
    }
    const [whole, label, href] = match;
    const action = ACTION_LINK_PATTERN.exec(href);
    if (action) {
      segments.push(<ArbitroActionButton key={`${key}-a-${counter}`} href={action[1]} label={label} />);
    } else if (/^https?:\/\//i.test(href)) {
      segments.push(
        <a key={`${key}-l-${counter}`} href={href} target="_blank" rel="noreferrer noopener"
           className="text-indigo-600 underline dark:text-indigo-400">
          {label}
        </a>
      );
    } else {
      // Nepoznate seme — render kao plain text radi sigurnosti
      segments.push(<span key={`${key}-x-${counter}`}>{whole}</span>);
    }
    cursor = match.index + whole.length;
    counter++;
  }
  if (cursor < line.length) {
    segments.push(renderTextSegment(line.slice(cursor), `${key}-tail`));
  }
  return <Fragment key={key}>{segments}</Fragment>;
}

function renderTextSegment(text: string, key: string): ReactNode {
  // Bold **x**, italic *x*, code `x`
  const parts: ReactNode[] = [];
  let i = 0;
  let counter = 0;
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end > i) {
        parts.push(<strong key={`${key}-b-${counter++}`}>{text.slice(i + 2, end)}</strong>);
        i = end + 2;
        continue;
      }
    }
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i) {
        parts.push(
          <code key={`${key}-c-${counter++}`}
                className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800">
            {text.slice(i + 1, end)}
          </code>
        );
        i = end + 1;
        continue;
      }
    }
    if (text[i] === '*' && text[i + 1] !== '*') {
      const end = text.indexOf('*', i + 1);
      if (end > i) {
        parts.push(<em key={`${key}-i-${counter++}`}>{text.slice(i + 1, end)}</em>);
        i = end + 1;
        continue;
      }
    }
    // Plain run
    let j = i;
    while (j < text.length && text[j] !== '*' && text[j] !== '`') j++;
    parts.push(<Fragment key={`${key}-p-${counter++}`}>{text.slice(i, j)}</Fragment>);
    i = j;
  }
  return <Fragment key={key}>{parts}</Fragment>;
}

export function ArbitroMarkdown({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;
  let blockKey = 0;

  const flushList = () => {
    if (!listBuffer) return;
    const Tag = listBuffer.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={`l-${blockKey++}`}
           className={`${listBuffer.ordered ? 'list-decimal' : 'list-disc'} pl-5 my-1.5 space-y-1`}>
        {listBuffer.items.map((item, idx) => (
          <li key={idx}>{renderInline(item, idx)}</li>
        ))}
      </Tag>
    );
    listBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const ulMatch = /^[-*]\s+(.*)$/.exec(line);
    const olMatch = /^\d+\.\s+(.*)$/.exec(line);
    if (ulMatch) {
      if (!listBuffer || listBuffer.ordered) { flushList(); listBuffer = { ordered: false, items: [] }; }
      listBuffer.items.push(ulMatch[1]);
      continue;
    }
    if (olMatch) {
      if (!listBuffer || !listBuffer.ordered) { flushList(); listBuffer = { ordered: true, items: [] }; }
      listBuffer.items.push(olMatch[1]);
      continue;
    }
    flushList();
    if (line.length === 0) {
      // Pretvori uzastopne prazne linije u jedan paragraf-spacer
      continue;
    }
    blocks.push(
      <p key={`p-${blockKey++}`} className="my-1.5 leading-relaxed">
        {renderInline(line, blockKey)}
      </p>
    );
  }
  flushList();
  return <div className="text-sm">{blocks}</div>;
}
