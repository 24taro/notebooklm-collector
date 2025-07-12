import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        docbase: {
          primary: "#5692ce", // 落ち着いたブルーグレー
          "primary-dark": "#4a7fb3",
          text: "#1F2937",
          "text-sub": "#6B7280",
        },
        qiita: {
          primary: "#55C500", // Qiita ブランドグリーン
          "primary-dark": "#4CAF50",
          "primary-light": "#66BB6A",
          text: "#1F2937",
          "text-sub": "#6B7280",
        },
        slack: {
          primary: "#4A154B", // Slack公式紫
          "primary-dark": "#350d36",
          "primary-light": "#611f69",
          text: "#1F2937",
          "text-sub": "#6B7280",
        },
      },
      lineClamp: {
        2: "2",
      },
    },
  },
  plugins: [
    require("@tailwindcss/line-clamp"),
  ],
} satisfies Config;