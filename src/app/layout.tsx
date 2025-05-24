import type { Metadata } from 'next'
import { Noto_Sans_JP, Geist_Mono } from 'next/font/google'
import './globals.css'
// import Header from '@/components/Header'
// import Footer from '@/components/Footer'

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'NotebookLM Collector',
  description: 'Collect DocBase articles for NotebookLM',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        {/* <Header /> */}
        <main className="flex-grow">{children}</main>
        {/* <Footer /> */}
      </body>
    </html>
  )
}
