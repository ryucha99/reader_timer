// lib/db.ts  (싱글톤 풀)
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool__: Pool | undefined;
}

const pool =
  global.__pgPool__ ??
  new Pool({
    connectionString: process.env.DATABASE_URL, // Neon의 (pooled) URL
    // ssl: { rejectUnauthorized: false }, // 필요 시
  });

if (process.env.NODE_ENV !== 'production') {
  global.__pgPool__ = pool;
}

export default pool;
