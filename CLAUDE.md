# CLAUDE.md - プロジェクト開発ルール

このドキュメントは、NotebookLM Collector プロジェクトにおけるコーディング規約とワークフローを定義したものです。

## プロジェクト概要

**リポジトリ**: https://github.com/sotaroNishioka/notebooklm-collector  
**プロジェクト名**: Docbase/Slack 連携 NotebookLM 用ドキュメント生成アプリ  
**バージョン**: v0.1.0  
**デプロイ URL**: https://sotaronishioka.github.io/notebooklm-collector/

### 主要機能

- Docbase API からの記事検索・取得（最大 500 件）
- Slack API からのメッセージ・スレッド検索・取得（最大 300 件）
- 検索結果の Markdown 形式での出力（YAML Front Matter 付き LLM 最適化）
- NotebookLM 向けドキュメント生成
- ブラウザ完結型でセキュアな処理
- 統一エラーハンドリング（neverthrow Result 型）
- ユーザーフレンドリーなエラーメッセージ

## TypeScript コーディング規約

### 基本方針

- 最初に型と、それを処理する関数のインターフェースを考える
- コードのコメントとして、そのファイルがどういう仕様かを可能な限り明記する
- 実装が内部状態を持たないとき、class による実装を避けて関数を優先する
- 副作用を抽象するために、アダプタパターンで外部依存を抽象し、テストではインメモリなアダプタで処理する

### 型の使用方針

1. **具体的な型を使用**

   - `any`の使用を避ける
   - `unknown`を使用してから型を絞り込む
   - Utility Types を活用する

2. **型エイリアスの命名**

   ```ts
   // Good
   type UserId = string;
   type UserData = {
     id: UserId;
     createdAt: Date;
   };

   // Bad
   type Data = any;
   ```

### エラー処理パターン

1. **Result 型の使用**

   ```ts
   import { err, ok, Result } from "npm:neverthrow";

   type ApiError =
     | { type: "network"; message: string }
     | { type: "notFound"; message: string }
     | { type: "unauthorized"; message: string };

   async function fetchUser(id: string): Promise<Result<User, ApiError>> {
     try {
       const response = await fetch(`/api/users/${id}`);
       if (!response.ok) {
         switch (response.status) {
           case 404:
             return err({ type: "notFound", message: "User not found" });
           case 401:
             return err({ type: "unauthorized", message: "Unauthorized" });
           default:
             return err({
               type: "network",
               message: `HTTP error: ${response.status}`,
             });
         }
       }
       return ok(await response.json());
     } catch (error) {
       return err({
         type: "network",
         message: error instanceof Error ? error.message : "Unknown error",
       });
     }
   }
   ```

### 実装パターン

1. **関数ベース（状態を持たない場合）**

   ```ts
   // インターフェース
   interface Logger {
     log(message: string): void;
   }

   // 実装
   function createLogger(): Logger {
     return {
       log(message: string): void {
         console.log(`[${new Date().toISOString()}] ${message}`);
       },
     };
   }
   ```

2. **Adapter パターン（外部依存の抽象化）**

   ```ts
   // types/api.ts
   export type ApiError =
     | { type: "network"; message: string }
     | { type: "notFound"; message: string }
     | { type: "unauthorized"; message: string };

   export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

   // fetcher.ts
   export type Fetcher = <T>(
     path: string,
     options?: RequestInit
   ) => Promise<Result<T, ApiError>>;

   export function createFetcher(
     baseUrl: string,
     defaultHeaders?: Record<string, string>
   ): Fetcher {
     return async <T>(path: string, options?: RequestInit) => {
       try {
         const res = await fetch(`${baseUrl}${path}`, {
           ...options,
           headers: {
             ...(defaultHeaders || {}),
             ...(options?.headers || {}),
           },
         });
         if (!res.ok) {
           switch (res.status) {
             case 404:
               return {
                 ok: false,
                 error: { type: "notFound", message: "Not found" },
               };
             case 401:
               return {
                 ok: false,
                 error: { type: "unauthorized", message: "Unauthorized" },
               };
             default:
               return {
                 ok: false,
                 error: {
                   type: "network",
                   message: `HTTP error: ${res.status}`,
                 },
               };
           }
         }
         const data = (await res.json()) as T;
         return { ok: true, value: data };
       } catch (e) {
         return {
           ok: false,
           error: {
             type: "network",
             message: e instanceof Error ? e.message : "Unknown error",
           },
         };
       }
     };
   }
   ```

