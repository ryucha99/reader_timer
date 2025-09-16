import db from '@/lib/db';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get('user');
  if (!user) return new Response('Missing user', { status: 400 });

  const rows = db
    .prepare('SELECT DISTINCT date FROM steps WHERE user = ? ORDER BY date DESC')
    .all(user) as { date: string }[];   // ✅ 타입 단언 추가

  return Response.json(rows.map((r) => r.date));
}
