// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientInit from "./_components/ClientInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "3분 타이머",
  description: "간단한 PWA 타이머 앱",
  themeColor: "#0ea5e9",
  manifest: "/manifest.json", // 이건 유지
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* manifest는 metadata로도 연결되지만, 확실하게 해주는 게 좋아 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />

        {/* iOS PWA 실행용 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="3분 타이머" />
        <link rel="apple-touch-icon" href="/android-chrome-192x192.png" />

        {/* 안전 영역 대응 */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
         <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* SW 등록용 클라이언트 초기화 */}
        {/* (혹은 정상 import 하되, 상단에서 default import) */}
        {/**/}
        <ClientInit />
        {children}
      </body>
    </html>
  );
}


