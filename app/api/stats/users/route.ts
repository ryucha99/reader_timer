import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // app/api/stats/users/route.ts
  const { rows } = await pool.query<{ user: string }>(
    `SELECT DISTINCT user_name AS user FROM steps ORDER BY user_name ASC`
  );
  return NextResponse.json(rows.map(({ user }) => user));

}
