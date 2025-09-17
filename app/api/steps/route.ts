// app/api/steps/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const { user, date, book, startPage, endPage, pagesRead, timestamp } = b ?? {};

    if (!user || !date || !book ||
        !Number.isInteger(startPage) || !Number.isInteger(endPage) ||
        !Number.isInteger(pagesRead) || !Number.isInteger(timestamp)) {
      return new NextResponse('bad payload', { status: 400 });
    }

    await pool.query(
      `INSERT INTO steps (user_name, date, book, start_page, end_page, pages_read, ts)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user, date, book, startPage, endPage, pagesRead, timestamp]
    );

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('POST /api/steps error:', e);
    return new NextResponse(getErrorMessage(e), { status: 500 });
  }
}
