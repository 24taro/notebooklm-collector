import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ErrorBoundaryProvider } from "@/components/ErrorBoundaryProvider";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NotebookLM Collector",
  description:
    "Docbase、Slack、Qiitaからデータを収集し、NotebookLM用Markdownを生成するツール",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <ErrorBoundaryProvider>
          <main className="flex-grow">{children}</main>
        </ErrorBoundaryProvider>
      </body>
    </html>
  );
}
