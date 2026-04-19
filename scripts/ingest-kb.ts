import fs from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

import { embedPassage, NVIDIA_EMBED_DIM } from '../lib/nvidia-embed';

const KB_DIR = path.join(process.cwd(), 'kb', 'novapay');

export function parseArticle(filename: string, body: string): { id: string; title: string; content: string } {
  const id = filename.replace(/\.md$/, '');
  const firstLine = body.split('\n')[0] ?? filename;
  const title = firstLine.replace(/^#\s*/, '').trim() || id;
  return { id, title, content: body };
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url) throw new Error('SUPABASE_URL is not set');
  if (!secretKey) throw new Error('SUPABASE_SECRET_KEY is not set');

  if (!fs.existsSync(KB_DIR)) {
    console.log(`→ ${KB_DIR} does not exist yet. Add markdown articles first.`);
    return;
  }

  const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    console.log('→ No KB markdown files found. Add articles to kb/novapay/ first.');
    return;
  }

  const supabase = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`→ Ingesting ${files.length} articles via nv-embedqa-e5-v5 (dim ${NVIDIA_EMBED_DIM})`);

  for (const file of files) {
    const body = fs.readFileSync(path.join(KB_DIR, file), 'utf-8');
    const { id, title, content } = parseArticle(file, body);

    const embedding = await embedPassage(content);

    const { error } = await supabase.from('kb_articles').upsert(
      {
        id,
        title,
        content,
        embedding: embedding as unknown as number[],
        company_id: 'novapay',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (error) {
      console.error(`❌ Failed to upsert ${id}:`, error.message);
      process.exit(1);
    }

    console.log(`✅ Ingested ${id} — "${title}"`);
  }

  console.log('KB ingestion complete');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('ingest-kb.ts')) {
  main().catch((err) => {
    console.error('❌ KB ingestion failed:', err);
    process.exit(1);
  });
}
