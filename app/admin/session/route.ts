// app/admin/session/route.ts
import { NextResponse } from "next/server";
export async function GET() {
  // 쿠키/세션 검증해서 로그인 상태 리턴
  const loggedIn = true; // 실제 검증 로직으로 대체
  return NextResponse.json({ loggedIn });
}
