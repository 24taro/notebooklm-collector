# Test info

- Name: Storybook動作確認 >> コードブロックが適切にシンタックスハイライトされる
- Location: /home/nishioka/Develop/notebooklm-collector-2/tests/storybook.spec.ts:125:7

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: locator('pre') resolved to 11 elements:
    1) <pre class="sb-errordisplay_code">…</pre> aka locator('.sb-errordisplay_code')
    2) <pre>…</pre> aka locator('pre').filter({ hasText: 'typescriptinterface User { id: string name: string email: string createdAt:' })
    3) <pre class="p-4 text-sm leading-relaxed overflow-x-auto text-gray-100">…</pre> aka locator('pre').filter({ hasText: 'typescriptinterface User { id: string name: string email: string createdAt:' }).locator('pre')
    4) <pre>…</pre> aka locator('pre').filter({ hasText: 'tsximport { useState,' })
    5) <pre class="p-4 text-sm leading-relaxed overflow-x-auto text-gray-100">…</pre> aka locator('pre').filter({ hasText: 'tsximport { useState,' }).locator('pre')
    6) <pre>…</pre> aka locator('pre').filter({ hasText: 'css.markdown-preview { max-' })
    7) <pre class="p-4 text-sm leading-relaxed overflow-x-auto text-gray-100">…</pre> aka locator('pre').filter({ hasText: 'css.markdown-preview { max-' }).locator('pre')
    8) <pre>…</pre> aka locator('pre').filter({ hasText: 'json{ "name": "notebooklm-' })
    9) <pre class="p-4 text-sm leading-relaxed overflow-x-auto text-gray-100">…</pre> aka locator('pre').filter({ hasText: 'json{ "name": "notebooklm-' }).locator('pre')
    10) <pre>…</pre> aka locator('pre').filter({ hasText: 'typescriptinterface User { id: string name: string email: string } function' })
    ...

Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('#storybook-preview-iframe').contentFrame().locator('pre')

    at /home/nishioka/Develop/notebooklm-collector-2/tests/storybook.spec.ts:134:41
```

# Page snapshot

```yaml
- main:
  - button "Remount component":
    - img
  - button "Zoom in":
    - img
  - button "Zoom out":
    - img
  - button "Reset zoom":
    - img
  - button "Change the background of the preview":
    - img
  - button "Apply a grid to the preview":
    - img
  - button "light":
    - img
    - text: light
  - button "Enable measure":
    - img
  - button "Apply outlines to the preview":
    - img
  - button "Vision simulator":
    - img
  - img
  - button "Change the size of the preview":
    - img
  - button "Go full screen":
    - img
  - link "Open canvas in new tab":
    - /url: iframe.html?globals=&args=&id=components-markdownpreview--code-heavy-content
    - img
  - button "Copy canvas link":
    - img
  - link "Skip to sidebar":
    - /url: "#components-markdownpreview--code-heavy-content"
  - iframe
- navigation:
  - link "Skip to canvas":
    - /url: "#storybook-preview-wrapper"
  - link "NotebookLM Collector":
    - /url: https://github.com/sotaroNishioka/notebooklm-collector
  - button "Shortcuts":
    - img
  - text: Search for components
  - combobox "Search for components":
    - img
    - searchbox "Search for components"
    - code: ⌃ K
    - button "Tag filters":
      - img
  - button:
    - img
  - img
  - button "Components" [expanded]:
    - img
    - text: Components
  - button "Collapse":
    - img
  - button "MarkdownPreview" [expanded]:
    - img
    - img
    - text: MarkdownPreview
  - link "Docs":
    - /url: /?path=/docs/components-markdownpreview--docs
    - img
    - text: Docs
  - link "Default":
    - /url: /?path=/story/components-markdownpreview--default
    - img
    - text: Default
  - link "Empty":
    - /url: /?path=/story/components-markdownpreview--empty
    - img
    - text: Empty
  - link "Custom Empty Message":
    - /url: /?path=/story/components-markdownpreview--custom-empty-message
    - img
    - text: Custom Empty Message
  - link "Loading":
    - /url: /?path=/story/components-markdownpreview--loading
    - img
    - text: Loading
  - link "Short Content":
    - /url: /?path=/story/components-markdownpreview--short-content
    - img
    - text: Short Content
  - link "Long Content":
    - /url: /?path=/story/components-markdownpreview--long-content
    - img
    - text: Long Content
  - link "Code Heavy Content":
    - /url: /?path=/story/components-markdownpreview--code-heavy-content
    - img
    - text: Code Heavy Content
  - link "Skip to canvas":
    - /url: "#storybook-preview-wrapper"
  - link "No Download":
    - /url: /?path=/story/components-markdownpreview--no-download
    - img
    - text: No Download
  - link "No Title":
    - /url: /?path=/story/components-markdownpreview--no-title
    - img
    - text: No Title
  - link "Custom Styling":
    - /url: /?path=/story/components-markdownpreview--custom-styling
    - img
    - text: Custom Styling
  - button "SlackAdvancedFilters":
    - img
    - img
    - text: SlackAdvancedFilters
