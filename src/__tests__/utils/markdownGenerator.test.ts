import { describe, expect, it } from 'vitest'
import type { DocbasePostListItem } from '../../features/docbase/types/docbase'
import {
  generateDocbaseMarkdown,
  generateDocbaseMarkdownForPreview,
} from '../../features/docbase/utils/docbaseMarkdownGenerator'

describe('markdownGenerator', () => {
  const mockPosts: DocbasePostListItem[] = [
    {
      id: 1,
      title: 'テスト記事1',
      body: 'これはテスト記事1の内容です。',
      created_at: '2023-01-01T10:00:00Z',
      url: 'https://example.docbase.io/posts/1',
      user: { id: 100, name: 'テストユーザー1', profile_image_url: 'https://example.com/user1.jpg' },
      tags: [{ name: 'API' }, { name: 'テスト' }],
      groups: [{ id: 1, name: '開発チーム' }],
      scope: 'everyone',
    },
    {
      id: 2,
      title: 'テスト記事2',
      body: 'これはテスト記事2の内容です。\n複数行の内容を含みます。',
      created_at: '2023-01-02T15:30:00Z',
      url: 'https://example.docbase.io/posts/2',
      user: { id: 101, name: 'テストユーザー2', profile_image_url: 'https://example.com/user2.jpg' },
      tags: [{ name: 'ドキュメント' }],
      groups: [],
      scope: 'group',
    },
    {
      id: 3,
      title: 'マークダウン記事',
      body: '# マークダウンタイトル\n\n**太字**のテキストと*斜体*のテキスト。',
      created_at: '2023-01-03T09:15:00Z',
      url: 'https://example.docbase.io/posts/3',
      user: { id: 102, name: 'テストユーザー3', profile_image_url: 'https://example.com/user3.jpg' },
      tags: [],
      groups: [
        { id: 2, name: 'デザインチーム' },
        { id: 3, name: 'プロダクトチーム' },
      ],
      scope: 'private',
    },
  ]

  describe('基本機能', () => {
    it('空の配列の場合は空文字列を返す', () => {
      const result = generateDocbaseMarkdown([])
      expect(result).toBe('')
    })

    it('nullまたはundefinedの場合は空文字列を返す', () => {
      expect(generateDocbaseMarkdown(null as unknown as DocbasePostListItem[])).toBe('')
      expect(generateDocbaseMarkdown(undefined as unknown as DocbasePostListItem[])).toBe('')
    })

    it('記事リストから正しいMarkdownを生成する', () => {
      const result = generateDocbaseMarkdown(mockPosts, 'テストキーワード')

      // YAML Front Matterの確認
      expect(result).toContain('---')
      expect(result).toContain('source: "docbase"')
      expect(result).toContain('total_articles: 3')
      expect(result).toContain('search_keyword: "テストキーワード"')
      expect(result).toContain('date_range: "2023-01-01 - 2023-01-03"')
      expect(result).toContain('generated_at:')

      // メインタイトルの確認
      expect(result).toContain('# Docbase Articles Collection')

      // 概要セクションの確認
      expect(result).toContain('## Collection Overview')
      expect(result).toContain('- **Total Articles**: 3')
      expect(result).toContain('- **Search Keyword**: "テストキーワード"')
      expect(result).toContain('- **Source**: Docbase Knowledge Base')

      // 目次の確認
      expect(result).toContain('## Articles Index')
      expect(result).toContain('1. [テスト記事1](#article-1)')
      expect(result).toContain('2. [テスト記事2](#article-2)')
      expect(result).toContain('3. [マークダウン記事](#article-3)')

      // 記事内容の確認
      expect(result).toContain('## Articles Content')
      expect(result).toContain('### Article 1: テスト記事1')
      expect(result).toContain('### Article 2: テスト記事2')
      expect(result).toContain('### Article 3: マークダウン記事')
    })

    it('検索キーワードなしでもMarkdownを生成する', () => {
      const result = generateDocbaseMarkdown(mockPosts)

      // 検索キーワードが含まれないことを確認
      expect(result).not.toContain('search_keyword:')
      expect(result).not.toContain('- **Search Keyword**:')

      // その他の基本要素は含まれることを確認
      expect(result).toContain('# Docbase Articles Collection')
      expect(result).toContain('total_articles: 3')
    })
  })

  describe('日付処理', () => {
    it('同じ日付の記事のみの場合、date_rangeが単一日付になる', () => {
      const sameDayPosts = [
        {
          id: 1,
          title: '記事1',
          body: '内容1',
          created_at: '2023-01-01T10:00:00Z',
          url: 'https://example.com/1',
          user: { id: 100, name: 'テストユーザー1', profile_image_url: 'https://example.com/user1.jpg' },
          tags: [],
          groups: [],
          scope: 'everyone',
        },
        {
          id: 2,
          title: '記事2',
          body: '内容2',
          created_at: '2023-01-01T15:00:00Z',
          url: 'https://example.com/2',
          user: { id: 101, name: 'テストユーザー2', profile_image_url: 'https://example.com/user2.jpg' },
          tags: [],
          groups: [],
          scope: 'everyone',
        },
      ]

      const result = generateDocbaseMarkdown(sameDayPosts)

      expect(result).toContain('date_range: "2023-01-01 - 2023-01-01"')
      // Collection Overviewでの日付表示は単一日付になる
      expect(result).toMatch(/- \*\*Date Range\*\*: 2023\/1\/1/)
    })

    it('複数の日付範囲を正しく処理する', () => {
      const result = generateDocbaseMarkdown(mockPosts)

      expect(result).toContain('date_range: "2023-01-01 - 2023-01-03"')
      expect(result).toMatch(/- \*\*Date Range\*\*: 2023\/1\/1 - 2023\/1\/3/)
    })

    it('記事の日付が正しく日本語形式でフォーマットされる', () => {
      const result = generateDocbaseMarkdown([mockPosts[0]])

      // 目次での日付表示
      expect(result).toMatch(/1\. \[テスト記事1\]\(#article-1\) - 2023\/1\/1/)

      // 記事詳細での日付表示（時刻ありの長い形式）
      expect(result).toMatch(/\*\*Created\*\*: 2023年1月1日日曜日 19:00/)
    })
  })

  describe('記事内容の処理', () => {
    it('記事のメタデータが改行区切りで生成される', () => {
      const result = generateDocbaseMarkdown([mockPosts[0]])

      expect(result).toContain('**Created**: 2023年1月1日日曜日 19:00')
      expect(result).toContain('**Author**: テストユーザー1')
      expect(result).toContain('**ID**: 1')
      expect(result).toContain('**Tags**: API, テスト')
      expect(result).toContain('**Groups**: 開発チーム')
      expect(result).toContain('**URL**: [View Original](https://example.docbase.io/posts/1)')
    })

    it('記事の本文がHTMLコメントで囲まれて含まれる', () => {
      const result = generateDocbaseMarkdown([mockPosts[0]])

      expect(result).toContain('<!-- DOCBASE_CONTENT_START -->')
      expect(result).toContain('これはテスト記事1の内容です。')
      expect(result).toContain('<!-- DOCBASE_CONTENT_END -->')
    })

    it('複数行の記事内容を正しく処理する', () => {
      const result = generateDocbaseMarkdown([mockPosts[1]])

      expect(result).toContain('これはテスト記事2の内容です。')
      expect(result).toContain('複数行の内容を含みます。')
    })

    it('マークダウン形式の記事内容がHTMLコメント内で保持される', () => {
      const result = generateDocbaseMarkdown([mockPosts[2]])

      expect(result).toContain('<!-- DOCBASE_CONTENT_START -->')
      expect(result).toContain('# マークダウンタイトル')
      expect(result).toContain('**太字**のテキストと*斜体*のテキスト。')
      expect(result).toContain('<!-- DOCBASE_CONTENT_END -->')
    })

    it('記事間の区切り線が正しく挿入される', () => {
      const result = generateDocbaseMarkdown(mockPosts)

      // 記事間に区切り線があることを確認
      const articleSections = result.split('---\n\n')
      expect(articleSections.length).toBeGreaterThan(3) // 最初のYAML Front Matter + 目次の区切り + 記事間の区切り
    })
  })

  describe('ドキュメント情報', () => {
    it('記事の基本情報が改行区切りで含まれる', () => {
      const result = generateDocbaseMarkdown([mockPosts[0]])

      expect(result).toContain('**Author**: テストユーザー1')
      expect(result).toContain('**ID**: 1')
      expect(result).toContain('**URL**: [View Original](https://example.docbase.io/posts/1)')
    })

    it('記事タイトルが見出しに組み込まれる', () => {
      const result = generateDocbaseMarkdown([mockPosts[0]])

      // 記事のタイトルがH3見出しに組み込まれることを確認
      expect(result).toContain('### Article 1: テスト記事1')
    })
  })

  describe('特殊文字・エッジケース', () => {
    it('特殊文字を含むタイトルを正しく処理する', () => {
      const specialPosts = [
        {
          id: 1,
          title: 'タイトル "引用符" & 特殊文字',
          body: '内容',
          created_at: '2023-01-01T10:00:00Z',
          url: 'https://example.com/1',
          user: { id: 100, name: 'テストユーザー', profile_image_url: 'https://example.com/user.jpg' },
          tags: [],
          groups: [],
          scope: 'everyone',
        },
      ]

      const result = generateDocbaseMarkdown(specialPosts)

      expect(result).toContain('### Article 1: タイトル "引用符" & 特殊文字')
    })

    it('空の本文を持つ記事を処理する', () => {
      const emptyBodyPosts = [
        {
          id: 1,
          title: '空の記事',
          body: '',
          created_at: '2023-01-01T10:00:00Z',
          url: 'https://example.com/1',
          user: { id: 100, name: 'テストユーザー', profile_image_url: 'https://example.com/user.jpg' },
          tags: [],
          groups: [],
          scope: 'everyone',
        },
      ]

      const result = generateDocbaseMarkdown(emptyBodyPosts)

      expect(result).toContain('### Article 1: 空の記事')
      expect(result).toContain('<!-- DOCBASE_CONTENT_START -->')
      expect(result).toContain('<!-- DOCBASE_CONTENT_END -->')
      // 空の本文でもエラーにならないことを確認
      expect(result).toBeTruthy()
    })

    it('単一記事でも正しくMarkdownを生成する', () => {
      const result = generateDocbaseMarkdown([mockPosts[0]])

      expect(result).toContain('total_articles: 1')
      expect(result).toContain('- **Total Articles**: 1')
      expect(result).toContain('### Article 1: テスト記事1')
      expect(result).not.toContain('### Article 2:')
    })
  })

  describe('LLM最適化要素', () => {
    it('LLM理解しやすい構造化された見出しを含む', () => {
      const result = generateDocbaseMarkdown(mockPosts)

      // 構造化された見出しレベル
      expect(result).toContain('# Docbase Articles Collection')
      expect(result).toContain('## Collection Overview')
      expect(result).toContain('## Articles Index')
      expect(result).toContain('## Articles Content')
      expect(result).toContain('### Article 1: テスト記事1')
      expect(result).toContain('<!-- DOCBASE_CONTENT_START -->')
      expect(result).toContain('<!-- DOCBASE_CONTENT_END -->')
    })

    it('YAML Front Matterにメタデータが適切に含まれる', () => {
      const result = generateDocbaseMarkdown(mockPosts, 'AI学習')

      expect(result).toMatch(/^---\n/)
      expect(result).toContain('source: "docbase"')
      expect(result).toContain('total_articles: 3')
      expect(result).toContain('search_keyword: "AI学習"')
      expect(result).toContain('generated_at:')
      expect(result).toMatch(/---\n\n/)
    })

    it('記事ごとのメタデータが改行区切りで提供される', () => {
      const result = generateDocbaseMarkdown([mockPosts[0]])

      // 改行区切りのメタデータ
      expect(result).toContain('**Created**: 2023年1月1日日曜日 19:00')
      expect(result).toContain('**Author**: テストユーザー1')
      expect(result).toContain('**ID**: 1')
      expect(result).toContain('**Tags**: API, テスト')
      expect(result).toContain('**Groups**: 開発チーム')
      expect(result).toContain('**URL**: [View Original](https://example.docbase.io/posts/1)')
    })
  })

  describe('generateDocbaseMarkdownForPreview', () => {
    describe('基本機能', () => {
      it('空の配列の場合は空文字列を返す', () => {
        const result = generateDocbaseMarkdownForPreview([])
        expect(result).toBe('')
      })

      it('nullまたはundefinedの場合は空文字列を返す', () => {
        expect(generateDocbaseMarkdownForPreview(null as unknown as DocbasePostListItem[])).toBe('')
        expect(generateDocbaseMarkdownForPreview(undefined as unknown as DocbasePostListItem[])).toBe('')
      })

      it('プレビュー用の簡潔なMarkdownを生成する', () => {
        const result = generateDocbaseMarkdownForPreview(mockPosts, 'テストキーワード')

        // プレビュー用ヘッダーの確認
        expect(result).toContain('**検索キーワード**: テストキーワード')
        expect(result).toContain('**記事数**: 3件')

        // YAML Front Matterが含まれないことを確認
        expect(result).not.toContain('---\nsource:')
        expect(result).not.toContain('generated_at:')

        // HTMLコメントが含まれないことを確認
        expect(result).not.toContain('<!-- DOCBASE_CONTENT_START -->')
        expect(result).not.toContain('<!-- DOCBASE_CONTENT_END -->')

        // Articles Indexが含まれないことを確認
        expect(result).not.toContain('## Articles Index')
      })

      it('検索キーワードなしでもプレビューを生成する', () => {
        const result = generateDocbaseMarkdownForPreview(mockPosts)

        expect(result).toContain('**記事数**: 3件')
        expect(result).not.toContain('**検索キーワード**:')
      })
    })

    describe('記事の表示形式', () => {
      it('記事タイトルがH2見出しで表示される', () => {
        const result = generateDocbaseMarkdownForPreview([mockPosts[0]])

        expect(result).toContain('## テスト記事1')
        expect(result).not.toContain('### Article 1:')
      })

      it('メタデータが記事タイトル直下に簡潔に表示される', () => {
        const result = generateDocbaseMarkdownForPreview([mockPosts[0]])

        expect(result).toContain('**作成日**: 2023/01/01')
        expect(result).toContain('**作成者**: テストユーザー1')
        expect(result).toContain('**タグ**: API, テスト')
        expect(result).toContain('**グループ**: 開発チーム')

        // 詳細な日時表示がないことを確認
        expect(result).not.toContain('2023年1月1日日曜日')
        expect(result).not.toContain('**ID**:')
        expect(result).not.toContain('**URL**:')
      })

      it('記事内容が150文字で切り詰められる', () => {
        const longBodyPost = {
          id: 1,
          title: '長い記事',
          body: 'あ'.repeat(200), // 200文字の長い内容
          created_at: '2023-01-01T10:00:00Z',
          url: 'https://example.com/1',
          user: { id: 100, name: 'テストユーザー', profile_image_url: 'https://example.com/user.jpg' },
          tags: [],
          groups: [],
          scope: 'everyone',
        }

        const result = generateDocbaseMarkdownForPreview([longBodyPost])

        expect(result).toContain(`${'あ'.repeat(150)}...`)
        expect(result).not.toContain('あ'.repeat(200))
      })

      it('短い記事内容はそのまま表示される', () => {
        const result = generateDocbaseMarkdownForPreview([mockPosts[0]])

        expect(result).toContain('これはテスト記事1の内容です。')
        expect(result).not.toContain('...')
      })
    })

    describe('条件分岐の処理', () => {
      it('タグがない記事ではタグ行が表示されない', () => {
        const noTagPost = {
          ...mockPosts[2],
          tags: [],
        }

        const result = generateDocbaseMarkdownForPreview([noTagPost])

        expect(result).not.toContain('**タグ**:')
        expect(result).toContain('**作成日**:')
        expect(result).toContain('**作成者**:')
      })

      it('グループがない記事ではグループ行が表示されない', () => {
        const noGroupPost = {
          ...mockPosts[1],
          groups: [],
        }

        const result = generateDocbaseMarkdownForPreview([noGroupPost])

        expect(result).not.toContain('**グループ**:')
        expect(result).toContain('**作成日**:')
        expect(result).toContain('**作成者**:')
      })

      it('複数のタグとグループが正しく表示される', () => {
        const result = generateDocbaseMarkdownForPreview([mockPosts[2]])

        expect(result).toContain('**グループ**: デザインチーム, プロダクトチーム')
      })
    })

    describe('日付フォーマット', () => {
      it('日付が簡潔な形式で表示される', () => {
        const result = generateDocbaseMarkdownForPreview([mockPosts[0]])

        expect(result).toContain('**作成日**: 2023/01/01')
        expect(result).not.toContain('2023年1月1日')
        expect(result).not.toContain('19:00')
      })
    })

    describe('記事間の区切り', () => {
      it('複数記事が水平線で区切られる', () => {
        const result = generateDocbaseMarkdownForPreview(mockPosts)

        // 水平線で区切られることを確認
        const sections = result.split('---\n\n')
        expect(sections.length).toBeGreaterThan(2)
      })

      it('単一記事では区切り線が余分に含まれない', () => {
        const result = generateDocbaseMarkdownForPreview([mockPosts[0]])

        // ヘッダー部分の区切り線のみ
        const sections = result.split('---\n\n')
        expect(sections.length).toBe(2)
      })
    })

    describe('プレビューとダウンロード用の違い', () => {
      it('プレビュー版にはYAML Front Matterが含まれない', () => {
        const preview = generateDocbaseMarkdownForPreview(mockPosts)
        const download = generateDocbaseMarkdown(mockPosts)

        expect(download).toContain('---\nsource:')
        expect(preview).not.toContain('---\nsource:')
      })

      it('プレビュー版にはHTMLコメントが含まれない', () => {
        const preview = generateDocbaseMarkdownForPreview(mockPosts)
        const download = generateDocbaseMarkdown(mockPosts)

        expect(download).toContain('<!-- DOCBASE_CONTENT_START -->')
        expect(preview).not.toContain('<!-- DOCBASE_CONTENT_START -->')
      })

      it('プレビュー版には詳細メタデータが含まれない', () => {
        const preview = generateDocbaseMarkdownForPreview(mockPosts)
        const download = generateDocbaseMarkdown(mockPosts)

        expect(download).toContain('**ID**:')
        expect(download).toContain('**URL**:')
        expect(preview).not.toContain('**ID**:')
        expect(preview).not.toContain('**URL**:')
      })
    })
  })
})
