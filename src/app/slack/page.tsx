'use client'

import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function SlackPage() {
  return (
    <main className="flex min-h-screen flex-col text-gray-800 selection:bg-docbase-primary font-sans">
      <Header title="NotebookLM Collector - Slack" />
      <div className="flex-grow flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Slack連携機能</h1>
        <p className="text-lg">現在準備中です。お楽しみに！</p>
      </div>
      <Footer />
    </main>
  )
}
