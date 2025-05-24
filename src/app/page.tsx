'use client' // クライアントコンポーネントとしてマーク

import Link from 'next/link'
import DocbaseHeader from '../components/DocbaseHeader'
import DocbaseFooter from '../components/DocbaseFooter'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col text-gray-800 selection:bg-docbase-primary font-sans">
      <DocbaseHeader />
      <div className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">NotebookLM Collector</h1>
          <p className="text-xl text-gray-600">
            さまざまな情報ソースからデータを収集し、NotebookLMで活用できるMarkdownを生成します。
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          <Link
            href="/docbase"
            className="block p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
          >
            <h2 className="text-3xl font-semibold mb-3 text-docbase-primary">Docbase連携</h2>
            <p className="text-gray-700">Docbaseの記事を検索・収集し、Markdownを生成します。</p>
          </Link>
          <Link
            href="/slack"
            className="block p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
          >
            <h2 className="text-3xl font-semibold mb-3 text-indigo-600">Slack連携 (準備中)</h2>
            <p className="text-gray-700">Slackのメッセージを収集し、Markdownを生成します。</p>
          </Link>
        </div>
      </div>
      <DocbaseFooter />
    </main>
  )
}
