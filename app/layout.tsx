import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Claude Code 교육 입장 테스트",
  description: "Claude Code 교육 참여를 위한 영타 속도 테스트 — 45 WPM 이상이면 교육 신청 가능",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={jetbrainsMono.variable}>
      <body>
        <div className="scanline" />
        {children}
      </body>
    </html>
  );
}
