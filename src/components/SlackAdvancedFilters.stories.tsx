import { action } from '@storybook/addon-actions'
import type { Meta, StoryObj } from '@storybook/react'
import { SlackAdvancedFilters } from './SlackAdvancedFilters'

const meta: Meta<typeof SlackAdvancedFilters> = {
  title: 'Components/SlackAdvancedFilters',
  component: SlackAdvancedFilters,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Slack検索の詳細フィルター条件コンポーネント。チャンネル、投稿者、期間の詳細条件設定機能を提供します。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showAdvanced: {
      control: 'boolean',
      description: '詳細フィルターの表示状態',
    },
    onToggleAdvanced: {
      action: 'toggle-advanced',
      description: '詳細フィルターの展開・折りたたみハンドラー',
    },
    channel: {
      control: 'text',
      description: 'チャンネル名（#で始まる）',
    },
    onChannelChange: {
      action: 'channel-changed',
      description: 'チャンネル変更時のハンドラー',
    },
    author: {
      control: 'text',
      description: '投稿者名（@で始まる）',
    },
    onAuthorChange: {
      action: 'author-changed',
      description: '投稿者変更時のハンドラー',
    },
    startDate: {
      control: 'date',
      description: '検索開始日（YYYY-MM-DD形式）',
    },
    onStartDateChange: {
      action: 'start-date-changed',
      description: '開始日変更時のハンドラー',
    },
    endDate: {
      control: 'date',
      description: '検索終了日（YYYY-MM-DD形式）',
    },
    onEndDateChange: {
      action: 'end-date-changed',
      description: '終了日変更時のハンドラー',
    },
    disabled: {
      control: 'boolean',
      description: 'フィルター入力の無効化状態',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 基本的な使用例（閉じた状態）
export const Default: Story = {
  args: {
    showAdvanced: false,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '',
    onChannelChange: action('channel-changed'),
    author: '',
    onAuthorChange: action('author-changed'),
    startDate: '',
    onStartDateChange: action('start-date-changed'),
    endDate: '',
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}

// 展開された状態
export const Expanded: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '',
    onChannelChange: action('channel-changed'),
    author: '',
    onAuthorChange: action('author-changed'),
    startDate: '',
    onStartDateChange: action('start-date-changed'),
    endDate: '',
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}

// 値が入力済みの状態
export const WithValues: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '#general',
    onChannelChange: action('channel-changed'),
    author: '@john.doe',
    onAuthorChange: action('author-changed'),
    startDate: '2023-01-01',
    onStartDateChange: action('start-date-changed'),
    endDate: '2023-12-31',
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}

// 開発チーム用のフィルター例
export const DevelopmentTeamFilter: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '#dev-team',
    onChannelChange: action('channel-changed'),
    author: '@tech.lead',
    onAuthorChange: action('author-changed'),
    startDate: '2023-11-01',
    onStartDateChange: action('start-date-changed'),
    endDate: '2023-11-30',
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}

// プロジェクト管理用のフィルター例
export const ProjectManagementFilter: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '#project-updates',
    onChannelChange: action('channel-changed'),
    author: '@project.manager',
    onAuthorChange: action('author-changed'),
    startDate: '2023-10-01',
    onStartDateChange: action('start-date-changed'),
    endDate: '2023-10-31',
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}

// 無効化状態（ローディング中など）
export const Disabled: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '#general',
    onChannelChange: action('channel-changed'),
    author: '@user',
    onAuthorChange: action('author-changed'),
    startDate: '2023-01-01',
    onStartDateChange: action('start-date-changed'),
    endDate: '2023-12-31',
    onEndDateChange: action('end-date-changed'),
    disabled: true,
  },
}

// チャンネルのみ指定
export const ChannelOnly: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '#random',
    onChannelChange: action('channel-changed'),
    author: '',
    onAuthorChange: action('author-changed'),
    startDate: '',
    onStartDateChange: action('start-date-changed'),
    endDate: '',
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}

// 投稿者のみ指定
export const AuthorOnly: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '',
    onChannelChange: action('channel-changed'),
    author: '@designer',
    onAuthorChange: action('author-changed'),
    startDate: '',
    onStartDateChange: action('start-date-changed'),
    endDate: '',
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}

// 期間のみ指定
export const DateRangeOnly: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '',
    onChannelChange: action('channel-changed'),
    author: '',
    onAuthorChange: action('author-changed'),
    startDate: '2023-06-01',
    onStartDateChange: action('start-date-changed'),
    endDate: '2023-06-30',
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}

// 週単位の期間設定例
export const WeeklyRange: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '#weekly-standup',
    onChannelChange: action('channel-changed'),
    author: '',
    onAuthorChange: action('author-changed'),
    startDate: '2023-11-13', // 月曜日
    onStartDateChange: action('start-date-changed'),
    endDate: '2023-11-19', // 日曜日
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}

// 当日のみの期間設定例
export const SingleDay: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '#urgent',
    onChannelChange: action('channel-changed'),
    author: '',
    onAuthorChange: action('author-changed'),
    startDate: '2023-11-15',
    onStartDateChange: action('start-date-changed'),
    endDate: '2023-11-15',
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}

// 複雑なチャンネル名の例
export const ComplexChannelNames: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '#engineering-team-backend',
    onChannelChange: action('channel-changed'),
    author: '@senior.engineer',
    onAuthorChange: action('author-changed'),
    startDate: '2023-11-01',
    onStartDateChange: action('start-date-changed'),
    endDate: '2023-11-30',
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}

// エラー状態のシミュレーション（無効な日付範囲）
export const InvalidDateRange: Story = {
  args: {
    showAdvanced: true,
    onToggleAdvanced: action('toggle-advanced'),
    channel: '#test',
    onChannelChange: action('channel-changed'),
    author: '@tester',
    onAuthorChange: action('author-changed'),
    startDate: '2023-12-31', // 終了日より後
    onStartDateChange: action('start-date-changed'),
    endDate: '2023-01-01', // 開始日より前
    onEndDateChange: action('end-date-changed'),
    disabled: false,
  },
}
