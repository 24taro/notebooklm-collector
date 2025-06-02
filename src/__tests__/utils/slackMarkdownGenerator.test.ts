import { describe, expect, it, vi } from 'vitest'
import type { SlackThread } from '../../types/slack'
import { generateSlackThreadsMarkdown } from '../../utils/slackMarkdownGenerator'

// slackdownモジュールのモック
vi.mock('../../lib/slackdown', () => ({
  convertToSlackThreadMarkdown: vi.fn((thread, userMap, permalinkMap) => {
    const parentUser = userMap[thread.parent.user] || thread.parent.user
    const parentDate = new Date(Number.parseFloat(thread.parent.ts) * 1000).toLocaleString('ja-JP')

    let markdown = `#### 👤 ${parentUser} - ${parentDate}\n`
    markdown += `> ${thread.parent.text}\n\n`

    if (thread.replies && thread.replies.length > 0) {
      thread.replies.forEach((reply: SlackMessage, index: number) => {
        const replyUser = userMap[reply.user] || reply.user
        const replyDate = new Date(Number.parseFloat(reply.ts) * 1000).toLocaleString('ja-JP')
        markdown += `##### 💬 返信 ${index + 1}: ${replyUser} - ${replyDate}\n`
        markdown += `${reply.text}\n\n`
      })
    }

    return markdown
  }),
}))

