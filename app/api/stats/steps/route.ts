// app/api/stats/steps/route.ts
import db from '@/lib/db';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get('user');
  const datesParam = searchParams.get('dates');
  const book = searchParams.get('book');
  if (!user || !datesParam || !book) return new Response('Missing params', { status: 400 });

  const dates = datesParam.split(',').map(s => s.trim()).filter(Boolean);
  if (dates.length === 0) return Response.json([]);

  const placeholders = dates.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT id, user, date, book, startPage, endPage, pagesRead, timestamp
     FROM steps
     WHERE user = ? AND book = ? AND date IN (${placeholders})
     ORDER BY timestamp ASC`
  ).all(user, book, ...dates);

  return Response.json(rows);
}
