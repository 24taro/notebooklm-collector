# Playwright E2E Tests

このディレクトリには、Storybookのための Playwright E2E テストが含まれています。

## テストの実行

### 単体テスト（Vitest）
```bash
npm test
```

### E2Eテスト（Playwright）
```bash
npm run test:e2e
```

## テスト分離の理由

このプロジェクトでは、以下の理由により単体テストとE2Eテストを分離しています：

1. **異なるテストランナー**: Vitest（単体テスト）とPlaywright（E2Eテスト）は異なるテスト構文を使用
2. **パフォーマンス**: E2Eテストは時間がかかるため、開発中は単体テストのみ実行可能
3. **CI/CD最適化**: CIパイプラインで並列実行可能

## ディレクトリ構造

- `/src/__tests__/` - Vitestによる単体テスト
- `/tests/` - PlaywrightによるE2Eテスト（Storybook）

## 設定ファイル

- `vitest.config.ts` - Vitest設定（`/tests/`を除外）
- `playwright.config.ts` - Playwright設定（Storybookサーバー起動を含む）