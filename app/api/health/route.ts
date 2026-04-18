import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await db.query<{
      now: string;
      vector_installed: boolean;
    }>(
      `SELECT now() AS now,
              EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS vector_installed`,
    );
    return NextResponse.json({ ok: true, db: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
