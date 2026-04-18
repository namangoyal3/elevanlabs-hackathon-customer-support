import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import OpenAI from 'openai';

const KB_DIR = path.join(process.cwd(), 'kb', 'novapay');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
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

  const openai = new OpenAI({ apiKey: openaiKey });
  const client = new Client({
    connectionString,
    ssl: /sslmode=require/i.test(connectionString) ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

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

    await client.query(
      `INSERT INTO kb_articles (id, title, content, embedding, company_id, updated_at)
       VALUES ($1, $2, $3, $4::vector, 'novapay', now())
       ON CONFLICT (id) DO UPDATE
         SET title = EXCLUDED.title,
             content = EXCLUDED.content,
             embedding = EXCLUDED.embedding,
             updated_at = now()`,
      [id, title, content, JSON.stringify(embedding)],
    );

    console.log(`✅ Ingested ${id}`);
  }

  await client.end();
  console.log('KB ingestion complete');
}

main().catch((err) => {
  console.error('❌ KB ingestion failed:', err);
  process.exit(1);
});
