import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request) {
  // ✅ cookies()가 Promise로 잡혀있는 타입 환경에 맞춤
  const cookieStore = await cookies();
  const admin = cookieStore.get('admin')?.value;
  if (admin !== '1') return new NextResponse('Unauthorized', { status: 401 });

  const rows = db
    .prepare(`SELECT DISTINCT user FROM steps ORDER BY user COLLATE NOCASE ASC`)
    .all() as { user: string }[];

  return NextResponse.json(rows.map((r) => r.user));
}
