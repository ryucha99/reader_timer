// app/api/admin/login/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let pwd = '';
  try {
    const body = await request.json();
    // ✅ password 또는 pw 둘 다 허용
    pwd = (body?.password ?? body?.pw ?? '').toString().trim();
  } catch {
    // 바디 파싱 실패 시 빈 문자열
  }

  if (pwd !== '1234') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // ✅ HttpOnly 쿠키로 7일 유지
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    // 배포 시 https면 secure on
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
