import fs from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env if present

const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to .env.local before running migrations.');
  }

  const sql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const client = new Client({
    connectionString,
    // Supabase always requires SSL; their cert chain isn't in Node's default trust store.
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('→ Connected to Postgres');

  if (process.env.MIGRATE_RESET_KB === 'true') {
    console.warn('⚠️  MIGRATE_RESET_KB=true — dropping kb_articles (DATA LOSS).');
    await client.query(`
      DROP FUNCTION IF EXISTS match_kb_articles(vector, float, int) CASCADE;
      DROP INDEX IF EXISTS kb_articles_embedding_hnsw;
      DROP TABLE IF EXISTS kb_articles CASCADE;
    `);
    console.log('→ kb_articles dropped');
  }

  console.log(`→ Applying ${SCHEMA_PATH}`);
  await client.query(sql);
  console.log('✅ Migration complete');

  const { rows } = await client.query<{ extname: string }>(
    `SELECT extname FROM pg_extension WHERE extname = 'vector'`,
  );
  if (rows.length === 0) {
    console.warn('⚠️  pgvector extension not detected after migration.');
  } else {
    console.log('✅ pgvector ready');
  }

  await client.end();
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
