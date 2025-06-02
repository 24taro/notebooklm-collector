'use client' // クライアントコンポーネントとしてマーク

import Link from 'next/link'
import Footer from '../components/Footer'
import Header from '../components/Header'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col text-gray-800 selection:bg-docbase-primary font-sans">
      <Header title="NotebookLM Collector" />
      <div className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">NotebookLM Collector</h1>
          <p className="text-xl text-gray-600">
            さまざまな情報ソースからデータを収集し、NotebookLMで活用できるMarkdownを生成します。
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
          <Link
            href="/docbase"
            className="block p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
          >
            <h2 className="text-3xl font-semibold mb-3 text-docbase-primary">Docbase連携</h2>
            <p className="text-gray-700 mb-2">Docbaseの記事を検索・収集し、Markdownを生成します。</p>
            <p className="text-sm text-gray-500">最大500件まで収集可能</p>
          </Link>
          <Link
            href="/slack"
            className="block p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
          >
            <h2 className="text-3xl font-semibold mb-3 text-indigo-600">Slack連携</h2>
            <p className="text-gray-700 mb-2">Slackのスレッドを検索・収集し、NotebookLM用Markdownを生成します。</p>
            <p className="text-sm text-gray-500">最大300件まで収集可能</p>
          </Link>
        </div>
        {/* セキュリティ説明セクション */}
        <div className="w-full max-w-4xl">
          <div className="px-6 py-8 rounded-xl border border-gray-200 bg-gray-50">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">🔒 セキュリティについて</h2>
            <p className="text-gray-600 text-center leading-relaxed">
              入力されたAPIトークンや取得されたデータは、お使いのブラウザ内でのみ処理されます。
              <br />
              外部サーバーへの送信や保存は一切行われませんので、安心してご利用いただけます。
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
