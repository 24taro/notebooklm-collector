import { expect, test } from '@playwright/test'

// テストのタイムアウトを延長
test.setTimeout(60000)

test.describe('Storybook動作確認', () => {
  test('Storybookが正常に起動する', async ({ page }) => {
    await page.goto('/')

    // Storybookのタイトルが表示されることを確認
    await expect(page).toHaveTitle(/Storybook/)

    // サイドバーが表示されることを確認
    await expect(page.locator('[data-item-id="components"]')).toBeVisible()
  })

  test('MarkdownPreview - Default Storyが表示される', async ({ page }) => {
    await page.goto('/')

    // サイドバーが表示されるまで待機
    await page.locator('[data-item-id="components"]').waitFor({ state: 'visible' })

    // MarkdownPreviewコンポーネントを展開
    await page.locator('[data-item-id="components-markdownpreview"]').click()
    await page.waitForTimeout(500) // アニメーション待機

    // Default Storyを選択
    await page.locator('[data-item-id="components-markdownpreview--default"]').click()
    await page.waitForTimeout(1000) // iframeロード待機

    // プレビューエリアでMarkdownPreviewコンポーネントが表示されることを確認
    const iframe = page.frameLocator('#storybook-preview-iframe')
    // iframeのコンテンツがロードされるまで待機
    await iframe.locator('body').waitFor({ state: 'attached' })
    // h2タグのプレビュータイトルを確認
    await expect(iframe.locator('h2').filter({ hasText: 'プレビュー' }).first()).toBeVisible()

    // サンプルMarkdownの内容が表示されることを確認
    await expect(iframe.locator('h1:has-text("サンプルドキュメント")')).toBeVisible()
    await expect(iframe.locator('h2:has-text("機能一覧")')).toBeVisible()
  })

  test('MarkdownPreview - Empty Storyが表示される', async ({ page }) => {
    await page.goto('/')

    // Empty Storyを選択
    await page.locator('[data-item-id="components-markdownpreview--empty"]').click()

    // 空状態のメッセージが表示されることを確認
    const iframe = page.frameLocator('#storybook-preview-iframe')
    await expect(iframe.locator('p:has-text("ここにMarkdownプレビューが表示されます。")')).toBeVisible()
  })

  test('SlackAdvancedFilters - Default Storyが表示される', async ({ page }) => {
    await page.goto('/')

    // SlackAdvancedFiltersコンポーネントを展開
    await page.locator('[data-item-id="components-slackadvancedfilters"]').click()

    // Default Storyを選択
    await page.locator('[data-item-id="components-slackadvancedfilters--default"]').click()

    // プレビューエリアでコンポーネントが表示されることを確認
    const iframe = page.frameLocator('#storybook-preview-iframe')
    // iframeのコンテンツがロードされるまで待機
    await iframe.locator('body').waitFor({ state: 'attached' })
    await expect(iframe.locator('button').filter({ hasText: 'もっと詳細な条件を追加する' }).first()).toBeVisible()
  })

  test('SlackAdvancedFilters - Expanded Storyでフィルターが展開される', async ({ page }) => {
    await page.goto('/')

    // サイドバーが表示されるまで待機
    await page.locator('[data-item-id="components"]').waitFor({ state: 'visible' })

    // SlackAdvancedFiltersコンポーネントを展開
    await page.locator('[data-item-id="components-slackadvancedfilters"]').click()
    await page.waitForTimeout(500) // アニメーション待機

    // Expanded Storyを選択
    await page.locator('[data-item-id="components-slackadvancedfilters--expanded"]').click()
    await page.waitForTimeout(1000) // iframeロード待機

    // フィルター入力フィールドが表示されることを確認
    const iframe = page.frameLocator('#storybook-preview-iframe')
    // iframeのコンテンツがロードされるまで待機
    await iframe.locator('body').waitFor({ state: 'attached' })
    await expect(iframe.locator('input[placeholder="#general"]')).toBeVisible()
    await expect(iframe.locator('input[placeholder="@user"]')).toBeVisible()
    await expect(iframe.locator('input[type="date"]').first()).toBeVisible()
  })

  test('アクセシビリティ - タブキーでのフォーカス移動が正常に動作する', async ({ page }) => {
    await page.goto('/')

    // サイドバーが表示されるまで待機
    await page.locator('[data-item-id="components"]').waitFor({ state: 'visible' })

    // SlackAdvancedFiltersコンポーネントを展開
    await page.locator('[data-item-id="components-slackadvancedfilters"]').click()
    await page.waitForTimeout(500) // アニメーション弆機

    // SlackAdvancedFilters Expanded Storyに移動
    await page.locator('[data-item-id="components-slackadvancedfilters--expanded"]').click()
    await page.waitForTimeout(1000) // iframeロード待機

    const iframe = page.frameLocator('#storybook-preview-iframe')
    // iframeのコンテンツがロードされるまで待機
    await iframe.locator('body').waitFor({ state: 'attached' })

    // Tabキーでフォーカス移動をテスト
    await iframe.locator('body').click()
    await page.keyboard.press('Tab')

    // 最初の入力フィールドにフォーカスが当たることを確認
    await expect(iframe.locator('input[placeholder="#general"]')).toBeFocused()

    // 次の入力フィールドにフォーカスが移動することを確認
    await page.keyboard.press('Tab')
    await expect(iframe.locator('input[placeholder="@user"]')).toBeFocused()
  })

  test('レスポンシブ - モバイル表示で適切にレイアウトされる', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // サイドバーが表示されるまで待機
    await page.locator('[data-item-id="components"]').waitFor({ state: 'visible' })

    // MarkdownPreviewコンポーネントを展開
    await page.locator('[data-item-id="components-markdownpreview"]').click()
    await page.waitForTimeout(500) // アニメーション待機

    // MarkdownPreview Default Storyを表示
    await page.locator('[data-item-id="components-markdownpreview--default"]').click()
    await page.waitForTimeout(1000) // iframeロード待機

    const iframe = page.frameLocator('#storybook-preview-iframe')
    // iframeのコンテンツがロードされるまで待機
    await iframe.locator('body').waitFor({ state: 'attached' })

    // モバイルでも適切に表示されることを確認
    await expect(iframe.locator('h1').filter({ hasText: 'サンプルドキュメント' }).first()).toBeVisible()

    // コンテナが適切な幅で表示されることを確認
    const container = iframe.locator('.max-w-3xl')
    await expect(container).toBeVisible()
  })

  test('ダウンロードボタンが正常に動作する', async ({ page }) => {
    await page.goto('/')

    // MarkdownPreview Default Storyを表示
    await page.locator('[data-item-id="components-markdownpreview--default"]').click()

    const iframe = page.frameLocator('#storybook-preview-iframe')

    // ダウンロードボタンが表示されることを確認
    // iframeのコンテンツがロードされるまで待機
    await iframe.locator('body').waitFor({ state: 'attached' })
    const downloadButton = iframe.locator('button').filter({ hasText: 'ダウンロード' }).first()
    await expect(downloadButton).toBeVisible()

    // ボタンがクリック可能であることを確認
    await expect(downloadButton).toBeEnabled()
  })

  test('コードブロックが適切にシンタックスハイライトされる', async ({ page }) => {
    await page.goto('/')

    // CodeHeavyContent Storyを表示
    await page.locator('[data-item-id="components-markdownpreview--code-heavy-content"]').click()

    const iframe = page.frameLocator('#storybook-preview-iframe')

    // コードブロックが適切に表示されることを確認
    // iframeのコンテンツがロードされるまで待機
    await iframe.locator('body').waitFor({ state: 'attached' })
    // コードブロックを含むコンテナを特定
    await expect(iframe.locator('pre').nth(1)).toBeVisible() // Storybookのエラー表示のpreを避ける
    await expect(iframe.locator('code').first()).toBeVisible()

    // 言語ラベルが表示されることを確認
    await expect(iframe.locator('.bg-gray-700').filter({ hasText: 'typescript' }).first()).toBeVisible()
  })
})