## プロジェクト固有の型定義

### Docbase 関連型

```ts
type DocbasePostListItem = {
  id: number;
  title: string;
  body: string;
  created_at: string; // ISO-8601
  url: string;
};
```

### Slack 関連型

```ts
// Slackメッセージ1件分の型
type SlackMessage = {
  ts: string; // メッセージのタイムスタンプ（スレッドIDにもなる）
  user: string; // ユーザーID
  text: string; // 本文
  thread_ts?: string; // スレッド親のts（親メッセージの場合は省略）
  channel: { id: string; name?: string }; // チャンネル情報
  permalink?: string; // メッセージへのパーマリンク
};

// Slackスレッド全体の型
type SlackThread = {
  channel: string; // チャンネルID
  parent: SlackMessage; // 親メッセージ
  replies: SlackMessage[]; // 返信メッセージ群
};

// Slackユーザー情報の型
type SlackUser = {
  id: string;
  name: string;
  real_name?: string;
};
```

## Git 運用ルール

### Issue テンプレート

````markdown
### 概要

- [機能の概要を記載]

### 受け入れ条件

1. [条件 1]
2. [条件 2]

### 変更箇所候補

- `src/lib/auth.ts`
- `src/pages/login.tsx`

### 実装例

```ts
await supabase.auth.signInWithOtp({ email });
```
````

### PR テンプレート

```markdown
<!-- Pull Request #<Issue番号> feat: [タイトル] -->

## 概要

- Issue #<Issue 番号> の実装

## 変更内容

- 追加: `src/pages/login.tsx`
- 更新: `src/lib/auth.ts`

## テスト手順

1. `npm run dev` を実行
2. /login にアクセスしメールリンクでログイン

## 関連 Issue

- resolves #<Issue 番号>
```

### コミットメッセージ規約

```
<type>(<scope>): <短い要約>

<body>         # 任意: 詳細説明

<footer>       # 任意: Closes #<Issue番号>
```

- **type**: feat, fix, docs, style, refactor, perf, test, chore
- **scope**: component, page, api, util など
- **footer**: `Closes #<Issue番号>` を記載

## 作業フロー

### 1. Git コンテキストの確認

```sh
git status
```

### 2. 作業ブランチの作成

```sh
# mainブランチが最新であることを確認
git checkout main
git pull origin main

# Issueに紐づいたブランチを作成
# ブランチ名の形式: issue-{issue番号}-{簡潔な説明}
git checkout -b issue-42-auth-result-type
```

### 3. 作業とコミット

```sh
# 変更をステージングとコミット
git add .
git commit -m "feat(auth): Result型を使った認証エラー処理の実装

- neverthrowライブラリを導入
- APIレスポンスをResult型でラップ
- エラーケースを型安全に処理

Closes #42"
```

### 4. リモートへのプッシュと PR の作成

```sh
# 作業ブランチをリモートにプッシュ
git push -u origin issue-42-auth-result-type

# GitHub CLIを使用してPRを作成
gh pr create --title "feat(auth): Result型を使った認証エラー処理の実装" --body "## 概要
Issue #42 の実装として、認証処理にResult型を導入しました。

## 変更内容
- neverthrowライブラリの導入
- 認証エラーの型定義を強化
- APIレスポンスの型安全な処理
- テストケースの追加

## テスト手順
1. \`npm test\` でテストが通ることを確認
2. ログイン失敗時のエラーハンドリングが適切に動作することを確認

Closes #42"
```

