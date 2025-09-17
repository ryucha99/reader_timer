import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = url.searchParams.get('user');
  if (!user) return new NextResponse('missing user', { status: 400 });

  const { rows } = await pool.query(
    `SELECT DISTINCT date FROM steps WHERE user_name = $1 ORDER BY date ASC`,
    [user]
  );
  return NextResponse.json(rows.map(r => r.date as string));
}
