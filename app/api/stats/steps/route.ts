import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Step = {
  id: number; user: string; date: string; book: string;
  startPage: number; endPage: number; pagesRead: number; timestamp: number;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = url.searchParams.get('user');
  const dates = (url.searchParams.get('dates') ?? '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const book = url.searchParams.get('book');

  if (!user || dates.length === 0 || !book) return new NextResponse('missing params', { status: 400 });

  type Row = {
    id: number; user_name: string; date: string; book: string;
    start_page: number; end_page: number; pages_read: number; ts: number;
  };
  const { rows } = await pool.query<Row>(
    `SELECT id, user_name, date, book, start_page, end_page, pages_read, ts
      FROM steps
      WHERE user_name = $1 AND date = ANY($2) AND book = $3
      ORDER BY ts ASC`,
    [user, dates, book]
  );


  const data: Step[] = rows.map(r => ({
    id: Number(r.id),
    user: String(r.user_name),
    date: String(r.date),
    book: String(r.book),
    startPage: Number(r.start_page),
    endPage: Number(r.end_page),
    pagesRead: Number(r.pages_read),
    timestamp: Number(r.ts),
  }));

  return NextResponse.json(data);
}