- tablist:
  - tab "Controls 5"
  - tab "Actions"
  - tab "Accessibility"
- button "Change addon orientation [alt D]":
  - img
- button "Hide addons [alt A]":
  - img
- table:
  - rowgroup:
    - row "Name Control":
      - cell "Name"
      - cell "Control":
        - text: Control
        - button "Reset controls"
  - rowgroup:
    - row:
      - cell "markdown*"
      - cell:
        - textbox: "# コード例集 ## TypeScript型定義 ```typescript interface User { id: string name: string email: string createdAt: Date profile?: { avatar?: string bio?: string } } type UserResponse = { user: User permissions: string[] } ``` ## React Hook例 ```tsx import { useState, useEffect } from 'react' function useApiData<T>(url: string) { const [data, setData] = useState<T | null>(null) const [loading, setLoading] = useState(false) const [error, setError] = useState<string | null>(null) useEffect(() => { async function fetchData() { setLoading(true) try { const response = await fetch(url) const result = await response.json() setData(result) } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error') } finally { setLoading(false) } } fetchData() }, [url]) return { data, loading, error } } ``` ## CSS例 ```css .markdown-preview { max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; } .code-block { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; } ``` ## JSON設定例 ```json { \"name\": \"notebooklm-collector\", \"version\": \"1.0.0\", \"scripts\": { \"dev\": \"next dev\", \"build\": \"next build\", \"start\": \"next start\" }, \"dependencies\": { \"react\": \"^19.0.0\", \"next\": \"15.3.2\" } } ```"
    - row "title コード例集":
      - cell "title"
      - cell "コード例集":
        - textbox: コード例集
    - row "onDownload -":
      - cell "onDownload"
      - cell "-"
    - row "downloadFileName code-examples.md":
      - cell "downloadFileName"
      - cell "code-examples.md":
        - textbox: code-examples.md
    - row "className Set string":
      - cell "className"
      - cell "Set string":
        - button "Set string"
    - row "emptyMessage Set string":
      - cell "emptyMessage"
      - cell "Set string":
        - button "Set string"
