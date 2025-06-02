# テスト戦略ドキュメント

## 概要

NotebookLM Collectorプロジェクトにおけるテスト戦略を定義します。品質保証とバグの早期発見を目的とし、効率的で保守可能なテスト体系を構築します。

## テストピラミッド

```
        E2Eテスト
       /         \
      統合テスト
     /           \
    単体テスト
   /             \
  静的解析・型チェック
```

### 各層の役割

1. **静的解析・型チェック** (基盤)
   - TypeScriptによる型安全性
   - Biomeによるコード品質チェック
   - 実行前のエラー検出

2. **単体テスト** (最多)
   - 個々の関数・コンポーネントのテスト
   - 高速実行・高頻度実行
   - 詳細な動作検証

3. **統合テスト** (中間)
   - 複数モジュールの連携テスト
   - APIクライアントの動作確認
   - エラーハンドリングの検証

4. **E2Eテスト** (最少)
   - ユーザーシナリオの検証
   - クリティカルパスのテスト
   - リグレッション防止

## テストツール

### 単体テスト・統合テスト
- **フレームワーク**: Vitest
- **アサーション**: Vitest内蔵
- **モック**: Vitest内蔵
- **カバレッジ**: c8

### E2Eテスト
- **フレームワーク**: Playwright
- **ブラウザ**: Chromium, Firefox, WebKit
- **ヘッドレスモード**: CI/CD用

### コンポーネントテスト
- **ライブラリ**: @testing-library/react
- **ユーザー操作**: @testing-library/user-event
- **スナップショット**: Vitest

## テストファイルの構成

### ディレクトリ構造

```
src/
├── __tests__/              # テストファイル
│   ├── components/         # コンポーネントテスト
│   ├── hooks/             # カスタムフックテスト
│   ├── utils/             # ユーティリティテスト
│   ├── adapters/          # アダプターテスト
│   └── lib/               # ライブラリテスト
├── components/
│   └── Component.tsx
└── ...

tests/                      # E2Eテスト
├── e2e/
│   ├── docbase.spec.ts
│   └── slack.spec.ts
└── fixtures/              # テストデータ
```

### 命名規則

- 単体テスト: `*.test.ts` または `*.test.tsx`
- E2Eテスト: `*.spec.ts`
- テストユーティリティ: `*.test-utils.ts`

## テスト作成ガイドライン

### 1. 単体テストの書き方

```typescript
// 良い例：明確で独立したテスト
import { describe, it, expect } from 'vitest'
import { formatDate } from '@/utils/dateFormatter'

describe('formatDate', () => {
  it('ISO日付を日本語形式に変換する', () => {
    const result = formatDate('2024-01-01T00:00:00Z')
    expect(result).toBe('2024年1月1日')
  })

  it('無効な日付の場合はエラーメッセージを返す', () => {
    const result = formatDate('invalid-date')
    expect(result).toBe('無効な日付')
  })
})

// 悪い例：複数の検証を含む大きなテスト
it('日付フォーマット機能', () => {
  // 複数のケースを1つのテストに詰め込まない
  expect(formatDate('2024-01-01')).toBe('2024年1月1日')
  expect(formatDate('invalid')).toBe('無効な日付')
  expect(formatDate(null)).toBe('無効な日付')
})
```

### 2. コンポーネントテストの書き方

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from '@/components/SearchForm'

describe('SearchForm', () => {
  it('検索ボタンをクリックするとonSubmitが呼ばれる', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn()
    
    render(<SearchForm onSubmit={mockSubmit} />)
    
    const input = screen.getByLabelText('検索キーワード')
    const button = screen.getByRole('button', { name: '検索' })
    
    await user.type(input, 'テストキーワード')
    await user.click(button)
    
    expect(mockSubmit).toHaveBeenCalledWith({
      keyword: 'テストキーワード'
    })
  })
})
```

### 3. 非同期処理のテスト

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useSearch } from '@/hooks/useSearch'

describe('useSearch', () => {
  it('検索結果を正しく取得する', async () => {
    const { result } = renderHook(() => useSearch())
    
    result.current.search('キーワード')
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.data).toHaveLength(10)
    expect(result.current.error).toBeNull()
  })
})
```

### 4. エラーハンドリングのテスト

```typescript
import { err, ok } from 'neverthrow'
import { fetchDocbasePost } from '@/lib/docbaseClient'

describe('fetchDocbasePost', () => {
  it('ネットワークエラーを適切に処理する', async () => {
    // モックの設定
    global.fetch = vi.fn().mockRejectedValue(
      new Error('Network error')
    )
    
    const result = await fetchDocbasePost('123')
    
    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'network',
      message: 'ネットワークエラーが発生しました'
    })
  })
})
```

