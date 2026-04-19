import type { KbArticle } from '@/types';

interface Props {
  article: KbArticle;
  rank: number; // 1 = top, 2 = second, ...
}

export function KbCard({ article, rank }: Props) {
  const isTop = rank === 1;
  return (
    <article
      className={`border-border bg-surface animate-in fade-in slide-in-from-right-4 rounded-lg border p-4 duration-300 ${
        isTop ? 'border-l-accent border-l-4' : ''
      }`}
    >
      <header className="mb-2 flex items-start justify-between gap-3">
        <h4 className="font-semibold leading-tight">
          <span className="text-muted mr-2 font-mono text-xs">#{rank}</span>
          {article.title}
        </h4>
        {typeof article.similarity === 'number' && (
          <span className="text-muted font-mono text-xs">
            {article.similarity.toFixed(3)}
          </span>
        )}
      </header>
      <p className="text-sm text-neutral-200">{article.snippet ?? article.content.slice(0, 220) + '…'}</p>
      {article.url && (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent mt-2 inline-block text-xs underline"
        >
          View full article →
        </a>
      )}
    </article>
  );
}
