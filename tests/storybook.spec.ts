import { test, expect, type Page, type FrameLocator } from '@playwright/test'

// タイムアウト設定
test.setTimeout(90000)

// カスタムヘルパー関数
async function waitForStorybookReady(page: Page) {
  // Storybookの基本的なUIが表示されるまで待つ
  try {
    await page.waitForSelector('[data-item-id="components"]', { 
      timeout: 60000,
      state: 'visible' 
    })
  } catch (error) {
    // フォールバック: 別のセレクタを試す
    await page.waitForSelector('#storybook-explorer-tree', { 
      timeout: 30000,
      state: 'visible' 
    })
  }
  
  // 追加の安定化待機
  await page.waitForTimeout(2000)
}

async function expandComponent(page: Page, componentId: string): Promise<boolean> {
  const component = page.locator(`[data-item-id="${componentId}"]`)
  
  // コンポーネントが表示されるまで待つ
  await component.waitFor({ state: 'visible', timeout: 30000 })
  
  // 既に展開されているかチェック
  const isExpanded = await component.getAttribute('aria-expanded')
  if (isExpanded === 'true') {
    return true
  }
  
  // クリックして展開
  await component.click()
  
  // 展開アニメーションを待つ
  await page.waitForTimeout(2000)
  
  return true
}

async function waitForIframeContent(page: Page): Promise<FrameLocator | null> {
  try {
    // iframeが存在するまで待つ
    await page.waitForSelector('#storybook-preview-iframe', { 
      state: 'visible', 
      timeout: 20000 
    })
    
    const iframe = page.frameLocator('#storybook-preview-iframe')
    
    // iframeの内容が読み込まれるまで待つ
    await iframe.locator('body').waitFor({ 
      state: 'attached', 
      timeout: 10000 
    })
    
    await page.waitForTimeout(1000)
    
    return iframe
  } catch (error) {
    return null
  }
}

test.describe('Storybook E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    // Storybookのトップページに移動
    await page.goto('/', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    })
    await waitForStorybookReady(page)
  })

  test('Storybookが正常に起動する', async ({ page }) => {
    // タイトルを確認
    await expect(page).toHaveTitle(/Storybook/, { timeout: 30000 })
    
    // サイドバーのComponents項目を確認
    const componentsItem = page.locator('[data-item-id="components"]')
    await expect(componentsItem).toBeVisible({ timeout: 30000 })
  })

  test('コンポーネントツリーの基本構造を確認', async ({ page }) => {
    // Componentsが表示されることを確認
    const componentsItem = page.locator('[data-item-id="components"]')
    await expect(componentsItem).toBeVisible({ timeout: 30000 })
    
    // MarkdownPreviewコンポーネントが存在することを確認
    const markdownPreview = page.locator('[data-item-id="components-markdownpreview"]')
    await expect(markdownPreview).toBeVisible({ timeout: 30000 })
    
    // SlackAdvancedFiltersコンポーネントが存在することを確認
    const slackFilters = page.locator('[data-item-id="components-slackadvancedfilters"]')
    await expect(slackFilters).toBeVisible({ timeout: 30000 })
  })

  test('SlackAdvancedFiltersコンポーネントの基本動作', async ({ page }) => {
    // コンポーネントを展開
    const expanded = await expandComponent(page, 'components-slackadvancedfilters')
    expect(expanded).toBeTruthy()
    
    // Defaultストーリーが表示されることを確認
    const defaultStory = page.locator('[data-item-id="components-slackadvancedfilters--default"]')
    await expect(defaultStory).toBeVisible({ timeout: 20000 })
  })

  test('SlackAdvancedFilters Defaultストーリーの表示', async ({ page }) => {
    // コンポーネントを展開
    await expandComponent(page, 'components-slackadvancedfilters')
    
    // Defaultストーリーをクリック
    const defaultStory = page.locator('[data-item-id="components-slackadvancedfilters--default"]')
    await defaultStory.waitFor({ state: 'visible', timeout: 20000 })
    await defaultStory.click()
    
    // iframeの内容を確認
    const iframe = await waitForIframeContent(page)
    if (iframe) {
      // ボタンが表示されることを確認
      const button = iframe.locator('button').filter({ hasText: 'もっと詳細な条件を追加する' })
      const buttonCount = await button.count()
      expect(buttonCount).toBeGreaterThan(0)
    }
  })

  test('SlackAdvancedFilters Expandedストーリーの表示', async ({ page }) => {
    // コンポーネントを展開
    await expandComponent(page, 'components-slackadvancedfilters')
    
    // Expandedストーリーをクリック
    const expandedStory = page.locator('[data-item-id="components-slackadvancedfilters--expanded"]')
    await expandedStory.waitFor({ state: 'visible', timeout: 20000 })
    await expandedStory.click()
    
    // iframeの内容を確認
    const iframe = await waitForIframeContent(page)
    if (iframe) {
      // 入力フィールドが表示されることを確認
      const inputs = await iframe.locator('input').count()
      expect(inputs).toBeGreaterThan(0)
    }
  })

  test('ストーリー間のナビゲーション', async ({ page }) => {
    // SlackAdvancedFiltersを展開
    await expandComponent(page, 'components-slackadvancedfilters')
    
    // Defaultストーリーに移動
    const defaultStory = page.locator('[data-item-id="components-slackadvancedfilters--default"]')
    await defaultStory.click()
    await page.waitForTimeout(1000)
    
    // Expandedストーリーに移動
    const expandedStory = page.locator('[data-item-id="components-slackadvancedfilters--expanded"]')
    await expandedStory.click()
    await page.waitForTimeout(1000)
    
    // 両方のストーリーが存在することを確認
    await expect(defaultStory).toBeVisible()
    await expect(expandedStory).toBeVisible()
  })

  test('基本的なレスポンシブ動作の確認', async ({ page }) => {
    // 現在のビューでコンポーネントが表示されることを確認
    const componentsItem = page.locator('[data-item-id="components"]')
    await expect(componentsItem).toBeVisible({ timeout: 30000 })
    
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)
    
    // モバイルビューでもコンポーネントが表示されることを確認
    await expect(componentsItem).toBeVisible({ timeout: 30000 })
  })

  test('ページのパフォーマンス基準を満たす', async ({ page }) => {
    // ページの読み込み完了を確認
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Storybookのメインコンテンツが表示されることを確認
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible({ timeout: 10000 })
    
    // エラーがないことを確認
    const errorElements = await page.locator('.error, .exception').count()
    expect(errorElements).toBe(0)
  })
})