'use client'

import type { FC } from 'react'
import { useState, useMemo } from 'react'
import type { DocbasePostListItem } from '../types/docbase'

interface DocbaseMarkdownPreviewProps {
  posts: DocbasePostListItem[]
  searchKeyword?: string
}

// 検索キーワードをハイライトするヘルパー関数
const highlightKeywords = (text: string, keyword?: string): string => {
  if (!keyword || !text) return text
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
}

// 記事カードコンポーネント
const ArticleCard: FC<{
  article: DocbasePostListItem
  index: number
  searchKeyword?: string
  isExpanded: boolean
  onToggleExpansion: () => void
}> = ({ article, index, searchKeyword, isExpanded, onToggleExpansion }) => {
  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 相対日付表示
  const getRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今日'
    if (diffDays === 1) return '昨日'
    if (diffDays < 7) return `${diffDays}日前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`
    return `${Math.floor(diffDays / 365)}年前`
  }

  // 本文のプレビュー（200文字）
  const previewText = article.body.length > 200 
    ? `${article.body.substring(0, 200)}...` 
    : article.body

  // 作成者のイニシャル（仮）
  const authorInitial = 'A'

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-all duration-200">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm text-gray-500 font-medium">記事 #{index + 1}</span>
        <a 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 text-sm hover:underline flex items-center gap-1"
        >
          📄 Docbaseで開く
        </a>
      </div>

      {/* タイトル */}
      <h3 
        className="text-xl font-bold text-gray-800 mb-4 line-clamp-2 leading-tight"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: 検索キーワードハイライト機能のため必要
        dangerouslySetInnerHTML={{ 
          __html: highlightKeywords(article.title, searchKeyword) 
        }}
      />

      {/* 作成者情報 */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          {authorInitial}
        </div>
        <div>
          <span className="font-medium text-gray-700">投稿者</span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <time>{formatDate(article.created_at)}</time>
            <span>•</span>
            <span>{getRelativeDate(article.created_at)}</span>
          </div>
        </div>
      </div>

      {/* 記事本文 */}
      <div className="mb-4">
        {isExpanded ? (
          <div 
            className="prose prose-sm max-w-none text-gray-600"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: 検索キーワードハイライト機能のため必要
            dangerouslySetInnerHTML={{ 
              __html: highlightKeywords(article.body, searchKeyword) 
            }}
          />
        ) : (
          <p 
            className="text-gray-600 text-sm leading-relaxed"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: 検索キーワードハイライト機能のため必要
            dangerouslySetInnerHTML={{ 
              __html: highlightKeywords(previewText, searchKeyword) 
            }}
          />
        )}
      </div>

      {/* 展開/折りたたみボタン */}
      {article.body.length > 200 && (
        <button
          type="button"
          onClick={onToggleExpansion}
          className="text-blue-600 text-sm hover:underline font-medium"
        >
          {isExpanded ? '折りたたむ' : '続きを読む'}
        </button>
      )}
    </div>
  )
}

/**
 * Docbase記事のカード形式プレビューコンポーネント
 */
export const MarkdownPreview: FC<DocbaseMarkdownPreviewProps> = ({ 
  posts, 
  searchKeyword 
}) => {
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set())
  const [sortBy, setSortBy] = useState<string>('relevance')

  // 記事の展開/折りたたみを切り替え
  const toggleExpansion = (articleId: number) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(articleId)) {
        newSet.delete(articleId)
      } else {
        newSet.add(articleId)
      }
      return newSet
    })
  }

  // ソート処理
  const sortedPosts = useMemo(() => {
    const sorted = [...posts]
    switch (sortBy) {
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      default:
        return sorted
    }
  }, [posts, sortBy])

  // 統計情報の計算
  const stats = useMemo(() => {
    if (posts.length === 0) return null

    const dates = posts.map(post => new Date(post.created_at))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    
    return {
      totalArticles: posts.length,
      dateRange: minDate.toLocaleDateString('ja-JP') === maxDate.toLocaleDateString('ja-JP') 
        ? minDate.toLocaleDateString('ja-JP')
        : `${minDate.toLocaleDateString('ja-JP')} - ${maxDate.toLocaleDateString('ja-JP')}`
    }
  }, [posts])

  if (!posts || posts.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow border border-gray-200 min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500">ここにDocbase記事プレビューが表示されます。</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 統計情報パネル */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">検索結果サマリー</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalArticles}</div>
              <div className="text-sm text-gray-600">総記事数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{stats.dateRange}</div>
              <div className="text-sm text-gray-600">期間</div>
            </div>
            {searchKeyword && (
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">「{searchKeyword}」</div>
                <div className="text-sm text-gray-600">検索キーワード</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ソート機能 */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">記事一覧</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="relevance">関連度順</option>
          <option value="date_desc">新しい順</option>
          <option value="date_asc">古い順</option>
          <option value="title">タイトル順</option>
        </select>
      </div>

      {/* 記事カード一覧 */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {sortedPosts.map((article, index) => (
          <ArticleCard
            key={article.id}
            article={article}
            index={index}
            searchKeyword={searchKeyword}
            isExpanded={expandedArticles.has(article.id)}
            onToggleExpansion={() => toggleExpansion(article.id)}
          />
        ))}
      </div>

      {/* フッター情報 */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t">
        <p>全 {posts.length} 件の記事を表示中</p>
      </div>
    </div>
  )
}
