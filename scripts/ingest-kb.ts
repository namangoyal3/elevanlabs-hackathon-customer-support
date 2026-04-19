import fs from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });
dotenv.config();

const KB_DIR = path.join(process.cwd(), 'kb', 'novapay');

async function main() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (!url) throw new Error('SUPABASE_URL is not set');
  if (!secretKey) throw new Error('SUPABASE_SECRET_KEY is not set');
  if (!nvidiaKey) throw new Error('NVIDIA_API_KEY is not set');

  if (!fs.existsSync(KB_DIR)) {
    console.log(`→ ${KB_DIR} does not exist yet.`);
    return;
  }

  const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    console.log('→ No KB markdown files found.');
    return;
  }

  const supabase = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // NVIDIA NIM uses an OpenAI-compatible API
  const nvidia = new OpenAI({
    apiKey: nvidiaKey,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });

  for (const file of files) {
    const fullPath = path.join(KB_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const title = (content.split('\n')[0] || file).replace(/^#\s*/, '').trim();
    const id = file.replace(/\.md$/, '');

    const response = await nvidia.embeddings.create({
      model: 'nvidia/nv-embedqa-e5-v5',
      input: content,
      // @ts-ignore — NVIDIA NIM requires this extra param
      encoding_format: 'float',
      extra_body: { input_type: 'passage', truncate: 'END' },
    });
    const embedding = response.data[0].embedding;

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

    console.log(`✅ Ingested: ${title}`);
  }

  console.log('\nKB ingestion complete — all articles loaded into Supabase.');
}

main().catch((err) => {
  console.error('❌ KB ingestion failed:', err);
  process.exit(1);
});