## モックとテストダブル

### 1. APIモック

```typescript
// src/__tests__/mocks/slackApi.ts
export const mockSlackSearchResponse = {
  ok: true,
  messages: {
    matches: [
      {
        ts: '1234567890.123456',
        user: 'U123456',
        text: 'テストメッセージ'
      }
    ]
  }
}

// テストでの使用
vi.mock('@/lib/slackClient', () => ({
  searchMessages: vi.fn().mockResolvedValue(
    ok(mockSlackSearchResponse)
  )
}))
```

### 2. ブラウザAPIモック

```typescript
// LocalStorageのモック
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})
```

## E2Eテスト戦略

### 1. クリティカルパス

以下のユーザーシナリオをE2Eテストでカバー：

1. **Docbase検索フロー**
   - トークン入力 → 検索実行 → 結果表示 → ダウンロード

2. **Slack検索フロー**
   - トークン入力 → 検索実行 → スレッド展開 → ダウンロード

3. **エラーハンドリング**
   - 無効なトークン → エラー表示 → リトライ

### 2. Playwrightテストの例

```typescript
import { test, expect } from '@playwright/test'

test.describe('Docbase検索', () => {
  test('記事を検索してダウンロードできる', async ({ page }) => {
    await page.goto('/docbase')
    
    // トークン入力
    await page.fill('[data-testid="token-input"]', 'test-token')
    await page.click('[data-testid="save-token"]')
    
    // 検索実行
    await page.fill('[data-testid="search-input"]', 'テスト')
    await page.click('[data-testid="search-button"]')
    
    // 結果確認
    await expect(page.locator('[data-testid="search-results"]'))
      .toBeVisible()
    
    // ダウンロード
    await page.click('[data-testid="download-button"]')
    
    // ダウンロード確認（ブラウザAPIのモニタリング）
    const download = await page.waitForEvent('download')
    expect(download.suggestedFilename()).toContain('.md')
  })
})
```

## カバレッジ目標

### 全体目標
- **総合カバレッジ**: 80%以上
- **単体テスト**: 90%以上
- **統合テスト**: 70%以上

### モジュール別目標

| モジュール | カバレッジ目標 | 理由 |
|-----------|--------------|------|
| utils/ | 95%+ | 純粋関数が多く、テストしやすい |
| hooks/ | 85%+ | 重要なビジネスロジック |
| adapters/ | 80%+ | 外部API連携の信頼性確保 |
| components/ | 70%+ | UIロジックのテスト |
| app/ | 50%+ | 主にルーティング設定 |

## CI/CDでのテスト実行

### GitHub Actions設定

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      # 単体テスト
      - run: npm ci
      - run: npm run test:ci
      
      # カバレッジレポート
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
      
      # E2Eテスト
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      # アーティファクト保存
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: |
            coverage/
            test-results/
```

## テストのベストプラクティス

### 1. AAA パターン
```typescript
it('ユーザーを正しく作成する', () => {
  // Arrange（準備）
  const userData = { name: '太郎', email: 'taro@example.com' }
  
  // Act（実行）
  const user = createUser(userData)
  
  // Assert（検証）
  expect(user.name).toBe('太郎')
  expect(user.email).toBe('taro@example.com')
})
```

### 2. テストの独立性
- 各テストは他のテストに依存しない
- 実行順序に関わらず成功する
- グローバル状態を変更しない

### 3. 意味のあるテスト名
- 日本語での記述を推奨
- 何をテストしているか明確に
- 期待される動作を記述

### 4. テストデータ
- ファクトリー関数の使用
- リアルなデータの使用
- エッジケースの考慮

## テストのメンテナンス

### 1. 定期的な見直し
- 四半期ごとのテスト棚卸し
- 不要なテストの削除
- 新機能に対するテスト追加

### 2. テストの高速化
- 並列実行の活用
- 重いセットアップの共有
- モックの適切な使用

### 3. 失敗の分析
- flaky testの特定と修正
- 失敗パターンの記録
- 根本原因の究明

## トラブルシューティング

### よくある問題と解決方法

1. **タイムアウトエラー**
   - 非同期処理の待機時間を調整
   - `waitFor`のタイムアウト設定を確認

2. **モックが効かない**
   - インポート順序を確認
   - モックのスコープを確認

3. **環境依存のエラー**
   - CI環境での再現を試みる
   - 環境変数の設定を確認

## まとめ

効果的なテスト戦略により、高品質なコードベースを維持します。テストは開発プロセスの重要な一部として、継続的に改善していきます。