describe('slackMarkdownGenerator', () => {
  const mockThreads: SlackThread[] = [
    {
      channel: 'C123456',
      parent: {
        ts: '1672531200.123456', // 2023-01-01 00:00:00 UTC
        user: 'U123456',
        text: '新年の目標について話し合いましょう',
        channel: { id: 'C123456' },
      },
      replies: [
        {
          ts: '1672531260.123457', // 2023-01-01 00:01:00 UTC
          user: 'U789012',
          text: '私は英語の勉強を頑張りたいです',
          thread_ts: '1672531200.123456',
          channel: { id: 'C123456' },
        },
        {
          ts: '1672531320.123458', // 2023-01-01 00:02:00 UTC
          user: 'U345678',
          text: 'プログラミングスキルを向上させたいと思います',
          thread_ts: '1672531200.123456',
          channel: { id: 'C123456' },
        },
      ],
    },
    {
      channel: 'C123456',
      parent: {
        ts: '1672617600.123459', // 2023-01-02 00:00:00 UTC
        user: 'U789012',
        text: '昨日の会議の議事録です',
        channel: { id: 'C123456' },
      },
      replies: [
        {
          ts: '1672617660.123460', // 2023-01-02 00:01:00 UTC
          user: 'U123456',
          text: 'ありがとうございます！',
          thread_ts: '1672617600.123459',
          channel: { id: 'C123456' },
        },
      ],
    },
  ]

  const mockUserMap: Record<string, string> = {
    U123456: '田中太郎',
    U789012: '佐藤花子',
    U345678: '山田次郎',
  }

  const mockPermalinkMap: Record<string, string> = {
    '1672531200.123456': 'https://slack.com/archives/C123456/p1672531200123456',
    '1672531260.123457': 'https://slack.com/archives/C123456/p1672531260123457',
    '1672531320.123458': 'https://slack.com/archives/C123456/p1672531320123458',
    '1672617600.123459': 'https://slack.com/archives/C123456/p1672617600123459',
    '1672617660.123460': 'https://slack.com/archives/C123456/p1672617660123460',
  }

  describe('基本機能', () => {
    it('空の配列の場合は空文字列を返す', () => {
      const result = generateSlackThreadsMarkdown([], {}, {})
      expect(result).toBe('')
    })

    it('nullまたはundefinedの場合は空文字列を返す', () => {
      expect(generateSlackThreadsMarkdown(null as unknown as SlackThread[], {}, {})).toBe('')
      expect(generateSlackThreadsMarkdown(undefined as unknown as SlackThread[], {}, {})).toBe('')
    })

    it('スレッドリストから正しいMarkdownを生成する', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap, 'テストキーワード')

      // YAML Front Matterの確認
      expect(result).toContain('---')
      expect(result).toContain('source: "slack"')
      expect(result).toContain('total_threads: 2')
      expect(result).toContain('total_messages: 5') // 親2 + 返信3
      expect(result).toContain('search_keyword: "テストキーワード"')
      expect(result).toContain('channels: ["C123456"]')
      expect(result).toContain('date_range: "2023-01-01 - 2023-01-02"')
      expect(result).toContain('generated_at:')

      // メインタイトルの確認
      expect(result).toContain('# Slack Threads Collection')

      // 概要セクションの確認
      expect(result).toContain('## Collection Overview')
      expect(result).toContain('- **Total Threads**: 2')
      expect(result).toContain('- **Total Messages**: 5')
      expect(result).toContain('- **Search Keyword**: "テストキーワード"')
      expect(result).toContain('- **Channels**: C123456')
      expect(result).toContain('- **Participants**: 3 unique users')
      expect(result).toContain('- **Source**: Slack Workspace')

      // 目次の確認
      expect(result).toContain('## Threads Index')
      expect(result).toContain('[Thread 1](#thread-1)')
      expect(result).toContain('[Thread 2](#thread-2)')

      // スレッド内容の確認
      expect(result).toContain('## Threads Content')
      expect(result).toContain('### Thread 1 {#thread-1}')
      expect(result).toContain('### Thread 2 {#thread-2}')
    })

    it('検索キーワードなしでもMarkdownを生成する', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap)

      // 検索キーワードが含まれないことを確認
      expect(result).not.toContain('search_keyword:')
      expect(result).not.toContain('- **Search Keyword**:')

      // その他の基本要素は含まれることを確認
      expect(result).toContain('# Slack Threads Collection')
      expect(result).toContain('total_threads: 2')
    })
  })

  describe('メタデータ処理', () => {
    it('複数チャンネルを正しく処理する', () => {
      const multiChannelThreads = [
        { ...mockThreads[0], channel: 'C123456' },
        { ...mockThreads[1], channel: 'C789012' },
      ]

      const result = generateSlackThreadsMarkdown(multiChannelThreads, mockUserMap, mockPermalinkMap)

      expect(result).toContain('channels: ["C123456", "C789012"]')
      expect(result).toContain('- **Channels**: C123456, C789012')
    })

    it('参加者が10人以下の場合は全員リストアップする', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap)

      expect(result).toContain('participants: ["田中太郎", "佐藤花子", "山田次郎"]')
      expect(result).not.toContain('total_participants:')
    })

    it('参加者が10人を超える場合は制限する', () => {
      const largeUserMap: Record<string, string> = {}
      const threadsWithManyUsers: SlackThread[] = []

      // 15人のユーザーを作成
      for (let i = 0; i < 15; i++) {
        largeUserMap[`U${i.toString().padStart(6, '0')}`] = `ユーザー${i}`
      }

      // 各ユーザーからのメッセージを含むスレッドを作成
      const thread: SlackThread = {
        channel: 'C123456',
        parent: {
          ts: '1672531200.123456',
          user: 'U000000',
          text: 'テストメッセージ',
          channel: { id: 'C123456' },
        },
        replies: Array.from({ length: 14 }, (_, i) => ({
          ts: `1672531${(260 + i * 10).toString()}.123456`,
          user: `U${(i + 1).toString().padStart(6, '0')}`,
          text: `返信${i + 1}`,
          thread_ts: '1672531200.123456',
          channel: { id: 'C123456' },
        })),
      }

      threadsWithManyUsers.push(thread)

      const result = generateSlackThreadsMarkdown(threadsWithManyUsers, largeUserMap, mockPermalinkMap)

      expect(result).toContain('total_participants: 15')
      // 最初の10人のみがリストアップされることを確認
      const participantsMatch = result.match(/participants: \[(.*?)\]/)
      if (participantsMatch) {
        const participantsList = participantsMatch[1].split(', ')
        expect(participantsList).toHaveLength(10)
      }
    })

    it('日付範囲を正しく計算する', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap)

      expect(result).toContain('date_range: "2023-01-01 - 2023-01-02"')
      expect(result).toMatch(/- \*\*Date Range\*\*: 2023\/1\/1 - 2023\/1\/2/)
    })

    it('同じ日付のスレッドのみの場合、日付範囲が単一日付になる', () => {
      const sameDayThreads = [mockThreads[0]] // 2023-01-01のスレッドのみ

      const result = generateSlackThreadsMarkdown(sameDayThreads, mockUserMap, mockPermalinkMap)

      expect(result).toContain('date_range: "2023-01-01 - 2023-01-01"')
      expect(result).toMatch(/- \*\*Date Range\*\*: 2023\/1\/1/)
    })
  })

  describe('目次生成', () => {
    it('スレッド目次が正しく生成される', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap)

      expect(result).toContain('## Threads Index')
      expect(result).toContain('1. [Thread 1](#thread-1) - 田中太郎 in C123456 (2023/1/1)')
      expect(result).toContain('"新年の目標について話し合いましょう"')
      expect(result).toContain('2. [Thread 2](#thread-2) - 佐藤花子 in C123456 (2023/1/2)')
      expect(result).toContain('"昨日の会議の議事録です"')
    })

    it('長いテキストが省略される', () => {
      const longTextThread: SlackThread = {
        channel: 'C123456',
        parent: {
          ts: '1672531200.123456',
          user: 'U123456',
          text: 'これは非常に長いテキストメッセージです。50文字を超える場合は省略されるはずです。確認用の追加テキスト。',
          channel: { id: 'C123456' },
        },
        replies: [],
      }

      const result = generateSlackThreadsMarkdown([longTextThread], mockUserMap, mockPermalinkMap)

      expect(result).toContain(
        '"これは非常に長いテキストメッセージです。50文字を超える場合は省略されるはずです。確認用の追加テキス..."',
      )
    })

    it('50文字以下のテキストは省略されない', () => {
      const shortTextThread: SlackThread = {
        channel: 'C123456',
        parent: {
          ts: '1672531200.123456',
          user: 'U123456',
          text: '短いメッセージ',
          channel: { id: 'C123456' },
        },
        replies: [],
      }

      const result = generateSlackThreadsMarkdown([shortTextThread], mockUserMap, mockPermalinkMap)

      expect(result).toContain('"短いメッセージ"')
      expect(result).not.toContain('...')
    })
  })

  describe('スレッド内容生成', () => {
    it('スレッド内容が正しく生成される', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap)

      // 両方のスレッドの内容が含まれることを確認
      expect(result).toContain('田中太郎 - 2023/1/1')
      expect(result).toContain('新年の目標について話し合いましょう')
      expect(result).toContain('佐藤花子 - 2023/1/2')
      expect(result).toContain('昨日の会議の議事録です')
    })

    it('各スレッドに適切なヘッダーとIDが付けられる', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap)

      expect(result).toContain('### Thread 1 {#thread-1}')
      expect(result).toContain('### Thread 2 {#thread-2}')
    })
  })

  describe('ユーザーマップ処理', () => {
    it('ユーザーマップにないユーザーIDをそのまま使用する', () => {
      const incompleteUserMap = {
        U123456: '田中太郎',
        // U789012とU345678は含まない
      }

      const result = generateSlackThreadsMarkdown(mockThreads, incompleteUserMap, mockPermalinkMap)

      // 参加者リストにユーザーIDが含まれることを確認
      expect(result).toContain('participants: ["田中太郎", "U789012", "U345678"]')
    })

    it('空のユーザーマップでも処理できる', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, {}, mockPermalinkMap)

      expect(result).toContain('participants: ["U123456", "U789012", "U345678"]')
      expect(result).toBeTruthy()
    })
  })

  describe('YAML Front Matter', () => {
    it('すべての必要なメタデータが含まれる', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap, 'AI開発')

      // YAML形式の確認
      expect(result).toMatch(/^---\n/)
      expect(result).toContain('source: "slack"')
      expect(result).toContain('total_threads: 2')
      expect(result).toContain('total_messages: 5')
      expect(result).toContain('search_keyword: "AI開発"')
      expect(result).toContain('channels: ["C123456"]')
      expect(result).toContain('participants: ["田中太郎", "佐藤花子", "山田次郎"]')
      expect(result).toContain('date_range: "2023-01-01 - 2023-01-02"')
      expect(result).toMatch(/generated_at: "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"/)
      expect(result).toMatch(/---\n\n/)
    })
  })

  describe('エッジケース', () => {
    it('返信のないスレッドを処理する', () => {
      const threadWithoutReplies: SlackThread = {
        channel: 'C123456',
        parent: {
          ts: '1672531200.123456',
          user: 'U123456',
          text: '返信なしのメッセージ',
          channel: { id: 'C123456' },
        },
        replies: [],
      }

      const result = generateSlackThreadsMarkdown([threadWithoutReplies], mockUserMap, mockPermalinkMap)

      expect(result).toContain('total_threads: 1')
      expect(result).toContain('total_messages: 1')
      expect(result).toBeTruthy()
    })

    it('単一スレッドでも正しく処理する', () => {
      const result = generateSlackThreadsMarkdown([mockThreads[0]], mockUserMap, mockPermalinkMap)

      expect(result).toContain('total_threads: 1')
      expect(result).toContain('total_messages: 3') // 親1 + 返信2
      expect(result).toContain('### Thread 1 {#thread-1}')
      expect(result).not.toContain('### Thread 2')
    })
  })
})
