import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'docbase-primary': '#3A89C9', // DocBaseの主要な青 (推測)
        'docbase-primary-dark': '#2c6b9a', // 少し濃い青 (ホバー用など)
        'docbase-text': '#333333', // 基本テキストカラー
        'docbase-text-sub': '#6c757d', // サブテキストカラー
        'docbase-bg': '#FFFFFF', // メイン背景
        'docbase-bg-alt': '#F8F9FA', // 代替背景 (セクションなど)
        'docbase-accent-green': '#28a745', // 緑のアクセント (資料請求ボタンなど)
        'docbase-accent-orange': '#fd7e14', // オレンジのアクセント
        // 必要に応じて他の色も追加するのだ
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-jp)', 'sans-serif'], // Noto Sans JP をデフォルトのsans-serifに設定
        mono: ['var(--font-geist-mono)', 'monospace'], // Geist Mono も念のため設定
      },
    },
  },
  plugins: [],
}
export default config 