```

# Test source

```ts
   34 |     
   35 |     // Empty Storyを選択
   36 |     await page.locator('[data-item-id="components-markdownpreview--empty"]').click()
   37 |     
   38 |     // 空状態のメッセージが表示されることを確認
   39 |     const iframe = page.frameLocator('#storybook-preview-iframe')
   40 |     await expect(iframe.locator('p:has-text("ここにMarkdownプレビューが表示されます。")')).toBeVisible()
   41 |   })
   42 |
   43 |   test('SlackAdvancedFilters - Default Storyが表示される', async ({ page }) => {
   44 |     await page.goto('/')
   45 |     
   46 |     // SlackAdvancedFiltersコンポーネントを展開
   47 |     await page.locator('[data-item-id="components-slackadvancedfilters"]').click()
   48 |     
   49 |     // Default Storyを選択
   50 |     await page.locator('[data-item-id="components-slackadvancedfilters--default"]').click()
   51 |     
   52 |     // プレビューエリアでコンポーネントが表示されることを確認
   53 |     const iframe = page.frameLocator('#storybook-preview-iframe')
   54 |     await expect(iframe.locator('button:has-text("もっと詳細な条件を追加する")')).toBeVisible()
   55 |   })
   56 |
   57 |   test('SlackAdvancedFilters - Expanded Storyでフィルターが展開される', async ({ page }) => {
   58 |     await page.goto('/')
   59 |     
   60 |     // Expanded Storyを選択
   61 |     await page.locator('[data-item-id="components-slackadvancedfilters--expanded"]').click()
   62 |     
   63 |     // フィルター入力フィールドが表示されることを確認
   64 |     const iframe = page.frameLocator('#storybook-preview-iframe')
   65 |     await expect(iframe.locator('input[placeholder="#general"]')).toBeVisible()
   66 |     await expect(iframe.locator('input[placeholder="@user"]')).toBeVisible()
   67 |     await expect(iframe.locator('input[type="date"]').first()).toBeVisible()
   68 |   })
   69 |
   70 |   test('アクセシビリティ - タブキーでのフォーカス移動が正常に動作する', async ({ page }) => {
   71 |     await page.goto('/')
   72 |     
   73 |     // SlackAdvancedFilters Expanded Storyに移動
   74 |     await page.locator('[data-item-id="components-slackadvancedfilters--expanded"]').click()
   75 |     
   76 |     const iframe = page.frameLocator('#storybook-preview-iframe')
   77 |     
   78 |     // Tabキーでフォーカス移動をテスト
   79 |     await iframe.locator('body').click()
   80 |     await page.keyboard.press('Tab')
   81 |     
   82 |     // 最初の入力フィールドにフォーカスが当たることを確認
   83 |     await expect(iframe.locator('input[placeholder="#general"]')).toBeFocused()
   84 |     
   85 |     // 次の入力フィールドにフォーカスが移動することを確認
   86 |     await page.keyboard.press('Tab')
   87 |     await expect(iframe.locator('input[placeholder="@user"]')).toBeFocused()
   88 |   })
   89 |
   90 |   test('レスポンシブ - モバイル表示で適切にレイアウトされる', async ({ page }) => {
   91 |     // モバイルサイズに変更
   92 |     await page.setViewportSize({ width: 375, height: 667 })
   93 |     
   94 |     await page.goto('/')
   95 |     
   96 |     // MarkdownPreview Default Storyを表示
   97 |     await page.locator('[data-item-id="components-markdownpreview--default"]').click()
   98 |     
   99 |     const iframe = page.frameLocator('#storybook-preview-iframe')
  100 |     
  101 |     // モバイルでも適切に表示されることを確認
  102 |     await expect(iframe.locator('h1:has-text("サンプルドキュメント")')).toBeVisible()
  103 |     
  104 |     // コンテナが適切な幅で表示されることを確認
  105 |     const container = iframe.locator('.max-w-3xl')
  106 |     await expect(container).toBeVisible()
  107 |   })
  108 |
  109 |   test('ダウンロードボタンが正常に動作する', async ({ page }) => {
  110 |     await page.goto('/')
  111 |     
  112 |     // MarkdownPreview Default Storyを表示
  113 |     await page.locator('[data-item-id="components-markdownpreview--default"]').click()
  114 |     
  115 |     const iframe = page.frameLocator('#storybook-preview-iframe')
  116 |     
  117 |     // ダウンロードボタンが表示されることを確認
  118 |     const downloadButton = iframe.locator('button:has-text("ダウンロード")')
  119 |     await expect(downloadButton).toBeVisible()
  120 |     
  121 |     // ボタンがクリック可能であることを確認
  122 |     await expect(downloadButton).toBeEnabled()
  123 |   })
  124 |
  125 |   test('コードブロックが適切にシンタックスハイライトされる', async ({ page }) => {
  126 |     await page.goto('/')
  127 |     
  128 |     // CodeHeavyContent Storyを表示
  129 |     await page.locator('[data-item-id="components-markdownpreview--code-heavy-content"]').click()
  130 |     
  131 |     const iframe = page.frameLocator('#storybook-preview-iframe')
  132 |     
  133 |     // コードブロックが適切に表示されることを確認
> 134 |     await expect(iframe.locator('pre')).toBeVisible()
      |                                         ^ Error: expect.toBeVisible: Error: strict mode violation: locator('pre') resolved to 11 elements:
  135 |     await expect(iframe.locator('code')).toBeVisible()
  136 |     
  137 |     // 言語ラベルが表示されることを確認
  138 |     await expect(iframe.locator('.bg-gray-700:has-text("typescript")')).toBeVisible()
  139 |   })
  140 | })
```