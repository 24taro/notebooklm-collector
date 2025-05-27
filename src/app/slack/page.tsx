'use client'

import { useEffect, useState } from 'react'
import type React from 'react'
import { Toaster } from 'react-hot-toast'
import Footer from '../../components/Footer'
import Header from '../../components/Header'
import { SlackHeroSection } from '../../components/SlackHeroSection'
import { SlackSearchForm } from '../../components/SlackSearchForm'
import { useDownload } from '../../hooks/useDownload'
// import { useSlackSearch } from '../../hooks/useSlackSearch' // TODO: Issue #39で統一フックに移行
import { generateSlackThreadsMarkdown } from '../../utils/slackMarkdownGenerator'

export default function SlackPage() {
  const [token, setToken] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [channel, setChannel] = useState<string>('')
  const [author, setAuthor] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  
  const { isDownloading, handleDownload } = useDownload()
  // TODO: Issue #39で統一エラーハンドリングフックに移行
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [slackThreads, setSlackThreads] = useState<any[]>([])
  const [userMaps, setUserMaps] = useState<Record<string, string>>({})
  const [permalinkMaps, setPermalinkMaps] = useState<Record<string, string>>({})
  const [threadMarkdowns, setThreadMarkdowns] = useState<string[]>([])
  const [currentPreviewMarkdown, setCurrentPreviewMarkdown] = useState<string>('')
  
  const handleSearch = () => {
    // TODO: Issue #39で実装
    console.log('Search function will be implemented in Issue #39')
  }

  // ローカルストレージからトークンを読み込み・保存するuseEffect
  useEffect(() => {
    const storedToken = localStorage.getItem('slackApiToken')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  useEffect(() => {
    if (token) {
      localStorage.setItem('slackApiToken', token)
    }
  }, [token])

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // TODO: Issue #39で統一フックによる検索実装
    handleSearch()
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
                error={error}
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
