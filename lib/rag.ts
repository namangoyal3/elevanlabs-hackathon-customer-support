import type { KbArticle } from '@/types';
import { supabaseAdmin } from '@/lib/db';
import { embedQuery } from '@/lib/nvidia-embed';

// Empirically tuned against nv-embedqa-e5-v5 on the NovaPay KB. This model's
// similarities cluster in the 0.3–0.6 band for the 3 PRD demo scenarios; the
// PRD's 0.72 figure was OpenAI-specific and does not port.
export const DEFAULT_MATCH_THRESHOLD = 0.35;
export const DEFAULT_TOP_K = 3;

interface MatchRow {
  id: string;
  title: string;
  content: string;
  url: string | null;
  similarity: number;
}

/**
 * Retrieve the top-K KB articles whose embedding cosine similarity to the
 * query is above `threshold`. Returns [] when no article clears the bar.
 *
 * The threshold (0.45) is intentionally looser than the PRD's 0.72 because
 * nv-embedqa-e5-v5 similarities cluster lower than OpenAI's. Tune on real
 * data once we have enough test queries.
 */
export async function ragSearch(
  query: string,
  topK: number = DEFAULT_TOP_K,
  threshold: number = DEFAULT_MATCH_THRESHOLD,
): Promise<KbArticle[]> {
  const queryText = query.trim();
  if (!queryText) return [];

  const embedding = await embedQuery(queryText);

  const { data, error } = await supabaseAdmin().rpc('match_kb_articles', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: topK,
  });

  if (error) {
    throw new Error(`match_kb_articles RPC failed: ${error.message}`);
  }

  const rows = (data ?? []) as MatchRow[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    snippet: firstSentences(r.content, 2),
    url: r.url ?? undefined,
    similarity: r.similarity,
  }));
}

export function firstSentences(text: string, count: number): string {
  const clean = text.replace(/^#\s.*\n+/, '').replace(/\s+/g, ' ').trim();
  const parts = clean.split(/(?<=[.!?])\s+/).slice(0, count);
  return parts.join(' ');
}
