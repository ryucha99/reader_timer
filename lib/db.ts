// lib/db.ts
import { Pool } from 'pg';

declare global {
  var __pgPool__: Pool | undefined; // <- 이 줄은 유지 (전역 선언)
}

const pool =
  global.__pgPool__ ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__pgPool__ = pool;
}

export default pool;
