import type { SlackMessage, SlackThread } from '@/features/slack/types/slack'
import { generateSlackThreadsMarkdown } from '@/features/slack/utils/slackMarkdownGenerator'
import { describe, expect, it, vi } from 'vitest'

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
        user: 'U654321',
        text: '昨日の会議の議事録です',
        channel: { id: 'C123456' },
      },
      replies: [
        {
          ts: '1672617660.123460', // 2023-01-02 00:01:00 UTC
          user: 'U111213',
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
    U654321: '佐藤花子',
    U111213: '田中太郎',
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
      const result = generateSlackThreadsMarkdown([], mockUserMap, mockPermalinkMap)
      expect(result).toBe('')
    })

    it('nullまたはundefinedの場合は空文字列を返す', () => {
      // @ts-expect-error nullまたはundefinedのテスト用
      const resultNull = generateSlackThreadsMarkdown(null, mockUserMap, mockPermalinkMap)
      // @ts-expect-error nullまたはundefinedのテスト用
      const resultUndefined = generateSlackThreadsMarkdown(undefined, mockUserMap, mockPermalinkMap)
      expect(resultNull).toBe('')
      expect(resultUndefined).toBe('')
    })

    it('スレッドリストから正しいMarkdownを生成する', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap, 'テストキーワード')

      // YAML Front Matterが含まれていることを確認
      expect(result).toContain('---')
      expect(result).toContain('source: "slack"')
      expect(result).toContain('total_threads: 2')
      expect(result).toContain('search_keyword: "テストキーワード"')

      // メインタイトルが含まれていることを確認
      expect(result).toContain('# Slack Threads Collection')

      // スレッド目次が含まれていることを確認
      expect(result).toContain('## Threads Index')

      // 各スレッドのコンテンツが含まれていることを確認
      expect(result).toContain('## Threads Content')
    })

    it('検索キーワードなしでもMarkdownを生成する', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap)

      // search_keywordが含まれていないことを確認
      expect(result).not.toContain('search_keyword:')
      expect(result).toContain('total_threads: 2')
    })
  })

  describe('メタデータ処理', () => {
    it('複数チャンネルを正しく処理する', () => {
      const multiChannelThreads = [{ ...mockThreads[0] }, { ...mockThreads[1], channel: 'C789012' }]

      const result = generateSlackThreadsMarkdown(multiChannelThreads, mockUserMap, mockPermalinkMap)

      expect(result).toContain('channels: ["C123456", "C789012"]')
    })

    it('参加者が10人以下の場合は全員リストアップする', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap)

      // 参加者が全員リストされていることを確認
      expect(result).toContain('"田中太郎"')
      expect(result).toContain('"佐藤花子"')
      expect(result).toContain('"山田次郎"')
    })

    it('参加者が10人を超える場合は制限する', () => {
      const largeUserMap: Record<string, string> = {}
      for (let i = 1; i <= 15; i++) {
        largeUserMap[`U${i.toString().padStart(6, '0')}`] = `ユーザー${i}`
      }

      const largeThreads = mockThreads.map((thread, index) => ({
        ...thread,
        parent: { ...thread.parent, user: `U${(index + 1).toString().padStart(6, '0')}` },
        replies: thread.replies.map((reply, replyIndex) => ({
          ...reply,
          user: `U${(index * 10 + replyIndex + 2).toString().padStart(6, '0')}`,
        })),
      }))

      const result = generateSlackThreadsMarkdown(largeThreads, largeUserMap, mockPermalinkMap)

      expect(result).toContain('total_participants:')
      // 最初の10人のみがリストされることを確認
      const participantsMatch = result.match(/participants: \[([^\]]+)\]/)
      expect(participantsMatch).toBeTruthy()
      if (participantsMatch) {
        const participantsList = participantsMatch[1]
        const participantCount = (participantsList.match(/"/g) || []).length / 2
        expect(participantCount).toBe(10)
      }
    })

    it('日付範囲を正しく計算する', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap)

      expect(result).toContain('date_range: "2023-01-01 - 2023-01-02"')
    })

    it('同じ日付のスレッドのみの場合、日付範囲が単一日付になる', () => {
      const singleDayThreads = [mockThreads[0]]
      const result = generateSlackThreadsMarkdown(singleDayThreads, mockUserMap, mockPermalinkMap)

      expect(result).toContain('date_range: "2023-01-01 - 2023-01-01"')
    })
  })

  describe('目次生成', () => {
    it('スレッド目次が正しく生成される', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap)

      expect(result).toContain('## Threads Index')
      expect(result).toContain('1. [Thread 1](#thread-1) - 田中太郎 in C123456')
      expect(result).toContain('2. [Thread 2](#thread-2) - 佐藤花子 in C123456')
    })

    it('長いテキストが省略される', () => {
      const longTextThread: SlackThread = {
        channel: 'C123456',
        parent: {
          ts: '1672531200.123456',
          user: 'U123456',
          text: 'これは非常に長いテキストです。50文字を超える場合は省略されるはずです。テスト用の長い文章を書いています。',
          channel: { id: 'C123456' },
        },
        replies: [],
      }

      const result = generateSlackThreadsMarkdown([longTextThread], mockUserMap, mockPermalinkMap)

      expect(result).toContain('...')
    })

    it('50文字以下のテキストは省略されない', () => {
      const shortTextThread: SlackThread = {
        channel: 'C123456',
        parent: {
          ts: '1672531200.123456',
          user: 'U123456',
          text: '短いテキスト',
          channel: { id: 'C123456' },
        },
        replies: [],
      }

      const result = generateSlackThreadsMarkdown([shortTextThread], mockUserMap, mockPermalinkMap)

      expect(result).not.toContain('...')
    })
  })

  describe('スレッド内容生成', () => {
    it('スレッド内容が正しく生成される', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap)

      // 両方のスレッドの内容が含まれることを確認
      expect(result).toContain('**Author**: 田中太郎')
      expect(result).toContain('新年の目標について話し合いましょう')
      expect(result).toContain('**Author**: 佐藤花子')
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
        // U789012は意図的に除外
      }

      const result = generateSlackThreadsMarkdown(mockThreads, incompleteUserMap, mockPermalinkMap)

      // ユーザー名がある場合は名前、ない場合はIDが使用される
      expect(result).toContain('田中太郎')
      expect(result).toContain('U789012') // ユーザーマップにないのでIDがそのまま使用される
    })

    it('空のユーザーマップでも処理できる', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, {}, mockPermalinkMap)

      // ユーザーIDがそのまま使用される
      expect(result).toContain('U123456')
      expect(result).toContain('U654321')
    })
  })

  describe('YAML Front Matter', () => {
    it('すべての必要なメタデータが含まれる', () => {
      const result = generateSlackThreadsMarkdown(mockThreads, mockUserMap, mockPermalinkMap, 'テストキーワード')

      // YAML Front Matterの開始と終了
      expect(result.startsWith('---\n')).toBe(true)
      expect(result).toContain('\n---\n')

      // 必須フィールド
      expect(result).toContain('source: "slack"')
      expect(result).toContain('total_threads: 2')
      expect(result).toContain('total_messages: 6') // 親2 + 返信4
      expect(result).toContain('search_keyword: "テストキーワード"')
      expect(result).toContain('channels: ["C123456"]')
      expect(result).toContain('date_range:')
      expect(result).toContain('generated_at:')
    })
  })

  describe('エッジケース', () => {
    it('返信のないスレッドを処理する', () => {
      const threadWithoutReplies: SlackThread = {
        channel: 'C123456',
        parent: {
          ts: '1672531200.123456',
          user: 'U123456',
          text: '返信なしのスレッド',
          channel: { id: 'C123456' },
        },
        replies: [],
      }

      const result = generateSlackThreadsMarkdown([threadWithoutReplies], mockUserMap, mockPermalinkMap)

      expect(result).toContain('total_threads: 1')
      expect(result).toContain('total_messages: 1')
      expect(result).toContain('返信なしのスレッド')
    })

    it('単一スレッドでも正しく処理する', () => {
      const singleThread = [mockThreads[0]]
      const result = generateSlackThreadsMarkdown(singleThread, mockUserMap, mockPermalinkMap)

      expect(result).toContain('total_threads: 1')
      expect(result).toContain('### Thread 1 {#thread-1}')
      expect(result).not.toContain('### Thread 2')
    })
  })
})
