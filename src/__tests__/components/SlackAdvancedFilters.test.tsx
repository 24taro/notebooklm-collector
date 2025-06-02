// SlackAdvancedFilters コンポーネントの包括的テスト
// 表示切り替え、フォーム操作、プロパティ連携のテストカバレッジ

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SlackAdvancedFilters } from '../../components/SlackAdvancedFilters'

describe('SlackAdvancedFilters', () => {
  const defaultProps = {
    showAdvanced: false,
    onToggleAdvanced: vi.fn(),
    channel: '',
    onChannelChange: vi.fn(),
    author: '',
    onAuthorChange: vi.fn(),
    startDate: '',
    onStartDateChange: vi.fn(),
    endDate: '',
    onEndDateChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本表示', () => {
    it('折りたたまれた状態でトグルボタンが表示される', () => {
      render(<SlackAdvancedFilters {...defaultProps} />)

      expect(screen.getByText('もっと詳細な条件を追加する ▼')).toBeInTheDocument()
      expect(screen.queryByLabelText('チャンネル (例: #general)')).not.toBeInTheDocument()
    })

    it('展開された状態で詳細フィルターが表示される', () => {
      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} />)

      expect(screen.getByText('詳細な条件を閉じる ▲')).toBeInTheDocument()
      expect(screen.getByLabelText('チャンネル (例: #general)')).toBeInTheDocument()
      expect(screen.getByLabelText('投稿者 (例: @user)')).toBeInTheDocument()
      expect(screen.getByLabelText('投稿期間 (開始日)')).toBeInTheDocument()
      expect(screen.getByLabelText('投稿期間 (終了日)')).toBeInTheDocument()
    })
  })

  describe('トグル機能', () => {
    it('トグルボタンクリックでonToggleAdvancedが呼ばれる', () => {
      const onToggleAdvanced = vi.fn()

      render(<SlackAdvancedFilters {...defaultProps} onToggleAdvanced={onToggleAdvanced} />)

      const toggleButton = screen.getByText('もっと詳細な条件を追加する ▼')
      fireEvent.click(toggleButton)

      expect(onToggleAdvanced).toHaveBeenCalledTimes(1)
    })

    it('展開状態でトグルボタンクリックするとコールバックが呼ばれる', () => {
      const onToggleAdvanced = vi.fn()

      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} onToggleAdvanced={onToggleAdvanced} />)

      const toggleButton = screen.getByText('詳細な条件を閉じる ▲')
      fireEvent.click(toggleButton)

      expect(onToggleAdvanced).toHaveBeenCalledTimes(1)
    })
  })

  describe('フォーム入力', () => {
    it('チャンネル入力でonChannelChangeが呼ばれる', () => {
      const onChannelChange = vi.fn()

      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} onChannelChange={onChannelChange} />)

      const channelInput = screen.getByLabelText('チャンネル (例: #general)')
      fireEvent.change(channelInput, { target: { value: '#general' } })

      expect(onChannelChange).toHaveBeenCalledWith('#general')
    })

    it('投稿者入力でonAuthorChangeが呼ばれる', () => {
      const onAuthorChange = vi.fn()

      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} onAuthorChange={onAuthorChange} />)

      const authorInput = screen.getByLabelText('投稿者 (例: @user)')
      fireEvent.change(authorInput, { target: { value: '@testuser' } })

      expect(onAuthorChange).toHaveBeenCalledWith('@testuser')
    })

    it('開始日入力でonStartDateChangeが呼ばれる', () => {
      const onStartDateChange = vi.fn()

      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} onStartDateChange={onStartDateChange} />)

      const startDateInput = screen.getByLabelText('投稿期間 (開始日)')
      fireEvent.change(startDateInput, { target: { value: '2023-01-01' } })

      expect(onStartDateChange).toHaveBeenCalledWith('2023-01-01')
    })

    it('終了日入力でonEndDateChangeが呼ばれる', () => {
      const onEndDateChange = vi.fn()

      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} onEndDateChange={onEndDateChange} />)

      const endDateInput = screen.getByLabelText('投稿期間 (終了日)')
      fireEvent.change(endDateInput, { target: { value: '2023-12-31' } })

      expect(onEndDateChange).toHaveBeenCalledWith('2023-12-31')
    })
  })

  describe('初期値の表示', () => {
    it('各フィールドの初期値が正しく表示される', () => {
      const propsWithValues = {
        ...defaultProps,
        showAdvanced: true,
        channel: '#test-channel',
        author: '@testuser',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      }

      render(<SlackAdvancedFilters {...propsWithValues} />)

      expect(screen.getByDisplayValue('#test-channel')).toBeInTheDocument()
      expect(screen.getByDisplayValue('@testuser')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2023-01-01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2023-12-31')).toBeInTheDocument()
    })
  })

  describe('プレースホルダー', () => {
    it('各入力フィールドに適切なプレースホルダーが設定されている', () => {
      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} />)

      expect(screen.getByPlaceholderText('#general')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('@user')).toBeInTheDocument()
    })
  })

  describe('無効化状態', () => {
    it('disabled=trueの場合、すべての入力フィールドが無効化される', () => {
      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} disabled={true} />)

      expect(screen.getByLabelText('チャンネル (例: #general)')).toBeDisabled()
      expect(screen.getByLabelText('投稿者 (例: @user)')).toBeDisabled()
      expect(screen.getByLabelText('投稿期間 (開始日)')).toBeDisabled()
      expect(screen.getByLabelText('投稿期間 (終了日)')).toBeDisabled()
    })

    it('disabled=falseの場合、すべての入力フィールドが有効である', () => {
      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} disabled={false} />)

      expect(screen.getByLabelText('チャンネル (例: #general)')).not.toBeDisabled()
      expect(screen.getByLabelText('投稿者 (例: @user)')).not.toBeDisabled()
      expect(screen.getByLabelText('投稿期間 (開始日)')).not.toBeDisabled()
      expect(screen.getByLabelText('投稿期間 (終了日)')).not.toBeDisabled()
    })

    it('disabledのデフォルト値はfalseである', () => {
      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} />)

      expect(screen.getByLabelText('チャンネル (例: #general)')).not.toBeDisabled()
    })
  })

  describe('レスポンシブデザイン', () => {
    it('日付フィールドがグリッドレイアウトで配置される', () => {
      const { container } = render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} />)

      const dateGrid = container.querySelector('.grid-cols-1.sm\\:grid-cols-2')
      expect(dateGrid).toBeInTheDocument()
    })
  })

  describe('フィールドタイプ', () => {
    it('日付フィールドがdate型である', () => {
      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} />)

      const startDateInput = screen.getByLabelText('投稿期間 (開始日)')
      const endDateInput = screen.getByLabelText('投稿期間 (終了日)')

      expect(startDateInput).toHaveAttribute('type', 'date')
      expect(endDateInput).toHaveAttribute('type', 'date')
    })

    it('テキストフィールドがtext型である', () => {
      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} />)

      const channelInput = screen.getByLabelText('チャンネル (例: #general)')
      const authorInput = screen.getByLabelText('投稿者 (例: @user)')

      expect(channelInput).toHaveAttribute('type', 'text')
      expect(authorInput).toHaveAttribute('type', 'text')
    })
  })

  describe('アクセシビリティ', () => {
    it('全ての入力フィールドに適切なラベルが設定されている', () => {
      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} />)

      expect(screen.getByLabelText('チャンネル (例: #general)')).toBeInTheDocument()
      expect(screen.getByLabelText('投稿者 (例: @user)')).toBeInTheDocument()
      expect(screen.getByLabelText('投稿期間 (開始日)')).toBeInTheDocument()
      expect(screen.getByLabelText('投稿期間 (終了日)')).toBeInTheDocument()
    })

    it('フィールドIDとラベルが正しく関連付けられている', () => {
      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} />)

      const channelInput = screen.getByLabelText('チャンネル (例: #general)')
      const authorInput = screen.getByLabelText('投稿者 (例: @user)')
      const startDateInput = screen.getByLabelText('投稿期間 (開始日)')
      const endDateInput = screen.getByLabelText('投稿期間 (終了日)')

      expect(channelInput).toHaveAttribute('id', 'channel')
      expect(authorInput).toHaveAttribute('id', 'author')
      expect(startDateInput).toHaveAttribute('id', 'startDate')
      expect(endDateInput).toHaveAttribute('id', 'endDate')
    })

    it('トグルボタンがキーボードでアクセス可能', () => {
      render(<SlackAdvancedFilters {...defaultProps} />)

      const toggleButton = screen.getByText('もっと詳細な条件を追加する ▼')
      toggleButton.focus()

      expect(toggleButton).toHaveFocus()
    })

    it('入力フィールドがキーボードでアクセス可能', () => {
      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} />)

      const channelInput = screen.getByLabelText('チャンネル (例: #general)')
      channelInput.focus()

      expect(channelInput).toHaveFocus()
    })
  })

  describe('スタイリング', () => {
    it('トグルボタンに適切なスタイルクラスが適用されている', () => {
      render(<SlackAdvancedFilters {...defaultProps} />)

      const toggleButton = screen.getByText('もっと詳細な条件を追加する ▼')
      expect(toggleButton).toHaveClass('text-blue-600', 'hover:text-blue-800')
    })

    it('入力フィールドに適切なスタイルクラスが適用されている', () => {
      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} />)

      const channelInput = screen.getByLabelText('チャンネル (例: #general)')
      expect(channelInput).toHaveClass('block', 'w-full', 'px-3', 'py-2', 'border', 'border-gray-400', 'rounded-md')
    })

    it('展開されたフィルター領域に背景色が適用されている', () => {
      const { container } = render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} />)

      const filterContainer = container.querySelector('.bg-gray-50')
      expect(filterContainer).toBeInTheDocument()
    })
  })

  describe('複数フィールドの連携', () => {
    it('複数のフィールドに同時に入力できる', () => {
      const onChannelChange = vi.fn()
      const onAuthorChange = vi.fn()
      const onStartDateChange = vi.fn()
      const onEndDateChange = vi.fn()

      render(
        <SlackAdvancedFilters
          {...defaultProps}
          showAdvanced={true}
          onChannelChange={onChannelChange}
          onAuthorChange={onAuthorChange}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />,
      )

      const channelInput = screen.getByLabelText('チャンネル (例: #general)')
      const authorInput = screen.getByLabelText('投稿者 (例: @user)')
      const startDateInput = screen.getByLabelText('投稿期間 (開始日)')
      const endDateInput = screen.getByLabelText('投稿期間 (終了日)')

      fireEvent.change(channelInput, { target: { value: '#development' } })
      fireEvent.change(authorInput, { target: { value: '@developer' } })
      fireEvent.change(startDateInput, { target: { value: '2023-06-01' } })
      fireEvent.change(endDateInput, { target: { value: '2023-06-30' } })

      expect(onChannelChange).toHaveBeenCalledWith('#development')
      expect(onAuthorChange).toHaveBeenCalledWith('@developer')
      expect(onStartDateChange).toHaveBeenCalledWith('2023-06-01')
      expect(onEndDateChange).toHaveBeenCalledWith('2023-06-30')
    })
  })

  describe('エッジケース', () => {
    it('空文字を入力した場合もコールバックが呼ばれる', () => {
      const onChannelChange = vi.fn()

      render(
        <SlackAdvancedFilters
          {...defaultProps}
          showAdvanced={true}
          channel="#test"
          onChannelChange={onChannelChange}
        />,
      )

      const channelInput = screen.getByLabelText('チャンネル (例: #general)')
      fireEvent.change(channelInput, { target: { value: '' } })

      expect(onChannelChange).toHaveBeenCalledWith('')
    })

    it('特殊文字を含む入力でもコールバックが呼ばれる', () => {
      const onChannelChange = vi.fn()

      render(<SlackAdvancedFilters {...defaultProps} showAdvanced={true} onChannelChange={onChannelChange} />)

      const channelInput = screen.getByLabelText('チャンネル (例: #general)')
      fireEvent.change(channelInput, { target: { value: '#test-123_channel' } })

      expect(onChannelChange).toHaveBeenCalledWith('#test-123_channel')
    })
  })
})
