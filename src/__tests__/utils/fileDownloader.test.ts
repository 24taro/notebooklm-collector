import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadMarkdownFile } from '../../utils/fileDownloader'

// DOM操作のモック
const mockClick = vi.fn()
const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()

describe('fileDownloader', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // createElement のモック
    const mockAnchorElement = {
      href: '',
      download: '',
      click: mockClick,
    }

    global.document = {
      createElement: vi.fn().mockReturnValue(mockAnchorElement),
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as unknown as Document

    // URL のモック
    global.URL = {
      createObjectURL: mockCreateObjectURL.mockReturnValue('blob:mock-url'),
      revokeObjectURL: mockRevokeObjectURL,
    } as unknown as typeof URL

    // Blob のモック
    global.Blob = vi.fn().mockImplementation((content, options) => ({
      content,
      options,
    })) as unknown as typeof Blob

    // console.error のモック
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('正常ケース', () => {
    it('Docbaseソースでファイルダウンロードが成功する', () => {
      const result = downloadMarkdownFile('# テストMarkdown', 'test-keyword', true, 'docbase')

      expect(result.success).toBe(true)
      expect(result.message).toBeUndefined()

      // Blob作成の確認
      expect(global.Blob).toHaveBeenCalledWith(['# テストMarkdown'], { type: 'text/markdown;charset=utf-8' })

      // URL作成・削除の確認
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

      // DOM操作の確認
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockAppendChild).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalled()
    })

    it('Slackソースでファイルダウンロードが成功する', () => {
      const result = downloadMarkdownFile('# Slack Threads', 'slack-search', true, 'slack')

      expect(result.success).toBe(true)

      // ファイル名にslackとthreadsが含まれることを確認
      const anchorElement = (document.createElement as Mock).mock.results[0].value
      expect(anchorElement.download).toMatch(/^slack_\d{4}-\d{2}-\d{2}_slack_search_threads\.md$/)
    })

    it('デフォルトソースタイプ（docbase）でダウンロードが成功する', () => {
      const result = downloadMarkdownFile(
        '# Default Content',
        'default-keyword',
        true,
        // sourceType省略
      )

      expect(result.success).toBe(true)

      // ファイル名にdocbaseとarticlesが含まれることを確認
      const anchorElement = (document.createElement as Mock).mock.results[0].value
      expect(anchorElement.download).toMatch(/^docbase_\d{4}-\d{2}-\d{2}_default_keyword_articles\.md$/)
    })
  })

  describe('ファイル名生成', () => {
    it('現在の日付が正しくファイル名に含まれる', () => {
      const mockDate = new Date('2023-05-15T10:30:00Z')
      vi.setSystemTime(mockDate)

      downloadMarkdownFile('# Test', 'keyword', true, 'docbase')

      const anchorElement = (document.createElement as Mock).mock.results[0].value
      expect(anchorElement.download).toBe('docbase_2023-05-15_keyword_articles.md')

      vi.useRealTimers()
    })

    it('特殊文字を含むキーワードが安全な形式に変換される', () => {
      downloadMarkdownFile('# Test', 'キーワード/with*special&chars!', true, 'docbase')

      const anchorElement = (document.createElement as Mock).mock.results[0].value
      expect(anchorElement.download).toMatch(/docbase_\d{4}-\d{2}-\d{2}_キーワード_with_special_chars__articles\.md/)
    })

    it('空のキーワードがデフォルト値に置き換えられる', () => {
      downloadMarkdownFile('# Test', '', true, 'docbase')

      const anchorElement = (document.createElement as Mock).mock.results[0].value
      expect(anchorElement.download).toMatch(/docbase_\d{4}-\d{2}-\d{2}_search_articles\.md/)
    })

    it('空白のみのキーワードがデフォルト値に置き換えられる', () => {
      downloadMarkdownFile('# Test', '   ', true, 'docbase')

      const anchorElement = (document.createElement as Mock).mock.results[0].value
      expect(anchorElement.download).toMatch(/docbase_\d{4}-\d{2}-\d{2}_search_articles\.md/)
    })

    it('日本語文字が正しく保持される', () => {
      downloadMarkdownFile('# Test', '日本語キーワード', true, 'slack')

      const anchorElement = (document.createElement as Mock).mock.results[0].value
      expect(anchorElement.download).toMatch(/slack_\d{4}-\d{2}-\d{2}_日本語キーワード_threads\.md/)
    })
  })

  describe('エラーケース', () => {
    it('投稿が存在しない場合はエラーを返す', () => {
      const result = downloadMarkdownFile(
        '# Test Content',
        'keyword',
        false, // postsExist = false
        'docbase',
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('ダウンロードするコンテンツがありません。')

      // DOM操作が実行されないことを確認
      expect(mockClick).not.toHaveBeenCalled()
      expect(mockAppendChild).not.toHaveBeenCalled()
    })

    it('Markdownコンテンツが空の場合はエラーを返す', () => {
      const result = downloadMarkdownFile(
        '', // 空のコンテンツ
        'keyword',
        true,
        'docbase',
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('ダウンロードするコンテンツがありません。')

      // DOM操作が実行されないことを確認
      expect(mockClick).not.toHaveBeenCalled()
    })

    it('Markdownコンテンツが空白のみの場合はエラーを返す', () => {
      const result = downloadMarkdownFile(
        '   \n\t  ', // 空白のみのコンテンツ
        'keyword',
        true,
        'docbase',
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('ダウンロードするコンテンツがありません。')
    })

  })


  describe('属性設定', () => {
    it('アンカー要素の属性が正しく設定される', () => {
      downloadMarkdownFile('# Test Content', 'test-keyword', true, 'docbase')

      const anchorElement = (document.createElement as Mock).mock.results[0].value
      expect(anchorElement.href).toBe('blob:mock-url')
      expect(anchorElement.download).toMatch(/^docbase_\d{4}-\d{2}-\d{2}_test_keyword_articles\.md$/)
    })

    it('Blobが正しいMIMEタイプで作成される', () => {
      downloadMarkdownFile('# Test', 'keyword', true, 'docbase')

      expect(global.Blob).toHaveBeenCalledWith(['# Test'], { type: 'text/markdown;charset=utf-8' })
    })
  })

  describe('コンテンツタイプ', () => {
    it('docbaseソースの場合、ファイル名にarticlesが含まれる', () => {
      downloadMarkdownFile('# Test', 'keyword', true, 'docbase')

      const anchorElement = (document.createElement as Mock).mock.results[0].value
      expect(anchorElement.download).toContain('_articles.md')
    })

    it('slackソースの場合、ファイル名にthreadsが含まれる', () => {
      downloadMarkdownFile('# Test', 'keyword', true, 'slack')

      const anchorElement = (document.createElement as Mock).mock.results[0].value
      expect(anchorElement.download).toContain('_threads.md')
    })
  })
})
