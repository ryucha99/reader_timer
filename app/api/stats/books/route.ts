import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = url.searchParams.get('user');
  const dates = (url.searchParams.get('dates') ?? '')
    .split(',').map(s => s.trim()).filter(Boolean);

  if (!user || dates.length === 0) return new NextResponse('missing params', { status: 400 });

  const { rows } = await pool.query(
    `SELECT DISTINCT book
       FROM steps
      WHERE user_name = $1 AND date = ANY($2)
      ORDER BY book ASC`,
    [user, dates]
  );

  return NextResponse.json(rows.map(r => r.book as string));
}
