'use client'

import type { SlackThread } from '@/types/slack'
import { useEffect, useState } from 'react'
import type React from 'react'
import { Toaster } from 'react-hot-toast'
import Footer from '../../components/Footer'
import Header from '../../components/Header'
import { SlackHeroSection } from '../../components/SlackHeroSection'
import { SlackSearchForm } from '../../components/SlackSearchForm'
import { useDownload } from '../../hooks/useDownload'
import useLocalStorage from '../../hooks/useLocalStorage'
import { useSlackSearchUnified } from '../../hooks/useSlackSearchUnified'
import { generateSlackThreadsMarkdown } from '../../utils/slackMarkdownGenerator'

export default function SlackPage() {
  const [token, setToken] = useLocalStorage<string>('slackApiToken', '')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [channel, setChannel] = useState<string>('')
  const [author, setAuthor] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  const { isDownloading, handleDownload } = useDownload()

  // 統一Slack検索フック
  const {
    isLoading,
    progressStatus,
    hasSearched,
    error,
    slackThreads,
    userMaps,
    permalinkMaps,
    threadMarkdowns,
    currentPreviewMarkdown,
    handleSearch: searchSlack,
  } = useSlackSearchUnified()

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    searchSlack({
      token,
      searchQuery,
      channel,
      author,
      startDate,
      endDate,
    })
  }

  const handlePreviewDownload = (markdownContent: string, searchQuery: string, hasContent: boolean) => {
    if (hasContent && currentPreviewMarkdown) {
      handleDownload(currentPreviewMarkdown, searchQuery, hasContent, 'slack')
    } else {
      handleDownload(markdownContent, searchQuery, hasContent, 'slack')
    }
  }

  const handleFullDownload = (markdownContent: string, searchQuery: string, hasContent: boolean) => {
    if (hasContent && threadMarkdowns.length > 0) {
      // TODO: Issue #39で統一フックによるMarkdown生成実装
      // const fullMarkdown = generateSlackThreadsMarkdown(slackThreads, userMaps, permalinkMaps, searchQuery)
      handleDownload(markdownContent, searchQuery, hasContent, 'slack')
    } else {
      handleDownload(markdownContent, searchQuery, hasContent, 'slack')
    }
  }

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

        <div className="flex justify-center bg-blue-500 w-full py-10">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => document.getElementById('main-tool-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"
            >
              今すぐMarkdownを生成
            </button>
            <p className="text-white text-sm mt-2">
              取得したSlackの情報はブラウザ内でのみ利用されます。サーバーには保存、送信されません。
            </p>
          </div>
        </div>

        {/* メイン機能セクション */}
        <section id="main-tool-section" className="w-full my-12 bg-white">
          <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 shadow-md rounded-lg border border-gray-200">
            <div className="px-0">
              <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">Slack メッセージ検索・収集</h2>
              <SlackSearchForm
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                token={token}
                onTokenChange={setToken}
                showAdvanced={showAdvanced}
                onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
                channel={channel}
                onChannelChange={setChannel}
                author={author}
                onAuthorChange={setAuthor}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                isLoading={isLoading}
                isDownloading={isDownloading}
                progressStatus={progressStatus}
                hasSearched={hasSearched}
                error={error?.message || null}
                slackThreads={slackThreads}
                userMaps={userMaps}
                permalinkMaps={permalinkMaps}
                onSubmit={handleFormSubmit}
                onDownload={handlePreviewDownload}
                onFullDownload={handleFullDownload}
              />
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
