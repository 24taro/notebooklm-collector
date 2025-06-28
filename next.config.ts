import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages 用に静的書き出し
  output: "export", // Next.js 13.3 以降での静的エクスポート指定
  trailingSlash: true, // URLの末尾にスラッシュを強制し、404エラーを防ぐ

  // 画像最適化サーバーを使わない場合（静的エクスポート時は true を推奨）
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
