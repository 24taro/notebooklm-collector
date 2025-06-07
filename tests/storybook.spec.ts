import { type Page, expect, test } from '@playwright/test'

// テストのタイムアウトを延長
test.setTimeout(60000)

test.describe('Storybook動作確認', () => {
  test('Storybookが正常に起動する', async ({ page }: { page: Page }) => {
    await page.goto('/')

    // Storybookのタイトルが表示されることを確認
    await expect(page).toHaveTitle(/Storybook/)

    // featuresサイドバーが表示されることを確認
    await expect(page.locator('[data-item-id="features"]')).toBeVisible()
  })

  test('Features構造が正しく表示される', async ({ page }: { page: Page }) => {
    await page.goto('/')

    // featuresサイドバーが表示されるまで待機
    await page.locator('[data-item-id="features"]').waitFor({ state: 'visible' })

    // Features を展開
    await page.locator('[data-item-id="features"]').click()
    await page.waitForTimeout(500)

    // docbaseとslackが表示されることを確認
    await expect(page.locator('[data-item-id="features-docbase"]')).toBeVisible()
    await expect(page.locator('[data-item-id="features-slack"]')).toBeVisible()
  })

  test('DocbaseMarkdownPreview - Default Storyが表示される', async ({ page }: { page: Page }) => {
    await page.goto('/')

    // サイドバーが表示されるまで待機
    await page.locator('[data-item-id="features"]').waitFor({ state: 'visible' })

    // Features -> Docbase -> Components を展開
    await page.locator('[data-item-id="features"]').click()
    await page.waitForTimeout(500)
    await page.locator('[data-item-id="features-docbase"]').click()
    await page.waitForTimeout(500)
    await page.locator('[data-item-id="features-docbase-components"]').click()
    await page.waitForTimeout(500)

    // DocbaseMarkdownPreviewコンポーネントを展開
    await page.locator('[data-item-id="features-docbase-components-docbasemarkdownpreview"]').click()
    await page.waitForTimeout(500) // アニメーション待機

    // Default Storyを選択
    await page.locator('[data-item-id="features-docbase-components-docbasemarkdownpreview--default"]').click()
    await page.waitForTimeout(1000) // iframeロード待機

    // プレビューエリアでDocbaseMarkdownPreviewコンポーネントが表示されることを確認
    const iframe = page.frameLocator('#storybook-preview-iframe')
    // iframeのコンテンツがロードされるまで待機
    await iframe.locator('body').waitFor({ state: 'attached' })
    // h2タグのプレビュータイトルを確認
    await expect(iframe.locator('h2').filter({ hasText: 'Docbase記事プレビュー' }).first()).toBeVisible()

    // サンプルMarkdownの内容が表示されることを確認
    await expect(iframe.locator('h1:has-text("Docbase記事サンプル")').first()).toBeVisible()
    await expect(iframe.locator('h2:has-text("機能一覧")').first()).toBeVisible()
  })

  test('DocbaseMarkdownPreview - Empty Storyが表示される', async ({ page }: { page: Page }) => {
    await page.goto('/')

    // Features -> Docbase -> Components -> DocbaseMarkdownPreview -> Empty を選択
    await page.locator('[data-item-id="features"]').click()
    await page.waitForTimeout(500)
    await page.locator('[data-item-id="features-docbase"]').click()
    await page.waitForTimeout(500)
    await page.locator('[data-item-id="features-docbase-components"]').click()
    await page.waitForTimeout(500)
    await page.locator('[data-item-id="features-docbase-components-docbasemarkdownpreview"]').click()
    await page.waitForTimeout(500)

    // Empty Storyを選択
    await page.locator('[data-item-id="features-docbase-components-docbasemarkdownpreview--empty"]').click()

    // 空状態のメッセージが表示されることを確認
    const iframe = page.frameLocator('#storybook-preview-iframe')
    await expect(
      iframe.locator('p:has-text("Docbase記事を検索すると、ここにプレビューが表示されます。")'),
    ).toBeVisible()
  })

  test('ダウンロードボタンが正常に動作する', async ({ page }: { page: Page }) => {
    await page.goto('/')

    // DocbaseMarkdownPreview Default Storyを表示
    await page.locator('[data-item-id="features"]').click()
    await page.waitForTimeout(500)
    await page.locator('[data-item-id="features-docbase"]').click()
    await page.waitForTimeout(500)
    await page.locator('[data-item-id="features-docbase-components"]').click()
    await page.waitForTimeout(500)
    await page.locator('[data-item-id="features-docbase-components-docbasemarkdownpreview"]').click()
    await page.waitForTimeout(500)
    await page.locator('[data-item-id="features-docbase-components-docbasemarkdownpreview--default"]').click()

    const iframe = page.frameLocator('#storybook-preview-iframe')

    // ダウンロードボタンが表示されることを確認
    // iframeのコンテンツがロードされるまで待機
    await iframe.locator('body').waitFor({ state: 'attached' })
    const downloadButton = iframe.locator('button').filter({ hasText: 'ダウンロード' }).first()
    await expect(downloadButton).toBeVisible()

    // ボタンがクリック可能であることを確認
    await expect(downloadButton).toBeEnabled()
  })
})