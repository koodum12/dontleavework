import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '퇴근하지 마세요',
  description: '미스터리 / 심리 스릴러 추리 게임',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
