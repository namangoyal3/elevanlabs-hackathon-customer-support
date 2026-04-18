import type { KbArticle } from '@/types';

interface Props {
  article: KbArticle;
  rank: number; // 1 = top, 2 = second, ...
}

export function KbCard({ article, rank }: Props) {
  const isTop = rank === 1;
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
      <header className="mb-2 flex items-start justify-between gap-4">
        <div className="flex items-baseline gap-2.5">
          <span className="text-fg-subtle font-mono text-2xs leading-none">#{rank}</span>
          <h4 className="text-fg-strong font-semibold leading-snug tracking-tight">
            {article.title}
          </h4>
        </div>
        {typeof article.similarity === 'number' && (
          <span
            className="text-fg-subtle font-mono text-2xs shrink-0 leading-none pt-1"
            data-nums
            title={`cosine similarity ${article.similarity.toFixed(3)}`}
          >
            {Math.round(article.similarity * 100)}%
          </span>
        )}
      </header>
      <p className="text-fg leading-relaxed text-sm">
        {article.snippet ?? article.content.slice(0, 220) + '…'}
      </p>
      {article.url && (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-fg hover:text-accent mt-3 inline-flex items-center gap-1 text-2xs uppercase tracking-[0.12em] underline-offset-4 hover:underline"
        >
          Read article <span aria-hidden="true">→</span>
        </a>
      )}
    </article>
  );
}
