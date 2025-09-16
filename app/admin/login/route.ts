// app/admin/login/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 로그인 수행: POST /admin/login
export async function POST(request: Request) {
  let pwd = '';
  try {
    const body = await request.json();
    pwd = (body?.password ?? body?.pw ?? '').toString().trim();
  } catch { /* ignore */ }

  if (pwd !== '1234') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}


// 로그인 상태 확인: GET /admin/login
export async function GET(req: NextRequest) {
  const isAdmin = req.cookies.get('admin')?.value === '1';
  return NextResponse.json({ authed: isAdmin });
}

// (옵션) CORS 예비요청 대응
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
