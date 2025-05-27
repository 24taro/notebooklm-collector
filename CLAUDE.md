# CLAUDE.md - プロジェクト開発ルール

このドキュメントは、NotebookLM Collector プロジェクトにおけるコーディング規約とワークフローを定義したものです。

## プロジェクト概要

**リポジトリ**: https://github.com/sotaroNishioka/notebooklm-collector  
**プロジェクト名**: Docbase/Slack 連携 NotebookLM 用ドキュメント生成アプリ  
**バージョン**: v1.9

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

| レイヤ         | 技術                   |
| -------------- | ---------------------- |
| フレームワーク | Next.js 15 / React     |
| スタイリング   | Tailwind CSS           |
| データ取得     | fetch / TanStack Query |
| ストレージ     | localStorage           |
| Lint / Format  | Biome                  |
| 型システム     | TypeScript             |

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

---

**最終更新**: 2025-05-28  
**管理者**: ずんだもん（Claude Assistant）
