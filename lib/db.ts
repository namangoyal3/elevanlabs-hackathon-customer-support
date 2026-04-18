import { Pool, type PoolConfig, type QueryResult, type QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function buildPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to .env.local.');
  }

  const config: PoolConfig = {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };

  if (/sslmode=require/i.test(connectionString) || process.env.NODE_ENV === 'production') {
    config.ssl = { rejectUnauthorized: false };
  }

  return new Pool(config);
}

function getPool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = buildPool();
  }
  return global.__pgPool;
}

export const db = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: ReadonlyArray<unknown>,
  ): Promise<QueryResult<T>> {
    return getPool().query<T>(text, params as unknown as unknown[]);
  },
};
