import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // 允許透過 Cloudflare Tunnel 網域存取 dev server 的 /_next/* 資源
  allowedDevOrigins: ['project-a-dev.blockcode.com.tw'],
  serverExternalPackages: ['@react-pdf/renderer'],
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },



  },
};

export default withNextIntl(nextConfig);
