# Test info

- Name: Storybook動作確認 >> MarkdownPreview - Default Storyが表示される
- Location: /Users/nishioka/Develop/notebooklm-collector/tests/storybook.spec.ts:17:7

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: locator('h1:has-text("サンプルドキュメント")') resolved to 3 elements:
    1) <h1>サンプルドキュメント</h1> aka getByRole('heading', { name: 'サンプルドキュメント' })
    2) <h1>サンプルドキュメント</h1> aka locator('#story--components-markdownpreview--default--primary-inner').getByText('サンプルドキュメント')
    3) <h1>サンプルドキュメント</h1> aka locator('#story--components-markdownpreview--default-inner').getByText('サンプルドキュメント')

Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('#storybook-preview-iframe').contentFrame().locator('h1:has-text("サンプルドキュメント")')

    at /Users/nishioka/Develop/notebooklm-collector/tests/storybook.spec.ts:39:63
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
    - code: ⌘ K
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
- button "Change addon orientation [⌥ D]":
  - img
- button "Hide addons [⌥ A]":
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
   1 | import { type Page, expect, test } from '@playwright/test'
   2 |
   3 | // テストのタイムアウトを延長
   4 | test.setTimeout(60000)
   5 |
   6 | test.describe('Storybook動作確認', () => {
   7 |   test('Storybookが正常に起動する', async ({ page }: { page: Page }) => {
   8 |     await page.goto('/')
   9 |
   10 |     // Storybookのタイトルが表示されることを確認
   11 |     await expect(page).toHaveTitle(/Storybook/)
   12 |
   13 |     // サイドバーが表示されることを確認
   14 |     await expect(page.locator('[data-item-id="components"]')).toBeVisible()
   15 |   })
   16 |
   17 |   test('MarkdownPreview - Default Storyが表示される', async ({ page }: { page: Page }) => {
   18 |     await page.goto('/')
   19 |
   20 |     // サイドバーが表示されるまで待機
   21 |     await page.locator('[data-item-id="components"]').waitFor({ state: 'visible' })
   22 |
   23 |     // MarkdownPreviewコンポーネントを展開
   24 |     await page.locator('[data-item-id="components-markdownpreview"]').click()
   25 |     await page.waitForTimeout(500) // アニメーション待機
   26 |
   27 |     // Default Storyを選択
   28 |     await page.locator('[data-item-id="components-markdownpreview--default"]').click()
   29 |     await page.waitForTimeout(1000) // iframeロード待機
   30 |
   31 |     // プレビューエリアでMarkdownPreviewコンポーネントが表示されることを確認
   32 |     const iframe = page.frameLocator('#storybook-preview-iframe')
   33 |     // iframeのコンテンツがロードされるまで待機
   34 |     await iframe.locator('body').waitFor({ state: 'attached' })
   35 |     // h2タグのプレビュータイトルを確認
   36 |     await expect(iframe.locator('h2').filter({ hasText: 'プレビュー' }).first()).toBeVisible()
   37 |
   38 |     // サンプルMarkdownの内容が表示されることを確認
>  39 |     await expect(iframe.locator('h1:has-text("サンプルドキュメント")')).toBeVisible()
      |                                                               ^ Error: expect.toBeVisible: Error: strict mode violation: locator('h1:has-text("サンプルドキュメント")') resolved to 3 elements:
   40 |     await expect(iframe.locator('h2:has-text("機能一覧")')).toBeVisible()
   41 |   })
   42 |
   43 |   test('MarkdownPreview - Empty Storyが表示される', async ({ page }: { page: Page }) => {
   44 |     await page.goto('/')
   45 |
   46 |     // Empty Storyを選択
   47 |     await page.locator('[data-item-id="components-markdownpreview--empty"]').click()
   48 |
   49 |     // 空状態のメッセージが表示されることを確認
   50 |     const iframe = page.frameLocator('#storybook-preview-iframe')
   51 |     await expect(iframe.locator('p:has-text("ここにMarkdownプレビューが表示されます。")')).toBeVisible()
   52 |   })
   53 |
   54 |   test('SlackAdvancedFilters - Default Storyが表示される', async ({ page }: { page: Page }) => {
   55 |     await page.goto('/')
   56 |
   57 |     // SlackAdvancedFiltersコンポーネントを展開
   58 |     await page.locator('[data-item-id="components-slackadvancedfilters"]').click()
   59 |
   60 |     // Default Storyを選択
   61 |     await page.locator('[data-item-id="components-slackadvancedfilters--default"]').click()
   62 |
   63 |     // プレビューエリアでコンポーネントが表示されることを確認
   64 |     const iframe = page.frameLocator('#storybook-preview-iframe')
   65 |     // iframeのコンテンツがロードされるまで待機
   66 |     await iframe.locator('body').waitFor({ state: 'attached' })
   67 |     await expect(iframe.locator('button').filter({ hasText: 'もっと詳細な条件を追加する' }).first()).toBeVisible()
   68 |   })
   69 |
   70 |   test('SlackAdvancedFilters - Expanded Storyでフィルターが展開される', async ({ page }: { page: Page }) => {
   71 |     await page.goto('/')
   72 |
   73 |     // サイドバーが表示されるまで待機
   74 |     await page.locator('[data-item-id="components"]').waitFor({ state: 'visible' })
   75 |
   76 |     // SlackAdvancedFiltersコンポーネントを展開
   77 |     await page.locator('[data-item-id="components-slackadvancedfilters"]').click()
   78 |     await page.waitForTimeout(500) // アニメーション待機
   79 |
   80 |     // Expanded Storyを選択
   81 |     await page.locator('[data-item-id="components-slackadvancedfilters--expanded"]').click()
   82 |     await page.waitForTimeout(1000) // iframeロード待機
   83 |
   84 |     // フィルター入力フィールドが表示されることを確認
   85 |     const iframe = page.frameLocator('#storybook-preview-iframe')
   86 |     // iframeのコンテンツがロードされるまで待機
   87 |     await iframe.locator('body').waitFor({ state: 'attached' })
   88 |     await expect(iframe.locator('input[placeholder="#general"]')).toBeVisible()
   89 |     await expect(iframe.locator('input[placeholder="@user"]')).toBeVisible()
   90 |     await expect(iframe.locator('input[type="date"]').first()).toBeVisible()
   91 |   })
   92 |
   93 |
   94 |   test('ダウンロードボタンが正常に動作する', async ({ page }: { page: Page }) => {
   95 |     await page.goto('/')
   96 |
   97 |     // MarkdownPreview Default Storyを表示
   98 |     await page.locator('[data-item-id="components-markdownpreview--default"]').click()
   99 |
  100 |     const iframe = page.frameLocator('#storybook-preview-iframe')
  101 |
  102 |     // ダウンロードボタンが表示されることを確認
  103 |     // iframeのコンテンツがロードされるまで待機
  104 |     await iframe.locator('body').waitFor({ state: 'attached' })
  105 |     const downloadButton = iframe.locator('button').filter({ hasText: 'ダウンロード' }).first()
  106 |     await expect(downloadButton).toBeVisible()
  107 |
  108 |     // ボタンがクリック可能であることを確認
  109 |     await expect(downloadButton).toBeEnabled()
  110 |   })
  111 |
  112 | })
  113 |
```