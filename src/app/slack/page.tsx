'use client'

import { Toaster } from 'react-hot-toast'
import Footer from '../../components/Footer'
import Header from '../../components/Header'
import { SlackHeroSection } from '../../components/SlackHeroSection'
import { SlackSearchForm } from '../../components/SlackSearchForm'
import { useSlackForm } from '../../hooks/useSlackForm'

export default function SlackPage() {
  const slackForm = useSlackForm()

  return (
    <main className="flex min-h-screen flex-col text-gray-800 selection:bg-blue-100 font-sans">
      <Header title="NotebookLM Collector - Slack" />
      <Toaster
        position="top-center"
        toastOptions={{
          className: '!border !border-gray-200 !bg-white !text-gray-700 !shadow-lg !rounded-md',
          success: {
            iconTheme: {
              primary: '#36C5F0', // Slackブルー
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <div className="relative z-10 flex flex-col items-center w-full">
        <SlackHeroSection />

        {/* メイン機能セクション */}
        <section id="main-tool-section" className="w-full my-12 bg-white">
          <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 shadow-md rounded-lg border border-gray-200">
            <div className="px-0">
              <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">Slack メッセージ検索・収集</h2>
              <SlackSearchForm {...slackForm} />
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
