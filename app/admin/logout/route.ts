// app/api/admin/logout/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin', '', { httpOnly: true, sameSite: 'lax', maxAge: 0, path: '/' });
  return res;
}
