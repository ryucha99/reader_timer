// app/api/steps/route.ts
import db from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user, date, book, startPage, endPage, pagesRead, timestamp } = body ?? {};

    if (!user || !date || !book) return new Response('Missing user/date/book', { status: 400 });
    if (typeof startPage !== 'number' || typeof endPage !== 'number' || typeof pagesRead !== 'number')
      return new Response('Invalid pages', { status: 400 });
    if (typeof timestamp !== 'number') return new Response('Invalid timestamp', { status: 400 });

    const stmt = db.prepare(`
      INSERT INTO steps (user, date, book, startPage, endPage, pagesRead, timestamp)
      VALUES (@user, @date, @book, @startPage, @endPage, @pagesRead, @timestamp)
    `);
    stmt.run({ user, date, book, startPage, endPage, pagesRead, timestamp });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response('Server error', { status: 500 });
  }
}
