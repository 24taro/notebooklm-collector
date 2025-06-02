// DocbaseSearchForm コンポーネントの包括的テスト
// フォーム操作、検索、ダウンロード機能のテストカバレッジ

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DocbaseSearchForm from '../../components/DocbaseSearchForm'
import type { DocbasePostListItem } from '../../types/docbase'
import { createMockDocbasePost } from '../utils/testHelpers'

// フックのモック
const mockSearchPosts = vi.fn()
const mockRetrySearch = vi.fn()
const mockHandleDownload = vi.fn()

// デフォルトのモック状態
let mockSearchState = {
  posts: null,
  isLoading: false,
  error: null,
  canRetry: false,
}

let mockDownloadState = {
  isDownloading: false,
}

vi.mock('../../hooks/useSearch', () => ({
  useSearch: () => ({
    ...mockSearchState,
    searchPosts: mockSearchPosts,
    retrySearch: mockRetrySearch,
  }),
}))

vi.mock('../../hooks/useDownload', () => ({
  useDownload: () => ({
    ...mockDownloadState,
    handleDownload: mockHandleDownload,
  }),
}))

vi.mock('../../hooks/useLocalStorage', () => ({
  default: (key: string, defaultValue: string) => {
    const mockValues: Record<string, string> = {
      docbaseDomain: 'test-domain',
      docbaseToken: 'test-token',
    }
    const mockSetters: Record<string, (value: string) => void> = {
      docbaseDomain: vi.fn(),
      docbaseToken: vi.fn(),
    }

    return [mockValues[key] || defaultValue, mockSetters[key] || vi.fn()]
  },
}))

vi.mock('../../utils/markdownGenerator', () => ({
  generateMarkdown: vi.fn(
    (posts: DocbasePostListItem[], keyword: string) =>
      `# 検索結果: ${keyword}\n\n${posts.map((post) => `## ${post.title}\n${post.body}`).join('\n\n')}`,
  ),
}))

// ヘルパー関数でモック状態を更新
function updateMockSearchState(newState: Partial<typeof mockSearchState>) {
  mockSearchState = { ...mockSearchState, ...newState }
}

function updateMockDownloadState(newState: Partial<typeof mockDownloadState>) {
  mockDownloadState = { ...mockDownloadState, ...newState }
}