### 5. レビューとマージ後のクリーンアップ

```sh
# mainブランチに戻る
git checkout main

# リモートの変更を取得
git pull origin main

# 作業ブランチを削除
git branch -d issue-42-auth-result-type
```

## 技術スタック

| レイヤ         | 技術                     | 詳細 |
| -------------- | ------------------------ | ---- |
| フレームワーク | Next.js 15.3.2 / React 19 | App Router・静的サイト生成・Turbopack |
| 言語           | TypeScript 5             | 厳密型チェック・Utility Types活用 |
| スタイリング   | Tailwind CSS 4.1.7       | PostCSS統合・レスポンシブ対応 |
| データ取得     | fetch API                | アダプターパターン・リトライ機能 |
| ストレージ     | localStorage             | 型安全カスタムフック・同期管理 |
| Lint / Format  | Biome 1.9.4              | ESLint+Prettier代替・高速実行 |
| テスト         | Vitest 3.1.4 / Playwright 1.52.0 | jsdom環境・E2E自動化・80%カバレッジ |
| Storybook      | 8.6.14                   | コンポーネント開発・アクセシビリティ |
| エラーハンドリング | neverthrow Result型    | 型安全エラー処理・統一例外管理 |
| デプロイ       | GitHub Pages             | 自動CI/CD・静的ホスティング |
| 開発体験       | Turbopack                | 高速HMR・並列ビルド・モジュール解決 |

## 重要な注意事項

### 開発時の心構え

- ユーザーは時短のためにコーディングを依頼している
- 2 回以上連続でテストを失敗した時は、現在の状況を整理して一緒に解決方法を考える
- コンテキストが不明瞭な時は、ユーザーに確認する
- 実装には標準語の日本語でコメントを入れる
- 必ず日本語で返答する

### 避けるべき操作

- 対話的な git コマンド（-i フラグ）の使用
- リモートリポジトリへの直接プッシュ
- git 設定の変更

### セキュリティ考慮事項

- **データ処理の範囲**: 入力された Docbase/Slack API トークンおよび取得された記事・メッセージ内容は、外部サーバーに送信されることなく、すべてユーザーのブラウザ内で処理が完結する
- **情報漏洩リスクの低減**: データがブラウザ外に出ないため、機密情報が意図せず外部に漏洩するリスクを最小限に抑える
- **トークンの保存**: API トークンは、利便性のためにブラウザの LocalStorage に保存されるが、これもユーザーのローカル環境に限定された保存

## API 仕様

### Docbase API 連携

| 操作 | Endpoint                | ヘッダー         | クエリ                  |
| ---- | ----------------------- | ---------------- | ----------------------- |
| 検索 | `/teams/{domain}/posts` | `X-DocBaseToken` | `q`, `page`, `per_page` |

#### Docbase 詳細検索条件

| 条件     | Docbase API クエリ形式             | 例                                                |
| -------- | ---------------------------------- | ------------------------------------------------- |
| タグ     | `tag:タグ名`                       | `tag:API tag:設計` (複数指定可、カンマ区切り入力) |
| 投稿者   | `author:ユーザーID`                | `author:user123`                                  |
| タイトル | `title:キーワード`                 | `title:仕様書`                                    |
| 投稿期間 | `created_at:YYYY-MM-DD~YYYY-MM-DD` | `created_at:2023-01-01~2023-12-31`                |
| グループ | `group:グループ名`                 | `group:開発チーム`                                |

### Slack API 連携

