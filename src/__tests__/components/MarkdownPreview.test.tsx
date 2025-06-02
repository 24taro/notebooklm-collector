// MarkdownPreview コンポーネントの包括的テスト
// レンダリング、プロパティ処理、ユーザーインタラクションのテストカバレッジ

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MarkdownPreview } from '../../components/MarkdownPreview'

describe('MarkdownPreview', () => {
  describe('基本表示', () => {
    it('Markdownコンテンツが正しく表示される', () => {
      const markdown = '# テストタイトル\n\nテスト本文です。'

      render(<MarkdownPreview markdown={markdown} />)

      expect(screen.getByText('テストタイトル')).toBeInTheDocument()
      expect(screen.getByText('テスト本文です。')).toBeInTheDocument()
    })

    it('デフォルトタイトルが表示される', () => {
      const markdown = '# テスト'

      render(<MarkdownPreview markdown={markdown} />)

      expect(screen.getByText('プレビュー')).toBeInTheDocument()
    })

    it('カスタムタイトルが表示される', () => {
      const markdown = '# テスト'
      const customTitle = 'カスタムタイトル'

      render(<MarkdownPreview markdown={markdown} title={customTitle} />)

      expect(screen.getByText(customTitle)).toBeInTheDocument()
    })

    it('タイトルが非表示にできる', () => {
      const markdown = '# テスト'

      render(<MarkdownPreview markdown={markdown} title="" />)

      expect(screen.queryByText('プレビュー')).not.toBeInTheDocument()
    })
  })

  describe('空コンテンツ', () => {
    it('空文字列の場合にデフォルト空メッセージが表示される', () => {
      render(<MarkdownPreview markdown="" />)

      expect(screen.getByText('ここにMarkdownプレビューが表示されます。')).toBeInTheDocument()
    })

    it('カスタム空メッセージが表示される', () => {
      const customEmptyMessage = 'カスタム空メッセージ'

      render(<MarkdownPreview markdown="" emptyMessage={customEmptyMessage} />)

      expect(screen.getByText(customEmptyMessage)).toBeInTheDocument()
    })

    it('空コンテンツの場合はタイトルとダウンロードボタンが表示されない', () => {
      const onDownload = vi.fn()

      render(<MarkdownPreview markdown="" title="テストタイトル" onDownload={onDownload} />)

      expect(screen.queryByText('テストタイトル')).not.toBeInTheDocument()
      expect(screen.queryByText('ダウンロード')).not.toBeInTheDocument()
    })
  })

  describe('ダウンロード機能', () => {
    it('onDownloadが提供されている場合はダウンロードボタンが表示される', () => {
      const markdown = '# テスト'
      const onDownload = vi.fn()

      render(<MarkdownPreview markdown={markdown} onDownload={onDownload} />)

      expect(screen.getByText('ダウンロード')).toBeInTheDocument()
    })

    it('onDownloadが提供されていない場合はダウンロードボタンが表示されない', () => {
      const markdown = '# テスト'

      render(<MarkdownPreview markdown={markdown} />)

      expect(screen.queryByText('ダウンロード')).not.toBeInTheDocument()
    })

    it('ダウンロードボタンクリックでonDownloadが呼ばれる', () => {
      const markdown = '# テスト'
      const onDownload = vi.fn()

      render(<MarkdownPreview markdown={markdown} onDownload={onDownload} />)

      const downloadButton = screen.getByText('ダウンロード')
      fireEvent.click(downloadButton)

      expect(onDownload).toHaveBeenCalledTimes(1)
    })
  })

  describe('Markdown要素の表示', () => {
    it('見出し要素が正しくレンダリングされる', () => {
      const markdown = `
# H1タイトル
## H2タイトル
### H3タイトル
#### H4タイトル
      `

      render(<MarkdownPreview markdown={markdown} />)

      expect(screen.getByText('H1タイトル')).toBeInTheDocument()
      expect(screen.getByText('H2タイトル')).toBeInTheDocument()
      expect(screen.getByText('H3タイトル')).toBeInTheDocument()
      expect(screen.getByText('H4タイトル')).toBeInTheDocument()
    })

    it('リスト要素が正しくレンダリングされる', () => {
      const markdown = `
- アイテム1
- アイテム2
  - ネストアイテム1
  - ネストアイテム2

1. 番号付きアイテム1
2. 番号付きアイテム2
      `

      render(<MarkdownPreview markdown={markdown} />)

      expect(screen.getByText('アイテム1')).toBeInTheDocument()
      expect(screen.getByText('アイテム2')).toBeInTheDocument()
      expect(screen.getByText('ネストアイテム1')).toBeInTheDocument()
      expect(screen.getByText('番号付きアイテム1')).toBeInTheDocument()
    })

    it('コードブロックが正しくレンダリングされる', () => {
      const markdown = `
\`\`\`javascript
const test = 'Hello World';
console.log(test);
\`\`\`
      `

      render(<MarkdownPreview markdown={markdown} />)

      expect(screen.getByText('javascript')).toBeInTheDocument()
      expect(screen.getByText("const test = 'Hello World';")).toBeInTheDocument()
    })

    it('インラインコードが正しくレンダリングされる', () => {
      const markdown = 'このテキストには `インラインコード` が含まれています。'

      render(<MarkdownPreview markdown={markdown} />)

      expect(screen.getByText('インラインコード')).toBeInTheDocument()
    })

    it('引用ブロックが正しくレンダリングされる', () => {
      const markdown = '> これは引用ブロックです。\n> 複数行の引用も対応しています。'

      render(<MarkdownPreview markdown={markdown} />)

      expect(screen.getByText('これは引用ブロックです。')).toBeInTheDocument()
      expect(screen.getByText('複数行の引用も対応しています。')).toBeInTheDocument()
    })

    it('リンクが正しくレンダリングされる', () => {
      const markdown = '[テストリンク](https://example.com)'

      render(<MarkdownPreview markdown={markdown} />)

      const link = screen.getByText('テストリンク')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', 'https://example.com')
    })

    it('GitHub Flavored Markdown (GFM) の表が正しくレンダリングされる', () => {
      const markdown = `
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| データ1 | データ2 | データ3 |
| データ4 | データ5 | データ6 |
      `

      render(<MarkdownPreview markdown={markdown} />)

      expect(screen.getByText('列1')).toBeInTheDocument()
      expect(screen.getByText('列2')).toBeInTheDocument()
      expect(screen.getByText('データ1')).toBeInTheDocument()
      expect(screen.getByText('データ2')).toBeInTheDocument()
    })

    it('取り消し線テキストが正しくレンダリングされる', () => {
      const markdown = '~~取り消し線テキスト~~'

      render(<MarkdownPreview markdown={markdown} />)

      expect(screen.getByText('取り消し線テキスト')).toBeInTheDocument()
    })
  })

  describe('スタイリング', () => {
    it('カスタムCSSクラスが適用される', () => {
      const markdown = '# テスト'
      const customClassName = 'custom-class'

      const { container } = render(<MarkdownPreview markdown={markdown} className={customClassName} />)

      const element = container.querySelector('.custom-class')
      expect(element).toBeInTheDocument()
    })

    it('カスタム見出しスタイルが適用される', () => {
      const markdown = '## H2テストタイトル'

      render(<MarkdownPreview markdown={markdown} />)

      const h2Element = screen.getByText('H2テストタイトル')
      expect(h2Element).toHaveClass('text-3xl', 'font-bold', 'border-blue-600')
    })

    it('カスタムコードブロックスタイルが適用される', () => {
      const markdown = `
\`\`\`python
print("Hello World")
\`\`\`
      `

      render(<MarkdownPreview markdown={markdown} />)

      const languageLabel = screen.getByText('python')
      expect(languageLabel).toHaveClass('text-gray-300', 'bg-gray-700')
    })

    it('カスタムリンクスタイルが適用される', () => {
      const markdown = '[テストリンク](https://example.com)'

      render(<MarkdownPreview markdown={markdown} />)

      const link = screen.getByText('テストリンク')
      expect(link).toHaveClass('text-blue-600', 'hover:underline')
    })
  })

  describe('複合コンテンツ', () => {
    it('複雑なMarkdownコンテンツが正しくレンダリングされる', () => {
      const complexMarkdown = `
# メインタイトル

## セクション1

これは**太字**テキストです。*斜体*テキストもあります。

### サブセクション

- リストアイテム1
- リストアイテム2
  - ネストアイテム

> 重要な引用文です。

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

詳細は[こちら](https://example.com)をご覧ください。

| 機能 | 状態 |
|------|------|
| 検索 | ✅ |
| ダウンロード | ✅ |
      `

      render(<MarkdownPreview markdown={complexMarkdown} />)

      expect(screen.getByText('メインタイトル')).toBeInTheDocument()
      expect(screen.getByText('セクション1')).toBeInTheDocument()
      expect(screen.getByText('太字')).toBeInTheDocument()
      expect(screen.getByText('斜体')).toBeInTheDocument()
      expect(screen.getByText('重要な引用文です。')).toBeInTheDocument()
      expect(screen.getByText('javascript')).toBeInTheDocument()
      expect(screen.getByText('function greet(name) {')).toBeInTheDocument()
      expect(screen.getByText('こちら')).toBeInTheDocument()
      expect(screen.getByText('機能')).toBeInTheDocument()
      expect(screen.getByText('✅')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('ダウンロードボタンがキーボードでアクセス可能', () => {
      const markdown = '# テスト'
      const onDownload = vi.fn()

      render(<MarkdownPreview markdown={markdown} onDownload={onDownload} />)

      const downloadButton = screen.getByText('ダウンロード')
      downloadButton.focus()

      expect(downloadButton).toHaveFocus()
    })

    it('リンクが適切な属性を持つ', () => {
      const markdown = '[外部リンク](https://example.com)'

      render(<MarkdownPreview markdown={markdown} />)

      const link = screen.getByText('外部リンク')
      expect(link.closest('a')).toHaveAttribute('href', 'https://example.com')
    })

    it('見出し階層が適切に設定されている', () => {
      const markdown = `
# H1タイトル
## H2タイトル
### H3タイトル
      `

      const { container } = render(<MarkdownPreview markdown={markdown} />)

      const h1 = container.querySelector('h1')
      const h2 = container.querySelector('h2')
      const h3 = container.querySelector('h3')

      expect(h1).toBeInTheDocument()
      expect(h2).toBeInTheDocument()
      expect(h3).toBeInTheDocument()
    })
  })

  describe('エラー処理', () => {
    it('不正なMarkdownでもエラーにならない', () => {
      const invalidMarkdown = '### 未閉じの[リンク\n```未閉じのコードブロック'

      expect(() => {
        render(<MarkdownPreview markdown={invalidMarkdown} />)
      }).not.toThrow()
    })

    it('非常に長いMarkdownコンテンツを処理できる', () => {
      const longMarkdown = `# 長いコンテンツ\n\n${'a'.repeat(10000)}`

      expect(() => {
        render(<MarkdownPreview markdown={longMarkdown} />)
      }).not.toThrow()

      expect(screen.getByText('長いコンテンツ')).toBeInTheDocument()
    })

    it('特殊文字を含むMarkdownを処理できる', () => {
      const specialCharsMarkdown = '# 特殊文字テスト\n\n<script>alert("XSS")</script>\n\n&lt;タグ&gt;'

      render(<MarkdownPreview markdown={specialCharsMarkdown} />)

      expect(screen.getByText('特殊文字テスト')).toBeInTheDocument()
      // スクリプトタグはエスケープされて表示される
      expect(screen.getByText('<script>alert("XSS")</script>')).toBeInTheDocument()
    })
  })
})
