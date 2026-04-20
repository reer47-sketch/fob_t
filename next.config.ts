import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '1024mb', // 클라이언트 압축 후 원본(2MB) + 썸네일(0.3MB) + 메타데이터
        },
    },
};

export default nextConfig;
