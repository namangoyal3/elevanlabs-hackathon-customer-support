import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to .env.local before running migrations.');
  }

  const sql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const client = new Client({
    connectionString,
    ssl: /sslmode=require/i.test(connectionString) ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  console.log('→ Connected to Postgres');
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
