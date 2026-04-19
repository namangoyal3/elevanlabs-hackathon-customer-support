import type { KbArticle } from '@/types';

interface Props {
  article: KbArticle;
  rank: number;
}

function splitSnippet(text: string): { lead: string; rest: string } {
  const i = text.indexOf('. ');
  if (i === -1) return { lead: text, rest: '' };
  return { lead: text.slice(0, i + 1), rest: text.slice(i + 2) };
}

export function KbCard({ article, rank }: Props) {
  const isTop = rank === 1;
  const snippetText = article.snippet ?? article.content.slice(0, 220) + '…';
  const { lead, rest } = splitSnippet(snippetText);

  return (
    <article
      className={`border-border bg-surface shadow-card animate-rise-in group relative overflow-hidden rounded-lg border p-5 transition-colors ${
        isTop ? 'border-accent/40' : ''
      }`}
    >
      {isTop && (
        <span
          aria-hidden="true"
          className="bg-accent absolute inset-y-0 left-0 w-[3px] rounded-l-lg"
        />
      )}
      <header className="mb-3 flex items-start gap-3">
        {/* Rank badge */}
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-bold leading-none ${
            isTop
              ? 'bg-accent text-accent-fg'
              : 'bg-surface-2 text-fg-muted'
          }`}
        >
          {rank}
        </span>
        <h4 className="text-fg-strong font-semibold leading-snug tracking-tight">
          {article.title}
        </h4>
      </header>

      {/* Snippet — first sentence as lead, rest as secondary */}
      <div className="space-y-1 pl-8">
        <p className="text-fg font-medium leading-snug">{lead}</p>
        {rest && <p className="text-fg-muted text-sm leading-relaxed">{rest}</p>}
      </div>

      {article.url && (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-fg hover:text-accent mt-4 inline-flex items-center gap-1 rounded pl-8 text-sm underline-offset-4 hover:underline"
        >
          Read article
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </a>
      )}
    </article>
  );
}
