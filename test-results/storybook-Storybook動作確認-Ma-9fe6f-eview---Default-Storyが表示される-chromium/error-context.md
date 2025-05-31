# Test info

- Name: Storybook動作確認 >> MarkdownPreview - Default Storyが表示される
- Location: /home/nishioka/Develop/notebooklm-collector-2/tests/storybook.spec.ts:14:7

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: locator('h2:has-text("プレビュー")') resolved to 2 elements:
    1) <h2 class="text-xl font-semibold text-gray-800">プレビュー</h2> aka getByRole('heading', { name: 'プレビュー' })
    2) <h2 class="text-xl font-semibold text-gray-800">プレビュー</h2> aka locator('#story--components-markdownpreview--default--primary-inner').getByText('プレビュー')

Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('#storybook-preview-iframe').contentFrame().locator('h2:has-text("プレビュー")')

    at /home/nishioka/Develop/notebooklm-collector-2/tests/storybook.spec.ts:25:58
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
    - /url: iframe.html?globals=&args=&id=components-markdownpreview--default
    - img
  - button "Copy canvas link":
    - img
  - link "Skip to sidebar":
    - /url: "#components-markdownpreview--default"
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
  - link "Skip to canvas":
    - /url: "#storybook-preview-wrapper"
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
    - 'row "markdown* # サンプルドキュメント これは基本的なMarkdownのサンプルです。 ## 機能一覧 - **太字テキスト** - *斜体テキスト* - `インラインコード` ### コードブロック例 ```typescript interface User { id: string name: string email: string } function createUser(userData: User): User { return { ...userData, id: generateId(), } } ``` > これは引用ブロックです。重要な情報を強調する時に使用します。 [リンクの例](https://example.com)"':
      - cell "markdown*"
      - 'cell "# サンプルドキュメント これは基本的なMarkdownのサンプルです。 ## 機能一覧 - **太字テキスト** - *斜体テキスト* - `インラインコード` ### コードブロック例 ```typescript interface User { id: string name: string email: string } function createUser(userData: User): User { return { ...userData, id: generateId(), } } ``` > これは引用ブロックです。重要な情報を強調する時に使用します。 [リンクの例](https://example.com)"':
        - textbox: "# サンプルドキュメント これは基本的なMarkdownのサンプルです。 ## 機能一覧 - **太字テキスト** - *斜体テキスト* - `インラインコード` ### コードブロック例 ```typescript interface User { id: string name: string email: string } function createUser(userData: User): User { return { ...userData, id: generateId(), } } ``` > これは引用ブロックです。重要な情報を強調する時に使用します。 [リンクの例](https://example.com)"
    - row "title プレビュー":
      - cell "title"
      - cell "プレビュー":
        - textbox: プレビュー
    - row "onDownload -":
      - cell "onDownload"
      - cell "-"
    - row "downloadFileName sample.md":
      - cell "downloadFileName"
      - cell "sample.md":
        - textbox: sample.md
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
   1 | import { test, expect } from '@playwright/test'
   2 |
   3 | test.describe('Storybook動作確認', () => {
   4 |   test('Storybookが正常に起動する', async ({ page }) => {
   5 |     await page.goto('/')
   6 |     
   7 |     // Storybookのタイトルが表示されることを確認
   8 |     await expect(page).toHaveTitle(/Storybook/)
   9 |     
   10 |     // サイドバーが表示されることを確認
   11 |     await expect(page.locator('[data-item-id="components"]')).toBeVisible()
   12 |   })
   13 |
   14 |   test('MarkdownPreview - Default Storyが表示される', async ({ page }) => {
   15 |     await page.goto('/')
   16 |     
   17 |     // MarkdownPreviewコンポーネントを展開
   18 |     await page.locator('[data-item-id="components-markdownpreview"]').click()
   19 |     
   20 |     // Default Storyを選択
   21 |     await page.locator('[data-item-id="components-markdownpreview--default"]').click()
   22 |     
   23 |     // プレビューエリアでMarkdownPreviewコンポーネントが表示されることを確認
   24 |     const iframe = page.frameLocator('#storybook-preview-iframe')
>  25 |     await expect(iframe.locator('h2:has-text("プレビュー")')).toBeVisible()
      |                                                          ^ Error: expect.toBeVisible: Error: strict mode violation: locator('h2:has-text("プレビュー")') resolved to 2 elements:
   26 |     
   27 |     // サンプルMarkdownの内容が表示されることを確認
   28 |     await expect(iframe.locator('h1:has-text("サンプルドキュメント")')).toBeVisible()
   29 |     await expect(iframe.locator('h2:has-text("機能一覧")')).toBeVisible()
   30 |   })
   31 |
   32 |   test('MarkdownPreview - Empty Storyが表示される', async ({ page }) => {
   33 |     await page.goto('/')
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
```