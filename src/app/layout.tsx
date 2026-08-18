import type { Metadata } from 'next';
import { Noto_Sans_KR, Noto_Sans_Mono } from 'next/font/google';
import './globals.css';

const sans = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
  display: 'swap',
});

// 기록 노트는 고정폭 — '기록'이라는 느낌을 준다
const mono = Noto_Sans_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '퇴근하지 마세요',
  description: '미스터리 / 심리 스릴러 추리 게임',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