| 操作         | Endpoint               | HTTPメソッド | ヘッダー                                        | パラメータ             |
| ------------ | ---------------------- | ------------ | ----------------------------------------------- | ---------------------- |
| メッセージ検索 | `/search.messages`     | POST         | `Content-Type: application/x-www-form-urlencoded` | `token`, `query`, `count`, `page` |
| スレッド取得   | `/conversations.replies` | POST         | `Content-Type: application/x-www-form-urlencoded` | `token`, `channel`, `ts` |
| パーマリンク取得 | `/chat.getPermalink`   | GET          | `Authorization: Bearer {token}`                | `channel`, `message_ts` |
| ユーザー情報取得 | `/users.info`          | POST         | `Content-Type: application/x-www-form-urlencoded` | `token`, `user`       |

#### Slack 詳細検索条件

| 条件         | Slack API クエリ形式         | 例                                           |
| ------------ | --------------------------- | -------------------------------------------- |
| チャンネル指定 | `in:#チャンネル名`           | `in:#general`                                |
| 投稿者指定    | `from:@ユーザー名`           | `from:@user123`                              |
| 期間指定      | `after:YYYY-MM-DD`, `before:YYYY-MM-DD` | `after:2023-01-01 before:2023-12-31` |
| 完全一致検索  | `"キーワード"`               | `"重要な議事録"`                             |

### 機能比較

| 機能           | Slack                    | Docbase                      |
| -------------- | ------------------------ | ---------------------------- |
| 検索方式       | スレッド単位でまとめて表示 | 記事単位で表示               |
| 最大取得件数   | 300件（スレッド）         | 500件（記事）                |
| 詳細検索条件   | チャンネル、投稿者、期間  | タグ、投稿者、タイトル、期間、グループ |
| プレビュー     | 最初の10スレッドのみ      | 全記事                       |
| 認証方式       | User Token (xoxp-)       | API Token                    |
| ローカルストレージ | slackApiToken           | docbaseApiToken, docbaseDomain |

## GitHub Pages デプロイワークフロー

### デプロイ設定

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

### Next.js 静的サイト設定

```typescript
// next.config.ts
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/notebooklm-collector' : '',
  assetPrefix: isProd ? '/notebooklm-collector/' : '',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};
```

## コンポーネント設計パターン

### エラーバウンダリーパターン

```tsx
// ErrorBoundaryProvider.tsx
interface ErrorBoundaryContextType {
  reportError: (error: Error, errorInfo?: string) => void;
  clearError: () => void;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextType | null>(null);

export function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
  const reportError = useCallback((error: Error, errorInfo?: string) => {
    // エラーログをローカルストレージに保存
    const errorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      additionalInfo: errorInfo
    };
    saveErrorToStorage(errorLog);
  }, []);

  const value = useMemo(() => ({ reportError, clearError }), [reportError]);
  
  return (
    <ErrorBoundaryContext.Provider value={value}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ErrorBoundaryContext.Provider>
  );
}
```

### カスタムフックパターン

```tsx
// useSlackSearchUnified.ts
interface UseSlackSearchUnifiedReturn {
  searchResults: SlackThread[];
  isLoading: boolean;
  error: string | null;
  searchMessages: (query: string) => Promise<void>;
  clearResults: () => void;
}

export function useSlackSearchUnified(apiToken: string): UseSlackSearchUnifiedReturn {
  const [searchResults, setSearchResults] = useState<SlackThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMessages = useCallback(async (query: string) => {
    if (!apiToken.trim() || !query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await slackAdapter.searchMessages({
        token: apiToken,
        query,
        count: 300
      });
      
      if (result.isOk()) {
        setSearchResults(result.value);
      } else {
        setError(getErrorMessage(result.error));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [apiToken]);

  return { searchResults, isLoading, error, searchMessages, clearResults };
}
```

## テスト戦略

### ユニットテスト (Vitest)

```typescript
// __tests__/hooks/useSlackSearchUnified.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSlackSearchUnified } from '@/hooks/useSlackSearchUnified';

describe('useSlackSearchUnified', () => {
  it('検索を実行して結果を返す', async () => {
    const { result } = renderHook(() => useSlackSearchUnified('test-token'));
    
    await act(async () => {
      await result.current.searchMessages('test query');
    });
    
    expect(result.current.searchResults).toBeDefined();
  });
});
```

