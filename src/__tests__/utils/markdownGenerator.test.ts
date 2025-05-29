import { describe, expect, it } from 'vitest'
import { generateMarkdown } from '../../utils/markdownGenerator'
import type { DocbasePostListItem } from '../../types/docbase'

describe('markdownGenerator', () => {
  const mockPosts: DocbasePostListItem[] = [
    {
      id: 1,
      title: 'テスト記事1',
      body: 'これはテスト記事1の内容です。',
      created_at: '2023-01-01T10:00:00Z',
      url: 'https://example.docbase.io/posts/1',
    },
    {
      id: 2,
      title: 'テスト記事2',
      body: 'これはテスト記事2の内容です。\n複数行の内容を含みます。',
      created_at: '2023-01-02T15:30:00Z',
      url: 'https://example.docbase.io/posts/2',
    },
    {
      id: 3,
      title: 'マークダウン記事',
      body: '# マークダウンタイトル\n\n**太字**のテキストと*斜体*のテキスト。',
      created_at: '2023-01-03T09:15:00Z',
      url: 'https://example.docbase.io/posts/3',
    },
  ]

  describe('基本機能', () => {
    it('空の配列の場合は空文字列を返す', () => {
      const result = generateMarkdown([])
      expect(result).toBe('')
    })

    it('nullまたはundefinedの場合は空文字列を返す', () => {
      expect(generateMarkdown(null as any)).toBe('')
      expect(generateMarkdown(undefined as any)).toBe('')
    })

    it('記事リストから正しいMarkdownを生成する', () => {
      const result = generateMarkdown(mockPosts, 'テストキーワード')

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
      expect(result).toContain('### Article 1')
      expect(result).toContain('### Article 2')
      expect(result).toContain('### Article 3')
    })

    it('検索キーワードなしでもMarkdownを生成する', () => {
      const result = generateMarkdown(mockPosts)

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
        },
        {
          id: 2,
          title: '記事2',
          body: '内容2',
          created_at: '2023-01-01T15:00:00Z',
          url: 'https://example.com/2',
        },
      ]

      const result = generateMarkdown(sameDayPosts)

      expect(result).toContain('date_range: "2023-01-01 - 2023-01-01"')
      // Collection Overviewでの日付表示は単一日付になる
      expect(result).toMatch(/- \*\*Date Range\*\*: 2023\/1\/1/)
    })

    it('複数の日付範囲を正しく処理する', () => {
      const result = generateMarkdown(mockPosts)

      expect(result).toContain('date_range: "2023-01-01 - 2023-01-03"')
      expect(result).toMatch(/- \*\*Date Range\*\*: 2023\/1\/1 - 2023\/1\/3/)
    })

    it('記事の日付が正しく日本語形式でフォーマットされる', () => {
      const result = generateMarkdown([mockPosts[0]])

      // 目次での日付表示
      expect(result).toMatch(/1\. \[テスト記事1\]\(#article-1\) - 2023\/1\/1/)

      // 記事詳細での日付表示（長い形式）
      expect(result).toMatch(/- \*\*Created\*\*: 2023年1月1日日曜日/)
    })
  })

  describe('記事内容の処理', () => {
    it('記事のYAML Front Matterが正しく生成される', () => {
      const result = generateMarkdown([mockPosts[0]])

      expect(result).toContain('```yaml')
      expect(result).toContain('docbase_id: 1')
      expect(result).toContain('title: "テスト記事1"')
      expect(result).toContain('created_at: "2023-01-01T10:00:00.000Z"')
      expect(result).toContain('url: "https://example.docbase.io/posts/1"')
      expect(result).toContain('```')
    })

    it('記事の本文がそのまま含まれる', () => {
      const result = generateMarkdown([mockPosts[0]])

      expect(result).toContain('## Content')
      expect(result).toContain('これはテスト記事1の内容です。')
    })

    it('複数行の記事内容を正しく処理する', () => {
      const result = generateMarkdown([mockPosts[1]])

      expect(result).toContain('これはテスト記事2の内容です。')
      expect(result).toContain('複数行の内容を含みます。')
    })

    it('マークダウン形式の記事内容をそのまま保持する', () => {
      const result = generateMarkdown([mockPosts[2]])

      expect(result).toContain('# マークダウンタイトル')
      expect(result).toContain('**太字**のテキストと*斜体*のテキスト。')
    })

    it('記事間の区切り線が正しく挿入される', () => {
      const result = generateMarkdown(mockPosts)

      // 記事間に区切り線があることを確認
      const articleSections = result.split('---\n\n')
      expect(articleSections.length).toBeGreaterThan(3) // 最初のYAML Front Matter + 目次の区切り + 記事間の区切り
    })
  })

  describe('ドキュメント情報', () => {
    it('記事の基本情報が正しく含まれる', () => {
      const result = generateMarkdown([mockPosts[0]])

      expect(result).toContain('## Document Information')
      expect(result).toContain('- **Document ID**: 1')
      expect(result).toContain('- **Source**: [Docbase Article](https://example.docbase.io/posts/1)')
    })

    it('記事タイトルが適切にレベル1ヘッダーになる', () => {
      const result = generateMarkdown([mockPosts[0]])

      // 記事のタイトルがH1として表示されることを確認
      expect(result).toMatch(/# テスト記事1\n/)
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
        },
      ]

      const result = generateMarkdown(specialPosts)

      expect(result).toContain('title: "タイトル "引用符" & 特殊文字"')
      expect(result).toContain('# タイトル "引用符" & 特殊文字')
    })

    it('空の本文を持つ記事を処理する', () => {
      const emptyBodyPosts = [
        {
          id: 1,
          title: '空の記事',
          body: '',
          created_at: '2023-01-01T10:00:00Z',
          url: 'https://example.com/1',
        },
      ]

      const result = generateMarkdown(emptyBodyPosts)

      expect(result).toContain('# 空の記事')
      expect(result).toContain('## Content')
      // 空の本文でもエラーにならないことを確認
      expect(result).toBeTruthy()
    })

    it('単一記事でも正しくMarkdownを生成する', () => {
      const result = generateMarkdown([mockPosts[0]])

      expect(result).toContain('total_articles: 1')
      expect(result).toContain('- **Total Articles**: 1')
      expect(result).toContain('### Article 1')
      expect(result).not.toContain('### Article 2')
    })
  })

  describe('LLM最適化要素', () => {
    it('LLM理解しやすい構造化された見出しを含む', () => {
      const result = generateMarkdown(mockPosts)

      // 構造化された見出しレベル
      expect(result).toContain('# Docbase Articles Collection')
      expect(result).toContain('## Collection Overview')
      expect(result).toContain('## Articles Index')
      expect(result).toContain('## Articles Content')
      expect(result).toContain('### Article 1')
      expect(result).toContain('## Document Information')
      expect(result).toContain('## Content')
    })

    it('YAML Front Matterにメタデータが適切に含まれる', () => {
      const result = generateMarkdown(mockPosts, 'AI学習')

      expect(result).toMatch(/^---\n/)
      expect(result).toContain('source: "docbase"')
      expect(result).toContain('total_articles: 3')
      expect(result).toContain('search_keyword: "AI学習"')
      expect(result).toContain('generated_at:')
      expect(result).toMatch(/---\n\n/)
    })

    it('記事ごとのYAMLブロックでメタデータを提供する', () => {
      const result = generateMarkdown([mockPosts[0]])

      // 記事レベルのYAMLブロック
      expect(result).toContain('```yaml')
      expect(result).toContain('docbase_id: 1')
      expect(result).toContain('title: "テスト記事1"')
      expect(result).toContain('created_at: "2023-01-01T10:00:00.000Z"')
      expect(result).toContain('url: "https://example.docbase.io/posts/1"')
      expect(result).toContain('```')
    })
  })
})