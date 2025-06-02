# Test info

- Name: Storybook動作確認 >> SlackAdvancedFilters - Default Storyが表示される
- Location: /home/nishioka/Develop/notebooklm-collector-2/tests/storybook.spec.ts:43:7

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: locator('button:has-text("もっと詳細な条件を追加する")') resolved to 2 elements:
    1) <button type="button" class="text-sm text-blue-600 hover:text-blue-800 focus:outline-none">もっと詳細な条件を追加する ▼</button> aka getByRole('button', { name: 'もっと詳細な条件を追加する ▼' })
    2) <button type="button" class="text-sm text-blue-600 hover:text-blue-800 focus:outline-none">もっと詳細な条件を追加する ▼</button> aka locator('#story--components-slackadvancedfilters--default--primary-inner').getByText('もっと詳細な条件を追加する ▼')

Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('#storybook-preview-iframe').contentFrame().locator('button:has-text("もっと詳細な条件を追加する")')

    at /home/nishioka/Develop/notebooklm-collector-2/tests/storybook.spec.ts:54:70
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
    - /url: iframe.html?globals=&args=&id=components-slackadvancedfilters--default
    - img
  - button "Copy canvas link":
    - img
  - link "Skip to sidebar":
    - /url: "#components-slackadvancedfilters--default"
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
  - button "MarkdownPreview":
    - img
    - img
    - text: MarkdownPreview
  - button "SlackAdvancedFilters" [expanded]:
    - img
    - img
    - text: SlackAdvancedFilters
  - link "Docs":
    - /url: /?path=/docs/components-slackadvancedfilters--docs
    - img
    - text: Docs
  - link "Default":
    - /url: /?path=/story/components-slackadvancedfilters--default
    - img
    - text: Default
  - link "Skip to canvas":
    - /url: "#storybook-preview-wrapper"
  - link "Expanded":
    - /url: /?path=/story/components-slackadvancedfilters--expanded
    - img
    - text: Expanded
  - link "With Values":
    - /url: /?path=/story/components-slackadvancedfilters--with-values
    - img
    - text: With Values
  - link "Development Team Filter":
    - /url: /?path=/story/components-slackadvancedfilters--development-team-filter
    - img
    - text: Development Team Filter
  - link "Project Management Filter":
    - /url: /?path=/story/components-slackadvancedfilters--project-management-filter
    - img
    - text: Project Management Filter
  - link "Disabled":
    - /url: /?path=/story/components-slackadvancedfilters--disabled
    - img
    - text: Disabled
  - link "Channel Only":
    - /url: /?path=/story/components-slackadvancedfilters--channel-only
    - img
    - text: Channel Only
  - link "Author Only":
    - /url: /?path=/story/components-slackadvancedfilters--author-only
    - img
    - text: Author Only
  - link "Date Range Only":
    - /url: /?path=/story/components-slackadvancedfilters--date-range-only
    - img
    - text: Date Range Only
  - link "Weekly Range":
    - /url: /?path=/story/components-slackadvancedfilters--weekly-range
    - img
    - text: Weekly Range
  - link "Single Day":
    - /url: /?path=/story/components-slackadvancedfilters--single-day
    - img
    - text: Single Day
  - link "Complex Channel Names":
    - /url: /?path=/story/components-slackadvancedfilters--complex-channel-names
    - img
    - text: Complex Channel Names
  - link "Invalid Date Range":
    - /url: /?path=/story/components-slackadvancedfilters--invalid-date-range
    - img
    - text: Invalid Date Range
- tablist:
  - tab "Controls 6"
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
    - row "showAdvanced* showAdvanced":
      - cell "showAdvanced*"
      - cell "showAdvanced":
        - switch "showAdvanced"
    - row "onToggleAdvanced* -":
      - cell "onToggleAdvanced*"
      - cell "-"
    - row "channel*":
      - cell "channel*"
      - cell:
        - textbox
    - row "onChannelChange* -":
      - cell "onChannelChange*"
      - cell "-"
    - row "author*":
      - cell "author*"
      - cell:
        - textbox
    - row "onAuthorChange* -":
      - cell "onAuthorChange*"
      - cell "-"
    - row "startDate*":
      - cell "startDate*"
      - cell:
        - textbox
        - textbox
    - row "onStartDateChange* -":
      - cell "onStartDateChange*"
      - cell "-"
    - row "endDate*":
      - cell "endDate*"
      - cell:
        - textbox
        - textbox
    - row "onEndDateChange* -":
      - cell "onEndDateChange*"
      - cell "-"
    - row "disabled disabled":
      - cell "disabled"
      - cell "disabled":
        - switch "disabled"
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
   25 |     await expect(iframe.locator('h2:has-text("プレビュー")')).toBeVisible()
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
>  54 |     await expect(iframe.locator('button:has-text("もっと詳細な条件を追加する")')).toBeVisible()
      |                                                                      ^ Error: expect.toBeVisible: Error: strict mode violation: locator('button:has-text("もっと詳細な条件を追加する")') resolved to 2 elements:
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
  134 |     await expect(iframe.locator('pre')).toBeVisible()
  135 |     await expect(iframe.locator('code')).toBeVisible()
  136 |     
  137 |     // 言語ラベルが表示されることを確認
  138 |     await expect(iframe.locator('.bg-gray-700:has-text("typescript")')).toBeVisible()
  139 |   })
  140 | })
```