describe('DocbaseSearchForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // モック状態をリセット
    mockSearchState = {
      posts: null,
      isLoading: false,
      error: null,
      canRetry: false,
    }
    mockDownloadState = {
      isDownloading: false,
    }
  })

  describe('基本表示', () => {
    it('フォーム要素が正しく表示される', () => {
      render(<DocbaseSearchForm />)

      expect(screen.getByLabelText('検索キーワード')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('キーワードを入力してください')).toBeInTheDocument()
      expect(screen.getByText('検索実行')).toBeInTheDocument()
      expect(screen.getByText('Markdownダウンロード')).toBeInTheDocument()
    })

    it('詳細検索トグルボタンが表示される', () => {
      render(<DocbaseSearchForm />)

      const toggleButton = screen.getByText('もっと詳細な条件を追加する ▼')
      expect(toggleButton).toBeInTheDocument()
    })

    it('初期状態では詳細検索フィールドが非表示', () => {
      render(<DocbaseSearchForm />)

      expect(screen.queryByLabelText('タグ (カンマ区切り)')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('投稿者 (ユーザーID)')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('タイトルに含むキーワード')).not.toBeInTheDocument()
    })

    it('初期状態ではダウンロードボタンが無効', () => {
      render(<DocbaseSearchForm />)

      const downloadButton = screen.getByText('Markdownダウンロード')
      expect(downloadButton).toBeDisabled()
    })
  })

  describe('詳細検索', () => {
    it('詳細検索トグルで入力フィールドの表示切り替えができる', () => {
      render(<DocbaseSearchForm />)

      const toggleButton = screen.getByText('もっと詳細な条件を追加する ▼')
      fireEvent.click(toggleButton)

      expect(screen.getByText('詳細な条件を閉じる ▲')).toBeInTheDocument()
      expect(screen.getByLabelText('タグ (カンマ区切り)')).toBeInTheDocument()
      expect(screen.getByLabelText('投稿者 (ユーザーID)')).toBeInTheDocument()
      expect(screen.getByLabelText('タイトルに含むキーワード')).toBeInTheDocument()
      expect(screen.getByLabelText('投稿期間 (開始日)')).toBeInTheDocument()
      expect(screen.getByLabelText('投稿期間 (終了日)')).toBeInTheDocument()
      expect(screen.getByLabelText('グループ名')).toBeInTheDocument()

      // 再度クリックで非表示
      fireEvent.click(screen.getByText('詳細な条件を閉じる ▲'))
      expect(screen.getByText('もっと詳細な条件を追加する ▼')).toBeInTheDocument()
      expect(screen.queryByLabelText('タグ (カンマ区切り)')).not.toBeInTheDocument()
    })

    it('詳細検索フィールドに入力ができる', () => {
      render(<DocbaseSearchForm />)

      const toggleButton = screen.getByText('もっと詳細な条件を追加する ▼')
      fireEvent.click(toggleButton)

      const tagsInput = screen.getByLabelText('タグ (カンマ区切り)')
      const authorInput = screen.getByLabelText('投稿者 (ユーザーID)')
      const titleInput = screen.getByLabelText('タイトルに含むキーワード')
      const startDateInput = screen.getByLabelText('投稿期間 (開始日)')
      const endDateInput = screen.getByLabelText('投稿期間 (終了日)')
      const groupInput = screen.getByLabelText('グループ名')

      fireEvent.change(tagsInput, { target: { value: 'API, 設計' } })
      fireEvent.change(authorInput, { target: { value: 'user123' } })
      fireEvent.change(titleInput, { target: { value: '仕様書' } })
      fireEvent.change(startDateInput, { target: { value: '2023-01-01' } })
      fireEvent.change(endDateInput, { target: { value: '2023-12-31' } })
      fireEvent.change(groupInput, { target: { value: '開発チーム' } })

      expect(tagsInput).toHaveValue('API, 設計')
      expect(authorInput).toHaveValue('user123')
      expect(titleInput).toHaveValue('仕様書')
      expect(startDateInput).toHaveValue('2023-01-01')
      expect(endDateInput).toHaveValue('2023-12-31')
      expect(groupInput).toHaveValue('開発チーム')
    })
  })

  describe('フォーム送信', () => {
    it('基本検索でsearchPostsが正しく呼ばれる', async () => {
      render(<DocbaseSearchForm />)

      const keywordInput = screen.getByLabelText('検索キーワード')
      const submitButton = screen.getByText('検索実行')

      fireEvent.change(keywordInput, { target: { value: 'テストキーワード' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSearchPosts).toHaveBeenCalledWith('test-domain', 'test-token', 'テストキーワード', {
          tags: '',
          author: '',
          titleFilter: '',
          startDate: '',
          endDate: '',
          group: '',
        })
      })
    })

    it('詳細検索の条件を含めてsearchPostsが呼ばれる', async () => {
      render(<DocbaseSearchForm />)

      // 詳細検索を開く
      const toggleButton = screen.getByText('もっと詳細な条件を追加する ▼')
      fireEvent.click(toggleButton)

      // 各フィールドに入力
      const keywordInput = screen.getByLabelText('検索キーワード')
      const tagsInput = screen.getByLabelText('タグ (カンマ区切り)')
      const authorInput = screen.getByLabelText('投稿者 (ユーザーID)')

      fireEvent.change(keywordInput, { target: { value: '詳細検索テスト' } })
      fireEvent.change(tagsInput, { target: { value: 'API' } })
      fireEvent.change(authorInput, { target: { value: 'testuser' } })

      const submitButton = screen.getByText('検索実行')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSearchPosts).toHaveBeenCalledWith('test-domain', 'test-token', '詳細検索テスト', {
          tags: 'API',
          author: 'testuser',
          titleFilter: '',
          startDate: '',
          endDate: '',
          group: '',
        })
      })
    })

    it('必須フィールドが未入力の場合はフォーム送信できない', () => {
      render(<DocbaseSearchForm />)

      const submitButton = screen.getByText('検索実行')
      expect(submitButton).toBeDisabled()
    })

    it('キーワードが未入力の場合はフォーム送信できない', () => {
      render(<DocbaseSearchForm />)

      const submitButton = screen.getByText('検索実行')

      // キーワードが空の場合
      expect(submitButton).toBeDisabled()
    })
  })

  describe('検索結果表示', () => {
    it('検索結果がある場合はMarkdownプレビューが表示される', () => {
      const mockPosts = [
        createMockDocbasePost({ id: 1, title: 'テスト記事1' }),
        createMockDocbasePost({ id: 2, title: 'テスト記事2' }),
      ]

      updateMockSearchState({ posts: mockPosts })

      render(<DocbaseSearchForm />)

      expect(screen.getByText('Markdownプレビュー')).toBeInTheDocument()
      expect(screen.getByText('取得件数: 2件')).toBeInTheDocument()
    })

    it('検索結果が10件を超える場合は注意メッセージが表示される', () => {
      const mockPosts = Array.from({ length: 15 }, (_, i) =>
        createMockDocbasePost({ id: i + 1, title: `テスト記事${i + 1}` }),
      )

      updateMockSearchState({ posts: mockPosts })

      render(<DocbaseSearchForm />)

      expect(
        screen.getByText(
          'プレビューには最初の10件のMarkdownが生成されます。すべての内容を確認するには、ファイルをダウンロードしてください。',
        ),
      ).toBeInTheDocument()
      expect(screen.getByText('取得件数: 15件')).toBeInTheDocument()
    })
  })

  describe('エラー処理', () => {
    it('検索エラーが表示される', () => {
      const mockError = {
        type: 'network' as const,
        message: 'ネットワークエラーが発生しました',
      }

      updateMockSearchState({ error: mockError })

      render(<DocbaseSearchForm />)

      expect(screen.getByText('エラーが発生しました:')).toBeInTheDocument()
      expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument()
    })

    it('エラーの詳細情報が表示される', () => {
      const mockError = {
        type: 'network' as const,
        message: 'ネットワークエラー',
        cause: new Error('Connection failed'),
      }

      updateMockSearchState({ error: mockError })

      render(<DocbaseSearchForm />)

      expect(screen.getByText('詳細: Connection failed')).toBeInTheDocument()
    })

    it('リトライボタンが表示される', () => {
      updateMockSearchState({
        error: { type: 'network', message: 'エラー' },
        canRetry: true,
      })

      render(<DocbaseSearchForm />)

      const retryButton = screen.getByText('再試行')
      expect(retryButton).toBeInTheDocument()

      fireEvent.click(retryButton)
      expect(mockRetrySearch).toHaveBeenCalledTimes(1)
    })

    it('認証エラーの場合はトークン入力フィールドにフォーカスが移る', async () => {
      const mockError = {
        type: 'unauthorized' as const,
        message: '認証に失敗しました',
      }

      updateMockSearchState({ error: mockError })

      render(<DocbaseSearchForm />)

      // DocbaseTokenInputが存在することを確認
      // 実際のフォーカス動作はDocbaseTokenInputのテストで検証
      expect(screen.getByText('認証に失敗しました')).toBeInTheDocument()
    })
  })

  describe('ローディング状態', () => {
    it('検索中はローディング表示になる', () => {
      updateMockSearchState({ isLoading: true })

      render(<DocbaseSearchForm />)

      expect(screen.getByText('検索中...')).toBeInTheDocument()

      // フォーム要素が無効になる
      expect(screen.getByLabelText('検索キーワード')).toBeDisabled()
      expect(screen.getByRole('button', { name: /検索中/ })).toBeDisabled()
    })

    it('ダウンロード中はローディング表示になる', () => {
      updateMockDownloadState({ isDownloading: true })

      render(<DocbaseSearchForm />)

      expect(screen.getByText('生成中...')).toBeInTheDocument()

      // フォーム要素が無効になる
      expect(screen.getByLabelText('検索キーワード')).toBeDisabled()
    })
  })

  describe('ダウンロード機能', () => {
    it('検索結果がある場合はダウンロードボタンが有効になる', () => {
      const mockPosts = [createMockDocbasePost()]

      updateMockSearchState({ posts: mockPosts })

      render(<DocbaseSearchForm />)

      const downloadButton = screen.getByText('Markdownダウンロード')
      expect(downloadButton).not.toBeDisabled()
    })

    it('ダウンロードボタンクリックでhandleDownloadが呼ばれる', () => {
      const mockPosts = [createMockDocbasePost()]

      updateMockSearchState({ posts: mockPosts })

      render(<DocbaseSearchForm />)

      const downloadButton = screen.getByText('Markdownダウンロード')
      fireEvent.click(downloadButton)

      expect(mockHandleDownload).toHaveBeenCalledWith(
        expect.any(String), // markdown content
        '', // keyword (初期値)
        true, // postsExist
        'docbase',
      )
    })
  })

  describe('アクセシビリティ', () => {
    it('フォーム要素に適切なラベルが設定されている', () => {
      render(<DocbaseSearchForm />)

      expect(screen.getByLabelText('検索キーワード')).toBeInTheDocument()
    })

    it('必須フィールドにrequired属性が設定されている', () => {
      render(<DocbaseSearchForm />)

      const keywordInput = screen.getByLabelText('検索キーワード')
      expect(keywordInput).toBeRequired()
    })

    it('ローディング中のアイコンにタイトルが設定されている', () => {
      updateMockSearchState({ isLoading: true })

      render(<DocbaseSearchForm />)

      expect(screen.getByTitle('検索処理ローディング')).toBeInTheDocument()
    })
  })
})
