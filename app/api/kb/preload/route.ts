import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { firstSentences } from '@/lib/rag';
import type { KbArticle } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({ articles: [] });
  }
  const ids = idsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ articles: [] });
  }

  const { data, error } = await supabaseAdmin()
    .from('kb_articles')
    .select('id, title, content, url')
    .in('id', ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Preserve the request order (Supabase doesn't honour IN() ordering).
  const byId = new Map((data ?? []).map((r) => [r.id, r]));
  const articles: KbArticle[] = ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      snippet: firstSentences(r.content, 2),
      url: r.url ?? undefined,
    }));

  return NextResponse.json({ articles });
}
