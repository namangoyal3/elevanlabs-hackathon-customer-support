import fs from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env if present

const KB_DIR = path.join(process.cwd(), 'kb', 'novapay');

async function main() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!url) throw new Error('SUPABASE_URL is not set');
  if (!secretKey) throw new Error('SUPABASE_SECRET_KEY is not set');
  if (!openaiKey) throw new Error('OPENAI_API_KEY is not set');

  if (!fs.existsSync(KB_DIR)) {
    console.log(`→ ${KB_DIR} does not exist yet. Add markdown articles in Phase 1.`);
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
  const openai = new OpenAI({ apiKey: openaiKey });

  for (const file of files) {
    const fullPath = path.join(KB_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const title = (content.split('\n')[0] || file).replace(/^#\s*/, '').trim();
    const id = file.replace(/\.md$/, '');

    const { data } = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content,
    });
    const embedding = data[0].embedding;

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

    console.log(`✅ Ingested ${id}`);
  }

  console.log('KB ingestion complete');
}

main().catch((err) => {
  console.error('❌ KB ingestion failed:', err);
  process.exit(1);
});
