import type { NextConfig } from "next";

// NEXT_PUBLIC_BASE_PATH は .env.production や GitHub Actions の env で設定される
// GitHub Pages のリポジトリ名（サブパス）が入ることを想定 (例: "/my-app")
// 値が取得できない場合は空文字とし、ローカル開発時はサブパスなしで動作するようにする
const repoSubPath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // ① GitHub Pages 用に静的書き出し
  output: "export", // Next.js 13.3 以降での静的エクスポート指定
  trailingSlash: true, // URLの末尾にスラッシュを強制し、404エラーを防ぐ

  // ② サブパス設定（ビルド時に決定）
  // isProd の判定は、ローカル開発時 (npm run dev) にサブパスが適用されないようにするため
  basePath: isProd ? repoSubPath : "",
  assetPrefix: isProd ? `${repoSubPath}/` : "", // assetPrefix は末尾にスラッシュが必要な場合があるため注意

  // 画像最適化サーバーを使わない場合（静的エクスポート時は true を推奨）
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