### E2Eテスト (Playwright)

```typescript
// tests/storybook.spec.ts
import { test, expect } from '@playwright/test';

test('Storybook動作確認', async ({ page }) => {
  await page.goto('http://localhost:6006');
  
  // SlackAdvancedFilters コンポーネントのテスト
  await page.click('[data-testid="slackadvancedfilters--default"]');
  
  // フォームの操作確認
  await page.fill('input[placeholder="チャンネル名を入力"]', '#general');
  expect(await page.inputValue('input[placeholder="チャンネル名を入力"]')).toBe('#general');
});
```

### 開発コマンド拡張（全22スクリプト）

#### 開発・ビルド（3コマンド）
```bash
npm run dev              # Turbopack開発サーバー（高速HMR・ファイル監視）
npm run build            # Next.js本番ビルド（静的サイト生成・最適化）
npm run start            # 本番サーバー起動（ビルド済みアプリケーション実行）
```

#### コード品質管理（4コマンド）
```bash
npm run lint             # Biome総合チェック（ESLint+Prettier代替・ルール検証）
npm run lint:fix         # Biome自動修正（フォーマット+ルール適用・自動修正）
npm run format           # Biomeフォーマッター単体実行（コードスタイル統一）
npm run type-check       # TypeScript型チェック（noEmit・型エラー検出）
```

#### テスト戦略（7コマンド）
```bash
# ユニットテスト（Vitest 3.1.4）
npm run test             # 単体テスト実行（jsdom環境・カスタムフック・ユーティリティ）
npm run test:watch       # ウォッチモード（ファイル変更時自動実行・リアルタイムフィードバック）
npm run test:coverage    # カバレッジ測定（閾値80%・詳細レポート生成）
npm run test:ui          # Vitest Web UI（ブラウザでテスト結果確認・インタラクティブ実行）

# E2Eテスト（Playwright 1.52.0）
npm run test:e2e         # Storybook E2Eテスト（Chromium・並列実行・自動化）
npm run test:e2e:ui      # Playwright Test UI（インタラクティブモード・ステップ確認）
npm run test:e2e:debug   # Playwright デバッグモード（ステップ実行・スクリーンショット・詳細ログ）
```

#### Storybook（3コマンド）
```bash
npm run storybook        # Storybook開発サーバー（ポート6006・アクセシビリティ・レスポンシブ確認）
npm run build-storybook  # Storybookビルド（静的サイト生成・コンポーネントドキュメント）
npm run storybook:test   # Storybook統合E2Eテスト実行（ビルド→テスト自動化）
```

#### テスト設定詳細

**Vitest設定（vitest.config.ts）**:
- **環境**: jsdom（React DOM環境シミュレート・Testing Library対応）
- **グローバル設定**: globals有効（describe/it/expect直接使用可能）
- **セットアップ**: `src/__tests__/setup.ts`（テスト環境初期化）
- **カバレッジ**: 80%閾値（statements/branches/functions/lines）・詳細レポート
- **除外対象**: node_modules、dist、tests（Playwright）、型定義ファイル
- **エイリアス**: Next.jsパスエイリアスと同期（@/components、@/hooks等）

**Playwright設定（playwright.config.ts）**:
- **テストディレクトリ**: `./tests`（E2Eテスト専用）
- **並列実行**: フル並列・CI環境では1ワーカー（安定性優先）
- **リトライ**: CI環境で2回・ローカルでは0回（効率性重視）
- **ベースURL**: `http://localhost:6006`（Storybook自動接続）
- **ブラウザ**: Chromium（no-sandbox設定・安定性向上）
- **webServer**: Storybook自動起動（3分タイムアウト・依存関係解決）
- **レポーター**: CI環境ではHTML・GitHub・ローカルではHTML

---

**最終更新**: 2025-06-03  
**管理者**: Claude Code Assistant
**Issue**: #184 ドキュメント完全対応実装完了
