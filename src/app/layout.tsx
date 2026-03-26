import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "법률문서 코파일럿",
  description: "법률전문가 내부업무 자동화용 멀티 에이전트 문서작성·검증 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
