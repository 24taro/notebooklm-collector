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
        slack: {
          primary: "#4A154B", // Slack purple
          "primary-dark": "#350d36",
          text: "#1F2937",
          "text-sub": "#6B7280",
        },
        zenn: {
          primary: "#3EA8FF", // Zenn blue
          "primary-dark": "#2B7CE6",
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