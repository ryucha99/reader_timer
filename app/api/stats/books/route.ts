// app/api/stats/books/route.ts
import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get('user');
  const datesParam = searchParams.get('dates');
  if (!user || !datesParam) return new Response('Missing user/dates', { status: 400 });

  const dates = datesParam.split(',').map((s) => s.trim()).filter(Boolean);
  if (dates.length === 0) return Response.json([]);

  const placeholders = dates.map(() => '?').join(',');
  const query = `
    SELECT DISTINCT book
    FROM steps
    WHERE user = ? AND date IN (${placeholders})
    ORDER BY book COLLATE NOCASE ASC
  `;

  // 결과 타입을 명시적으로 단언
  const rows = db.prepare(query).all(user, ...dates) as { book: string }[];
  return Response.json(rows.map((r) => r.book));
}
