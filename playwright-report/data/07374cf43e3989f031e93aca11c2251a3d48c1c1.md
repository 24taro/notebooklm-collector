# Test info

- Name: Storybook E2Eテスト >> 基本的なレスポンシブ動作の確認
- Location: /home/nishioka/Develop/notebooklm-collector/tests/storybook.spec.ts:170:7

# Error details

```
Error: Timed out 30000ms waiting for expect(locator).toBeVisible()

Locator: locator('[data-item-id="components"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 30000ms
  - waiting for locator('[data-item-id="components"]')

    at /home/nishioka/Develop/notebooklm-collector/tests/storybook.spec.ts:180:34
```

# Page snapshot

```yaml
- main:
  - button "Change the background of the preview":
    - img
  - button "Apply a grid to the preview":
    - img
  - button "light":
    - img
    - text: light
  - button "Apply outlines to the preview":
    - img
  - iframe
- button "Components/MarkdownPreview/Docs":
  - img
  - paragraph: Components/MarkdownPreview/Docs
```

# Test source

```ts
   80 |
   81 |   test('Storybookが正常に起動する', async ({ page }) => {
   82 |     // タイトルを確認
   83 |     await expect(page).toHaveTitle(/Storybook/, { timeout: 30000 })
   84 |     
   85 |     // サイドバーのComponents項目を確認
   86 |     const componentsItem = page.locator('[data-item-id="components"]')
   87 |     await expect(componentsItem).toBeVisible({ timeout: 30000 })
   88 |   })
   89 |
   90 |   test('コンポーネントツリーの基本構造を確認', async ({ page }) => {
   91 |     // Componentsが表示されることを確認
   92 |     const componentsItem = page.locator('[data-item-id="components"]')
   93 |     await expect(componentsItem).toBeVisible({ timeout: 30000 })
   94 |     
   95 |     // MarkdownPreviewコンポーネントが存在することを確認
   96 |     const markdownPreview = page.locator('[data-item-id="components-markdownpreview"]')
   97 |     await expect(markdownPreview).toBeVisible({ timeout: 30000 })
   98 |     
   99 |     // SlackAdvancedFiltersコンポーネントが存在することを確認
  100 |     const slackFilters = page.locator('[data-item-id="components-slackadvancedfilters"]')
  101 |     await expect(slackFilters).toBeVisible({ timeout: 30000 })
  102 |   })
  103 |
  104 |   test('SlackAdvancedFiltersコンポーネントの基本動作', async ({ page }) => {
  105 |     // コンポーネントを展開
  106 |     const expanded = await expandComponent(page, 'components-slackadvancedfilters')
  107 |     expect(expanded).toBeTruthy()
  108 |     
  109 |     // Defaultストーリーが表示されることを確認
  110 |     const defaultStory = page.locator('[data-item-id="components-slackadvancedfilters--default"]')
  111 |     await expect(defaultStory).toBeVisible({ timeout: 20000 })
  112 |   })
  113 |
  114 |   test('SlackAdvancedFilters Defaultストーリーの表示', async ({ page }) => {
  115 |     // コンポーネントを展開
  116 |     await expandComponent(page, 'components-slackadvancedfilters')
  117 |     
  118 |     // Defaultストーリーをクリック
  119 |     const defaultStory = page.locator('[data-item-id="components-slackadvancedfilters--default"]')
  120 |     await defaultStory.waitFor({ state: 'visible', timeout: 20000 })
  121 |     await defaultStory.click()
  122 |     
  123 |     // iframeの内容を確認
  124 |     const iframe = await waitForIframeContent(page)
  125 |     if (iframe) {
  126 |       // ボタンが表示されることを確認
  127 |       const button = iframe.locator('button').filter({ hasText: 'もっと詳細な条件を追加する' })
  128 |       const buttonCount = await button.count()
  129 |       expect(buttonCount).toBeGreaterThan(0)
  130 |     }
  131 |   })
  132 |
  133 |   test('SlackAdvancedFilters Expandedストーリーの表示', async ({ page }) => {
  134 |     // コンポーネントを展開
  135 |     await expandComponent(page, 'components-slackadvancedfilters')
  136 |     
  137 |     // Expandedストーリーをクリック
  138 |     const expandedStory = page.locator('[data-item-id="components-slackadvancedfilters--expanded"]')
  139 |     await expandedStory.waitFor({ state: 'visible', timeout: 20000 })
  140 |     await expandedStory.click()
  141 |     
  142 |     // iframeの内容を確認
  143 |     const iframe = await waitForIframeContent(page)
  144 |     if (iframe) {
  145 |       // 入力フィールドが表示されることを確認
  146 |       const inputs = await iframe.locator('input').count()
  147 |       expect(inputs).toBeGreaterThan(0)
  148 |     }
  149 |   })
  150 |
  151 |   test('ストーリー間のナビゲーション', async ({ page }) => {
  152 |     // SlackAdvancedFiltersを展開
  153 |     await expandComponent(page, 'components-slackadvancedfilters')
  154 |     
  155 |     // Defaultストーリーに移動
  156 |     const defaultStory = page.locator('[data-item-id="components-slackadvancedfilters--default"]')
  157 |     await defaultStory.click()
  158 |     await page.waitForTimeout(1000)
  159 |     
  160 |     // Expandedストーリーに移動
  161 |     const expandedStory = page.locator('[data-item-id="components-slackadvancedfilters--expanded"]')
  162 |     await expandedStory.click()
  163 |     await page.waitForTimeout(1000)
  164 |     
  165 |     // 両方のストーリーが存在することを確認
  166 |     await expect(defaultStory).toBeVisible()
  167 |     await expect(expandedStory).toBeVisible()
  168 |   })
  169 |
  170 |   test('基本的なレスポンシブ動作の確認', async ({ page }) => {
  171 |     // 現在のビューでコンポーネントが表示されることを確認
  172 |     const componentsItem = page.locator('[data-item-id="components"]')
  173 |     await expect(componentsItem).toBeVisible({ timeout: 30000 })
  174 |     
  175 |     // モバイルサイズに変更
  176 |     await page.setViewportSize({ width: 375, height: 667 })
  177 |     await page.waitForTimeout(1000)
  178 |     
  179 |     // モバイルビューでもコンポーネントが表示されることを確認
> 180 |     await expect(componentsItem).toBeVisible({ timeout: 30000 })
      |                                  ^ Error: Timed out 30000ms waiting for expect(locator).toBeVisible()
  181 |   })
  182 |
  183 |   test('ページのパフォーマンス基準を満たす', async ({ page }) => {
  184 |     // ページの読み込み完了を確認
  185 |     await page.waitForLoadState('networkidle', { timeout: 30000 })
  186 |     
  187 |     // Storybookのメインコンテンツが表示されることを確認
  188 |     const mainContent = page.locator('main')
  189 |     await expect(mainContent).toBeVisible({ timeout: 10000 })
  190 |     
  191 |     // エラーがないことを確認
  192 |     const errorElements = await page.locator('.error, .exception').count()
  193 |     expect(errorElements).toBe(0)
  194 |   })
  195 | })
```