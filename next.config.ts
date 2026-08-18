import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',          // 순수 클라이언트 게임 → 정적 빌드
  images: { unoptimized: true },
  reactStrictMode: true,     // 2D는 물리 엔진이 없으므로 켜둔다
};

export default nextConfig;
