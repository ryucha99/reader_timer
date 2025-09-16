// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) 로그인 UI가 있는 /admin 과
  // 2) 상태/로그인 API인 /admin/login 은 통과
  if (pathname === '/admin' || pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // 그 외의 /admin 하위 경로 보호 (/admin/dashboard 등)
  if (pathname.startsWith('/admin')) {
    const isAdmin = req.cookies.get('admin')?.value === '1';
    if (!isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin'; // 로그인 UI 있는 페이지로
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
