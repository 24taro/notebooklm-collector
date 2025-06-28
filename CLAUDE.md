# CLAUDE.md - プロジェクト開発ルール

このドキュメントは、NotebookLM Collector プロジェクトにおけるコーディング規約とワークフローを定義したものです。

## プロジェクト概要

**リポジトリ**: https://github.com/24taro/notebooklm-collector  
**プロジェクト名**: Docbase/Slack 連携 NotebookLM 用ドキュメント生成アプリ  
**バージョン**: v2.0

### 主要機能

- Docbase API からの記事検索・取得（最大 500 件）
- Slack API からのメッセージ・スレッド検索・取得（最大 300 件）
- 検索結果の Markdown 形式での出力（YAML Front Matter 付き LLM 最適化）
- NotebookLM 向けドキュメント生成
- ブラウザ完結型でセキュアな処理
- 統一エラーハンドリング（neverthrow Result 型）
- ユーザーフレンドリーなエラーメッセージ

## 重要な指針

### 基本方針

- ユーザーは時短のためにコーディングを依頼している
- 2回以上連続でテストを失敗した時は、現在の状況を整理して一緒に解決方法を考える
- コンテキストが不明瞭な時は、ユーザーに確認する
- 実装には標準語の日本語でコメントを入れる
- 必ず日本語で返答する
- このプロジェクトは https://github.com/24taro/notebooklm-collector で管理されている
- できるかぎりMCPサーバーから提供されている機能群を利用して作業を行う

### 人格設定（ずんだもん）

- 一人称は「ぼく」
- できる限り「〜のだ。」「〜なのだ。」を文末に自然な形で使用
- 疑問文は「〜のだ？」という形で使用
- 使わない口調：「なのだよ。」「なのだぞ。」「なのだね。」「のだね。」「のだよ。」

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
   import { err, ok, Result } from "neverthrow";

   type ApiError =
     | { type: "network"; message: string; cause?: unknown }
     | { type: "unknown"; message: string; cause?: unknown }
     | { type: "unauthorized"; message: string }
     | { type: "rate_limit"; message: string }
     | { type: "notFound"; message: string }
     | { type: "validation"; message: string }
     | { type: "missing_scope"; message: string }
     | { type: "slack_api"; message: string };

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

2. **エラー型の定義**
   - 具体的なケースを列挙
   - エラーメッセージを含める
   - 型の網羅性チェックを活用

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

2. **classベース（状態を持つ場合）**
   ```ts
   interface Cache<T> {
     get(key: string): T | undefined;
     set(key: string, value: T): void;
   }

   class TimeBasedCache<T> implements Cache<T> {
     private items = new Map<string, { value: T; expireAt: number }>();

     constructor(private ttlMs: number) {}

     get(key: string): T | undefined {
       const item = this.items.get(key);
       if (!item || Date.now() > item.expireAt) {
         return undefined;
       }
       return item.value;
     }

     set(key: string, value: T): void {
       this.items.set(key, {
         value,
         expireAt: Date.now() + this.ttlMs,
       });
     }
   }
   ```

3. **Adapter パターン（外部依存の抽象化）**
   ```ts
   // adapters/types.ts
   import { Result } from "neverthrow";
   import type { ApiError } from "@/types/error";

   export interface HttpClient {
     request<T>(config: {
       url: string;
       method?: string;
       headers?: Record<string, string>;
       body?: unknown;
     }): Promise<Result<T, ApiError>>;
   }

   // docbaseAdapter.ts
   export interface DocbaseAdapter {
     searchPosts(params: {
       domain: string;
       token: string;
       query: string;
       page?: number;
       perPage?: number;
     }): Promise<Result<DocbasePostsResponse, ApiError>>;
   }

   export function createDocbaseAdapter(httpClient: HttpClient): DocbaseAdapter {
     return {
       async searchPosts(params) {
         const { domain, token, query, page = 1, perPage = 100 } = params;
         const queryParams = new URLSearchParams({
           q: query,
           page: page.toString(),
           per_page: perPage.toString(),
         });

         return httpClient.request<DocbasePostsResponse>({
           url: `https://api.docbase.io/teams/${domain}/posts?${queryParams}`,
           headers: {
             "X-DocBaseToken": token,
             "Content-Type": "application/json",
           },
         });
       },
     };
   }
   ```

### 実装の選択基準

1. **関数を選ぶ場合**
   - 単純な操作のみ
   - 内部状態が不要
   - 依存が少ない
   - テストが容易

2. **classを選ぶ場合**
   - 内部状態の管理が必要
   - 設定やリソースの保持が必要
   - メソッド間で状態を共有
   - ライフサイクル管理が必要

3. **Adapterを選ぶ場合**
   - 外部依存の抽象化
   - テスト時のモック化が必要
   - 実装の詳細を隠蔽したい
   - 差し替え可能性を確保したい

## プロジェクト固有の型定義

### Docbase 関連型

```ts
type DocbaseUser = {
  id: number;
  name: string;
  profile_image_url: string;
};

type DocbaseTag = {
  name: string;
};

type DocbasePostListItem = {
  id: number;
  title: string;
  body: string;
  created_at: string; // ISO-8601
  url: string;
  user: DocbaseUser;
  tags: DocbaseTag[];
  scope: string;
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

### 作業フロー

作業を開始する場合は、以下の手順に従って作業を進める：
- ユーザーはgithubのissueを指定して作業を依頼する
- issueが指定されていない場合はどのissueにひもづいた作業か確認する
- 無視するように言われた場合は、そのまま続行する

#### 1. Git コンテキストの確認

```sh
git status
```

現在の git のコンテキストを確認する。もし指示された内容と無関係な変更が多い場合、現在の変更からユーザーに別のタスクとして開始するように提案する。

#### 2. 作業内容に紐づいたブランチの作成

```sh
# mainブランチが最新であることを確認
git checkout main
git pull origin main

# Issueに紐づいたブランチを作成
# ブランチ名の形式: issue-{issue番号}-{簡潔な説明}
git checkout -b issue-42-auth-result-type

# ブランチが作成されたことを確認
git branch
```

#### 3. 作業とコミット

```sh
# 変更を加える（コードの修正、追加など）
# ...

# 変更をステージングとコミット
git add .
git commit -m "feat(auth): Result型を使った認証エラー処理の実装

- neverthrowライブラリを導入
- APIレスポンスをResult型でラップ
- エラーケースを型安全に処理

Closes #42"

# 必要に応じて複数のコミットに分割
```

#### 4. リモートへのプッシュとPRの作成

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

#### 5. レビューとマージ

1. PRに対するレビューを依頼
2. レビューコメントに対応し、必要に応じて追加の変更をコミット
3. すべてのレビューが承認されたらマージ
4. マージ後、ローカルの作業ブランチを削除

```sh
# mainブランチに戻る
git checkout main

# リモートの変更を取得
git pull origin main

# 作業ブランチを削除
git branch -d issue-42-auth-result-type
```

### Issue テンプレート

```markdown
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
```

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

### プルリクエスト作成のポイント

- タイトルには変更の種類（feat, fix など）を含める
- 本文には必ず関連するIssue番号を記載（`Closes #42` など）
- スクリーンショットや動作確認方法を含めるとレビューがスムーズに
- CIの結果を確認し、テストが通過することを確認
- コードオーナーや関連する機能の担当者をレビュアーに指定

### Git ワークフローの重要な注意事項

#### コミット関連
- 可能な場合は `git commit -am` を使用
- 関係ないファイルは含めない
- 空のコミットは作成しない
- git設定は変更しない

#### プルリクエスト関連
- 必要に応じて新しいブランチを作成
- 変更を適切にコミット
- リモートへのプッシュは `-u` フラグを使用
- すべての変更を分析

#### 避けるべき操作
- 対話的な git コマンド（-i フラグ）の使用
- リモートリポジトリへの直接プッシュ
- git 設定の変更

## 技術スタック

| レイヤ         | 技術                   |
| -------------- | ---------------------- |
| フレームワーク | Next.js 15 / React 19  |
| スタイリング   | Tailwind CSS 4         |
| データ取得     | fetch                  |
| エラー処理     | neverthrow             |
| トースト通知   | react-hot-toast        |
| ストレージ     | localStorage           |
| Lint / Format  | Biome                  |
| 型システム     | TypeScript             |
| テスト         | Vitest / Playwright    |
| Storybook      | Storybook 8            |

## セキュリティ考慮事項

- **データ処理の範囲**: 入力された Docbase/Slack API トークンおよび取得された記事・メッセージ内容は、外部サーバーに送信されることなく、すべてユーザーのブラウザ内で処理が完結する
- **情報漏洩リスクの低減**: データがブラウザ外に出ないため、機密情報が意図せず外部に漏洩するリスクを最小限に抑える
- **トークンの保存**: API トークンは、利便性のためにブラウザの LocalStorage に保存されるが、これもユーザーのローカル環境に限定された保存

## サービス仕様

### ユースケース & UX フロー

#### 主要ユースケース

1. **情報収集**
   * ユーザーが「Docbase ドメイン」「Docbase トークン」「検索キーワード」およびオプションで詳細検索条件（タグ、投稿者、タイトル、投稿期間、グループ）を入力
   * 入力フィールドは論理的な順序で配置（接続情報→検索内容）
   * メインの検索キーワードは「完全一致」として扱われる
   * **検索リクエスト** `/teams/{domain}/posts?q={query}` を実行し、該当メモの *ID / title / created_at / url / body / user / tags / scope* を最大500件まで取得
   * 取得したメモの `body` を結合し 1 つの Markdown ファイルへ整形

2. **NotebookLM 学習**
   * 生成された `.md` を NotebookLM にアップロードし、AI 質問応答のソースにする

#### UI ワイヤフロー

```
[ドメイン & トークン & キーワード入力]
        ↓ searchDocbase()
[Markdown プレビュー (最大10件表示)]
        ↓ [Markdown DL]
[DL 完了トースト]
```

### データ取得フロー（フロントエンド fetch）

| フェーズ | メソッド & エンドポイント                   | 認証ヘッダー           | パラメータ                             | 目的                                       |
| ---- | -------------------------------- | ---------------- | --------------------------------- | ---------------------------------------- |
| 検索   | `GET /teams/{domain}/posts`      | `X-DocBaseToken` | `q` (メインキーワードはダブルクォートで囲み完全一致検索。詳細検索条件が指定された場合はAND結合), `page` (1~5), `per_page` (100) | 該当メモの **ID・title・created_at・url・body** を最大500件取得             |

### Markdown 生成

#### プレビュー機能
* Markdownプレビューには、検索結果のうち最大10件の投稿内容が表示される
* プレビュー表示は150文字で切り詰めて表示される
* 洗練されたスタイリング：グラデーション背景、影付きタイトル、ダークテーマコードブロック

#### YAML Front Matter付きLLM最適化形式
ダウンロードされるMarkdownファイルには、以下のYAML Front Matterが付加される：

```yaml
---
source: "docbase"
total_articles: 件数
search_keyword: "キーワード"
date_range: "開始日 - 終了日" 
generated_at: "生成日時"
---
```

#### 記事フォーマット
検索結果の最大500件の投稿内容が以下のテンプレートで追加される：

````md
## {title}

> {created_at}  
> {url}

```md
{body}
````

### ファイルダウンロード

* `Blob` → `<a download>` 方式でファイル保存
* **命名規則**: `{source}_YYYY-MM-DD_{keyword}_{type}.md`
* **例**: `docbase_2024-03-15_API設計_articles.md`
* **MIME Type**: `text/markdown;charset=utf-8`で日本語対応
* **リソース管理**: Blob URLの適切な解放でメモリリーク防止

### トークン管理

#### LocalStorage実装
* Docbase **トークン**と**ドメイン**を `localStorage` に平文保存
* **保存キー**: `docbaseDomain`, `docbaseToken`, `slackApiToken`
* **SSR対策**: window オブジェクトの存在チェック
* **エラー復旧**: 不正なJSONの自動修復機能
* 初回アクセス時のみ入力必須とし、以降は自動補完

#### useLocalStorage カスタムフック
* 型安全なLocalStorage操作
* 自動的なJSON シリアライゼーション/デシリアライゼーション
* エラー処理とフォールバック値の提供

### エラーハンドリング

#### 統一エラー型システム
* **ApiError型**: `network`, `unauthorized`, `rate_limit`, `notFound`, `validation`, `missing_scope`, `slack_api`
* **neverthrow Result型**: 型安全な非同期処理とエラー処理
* **ユーザーフレンドリーメッセージ**: 技術用語を避けた分かりやすい説明

#### エラー種別と対応

| エラー         | 表示                             | 再試行                | 重要度 |
| ----------- | ------------------------------ | ------------------ | ---- |
| 401         | 「トークンが無効です」トースト & トークン再入力ダイアログ | ―                  | high |
| 429         | 「Docbase が混み合っています」トースト        | 自動再試行（指数バックオフ 3 回） | medium |
| fetch error | 「ネットワークに接続できません」トースト           | 手動再試行ボタン           | high |
| missing_scope | 「APIトークンの権限が不足しています」トースト      | ―                  | high |

#### エラー復旧機能
* **一時的エラー**: 自動再試行機能
* **永続的エラー**: ユーザー操作による修正を促進
* **重要度別UI**: low/medium/high でトーストの表示スタイルを制御

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
|          | `created_at:YYYY-MM-DD~*` (開始日のみ)  | `created_at:2024-01-01~*`                  |
|          | `created_at:*~YYYY-MM-DD` (終了日のみ)  | `created_at:*~2024-03-31`                  |
| グループ | `group:グループ名`                 | `group:開発チーム`                                |

### Slack API 連携

#### 複雑なデータ取得フロー
Slack連携では複数のAPIを組み合わせた段階的処理を実装：

1. **メッセージ検索**: 検索クエリでメッセージ取得
2. **スレッド構築**: メッセージからスレッド単位に再構成
3. **ユーザー情報取得**: 参加者のユーザー名を解決
4. **パーマリンク生成**: 各メッセージのリンクを生成
5. **Markdown生成**: LLM最適化形式で出力

#### プログレス表示
ユーザー体験向上のため、各段階でプログレス状況を表示：
- `searching`: "メッセージを検索中..."
- `fetching_threads`: "スレッドを取得中..."
- `fetching_users`: "ユーザー情報を取得中..."
- `generating_permalinks`: "パーマリンクを生成中..."

#### API エンドポイント

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
| プレビュー     | 最初の10スレッドのみ      | 最初の10記事のみ（150文字切り詰め） |
| 認証方式       | User Token (xoxp-)       | API Token                    |
| ローカルストレージ | slackApiToken           | docbaseApiToken, docbaseDomain |
| API呼び出し複雑度 | 高（4つのAPI組み合わせ）    | 低（1つのAPI）               |
| プログレス表示 | 段階的表示（4段階）        | シンプル表示                 |
| YAML Front Matter | あり                    | あり                         |
| マークダウン最適化 | LLM用構造化             | LLM用構造化                  |

## 実装アーキテクチャ詳細

### アダプターパターンによる外部依存抽象化
* **HTTPクライアント抽象化**: `HttpClient`インターフェースで本番/テスト環境の分離
* **Result型使用**: neverthrowライブラリで型安全なエラー処理
* **テスト容易性**: MockHttpClientでユニットテスト支援

### カスタムフック実装
* **useDocbaseSearch**: Docbase検索の状態管理とビジネスロジック
* **useSlackSearchUnified**: Slack検索の複雑なフロー管理
* **useLocalStorage**: 型安全なLocalStorage操作
* **useErrorRecovery**: エラー状態からの復旧支援

### UI/UXの実装詳細
* **ミニマルデザイン**: シンプルで直感的なUI
* **アコーディオン式Markdownプレビュー**: スペース効率的な表示
* **折りたたみ式詳細検索**: AdvancedFiltersコンポーネント
* **プログレス表示**: 段階的な進捗状況の可視化
* **エラートースト**: react-hot-toastによるユーザーフレンドリーな通知
* **論理的な入力順序**: 接続情報（ドメイン・トークン）→検索内容

### テスト体制
* **単体テスト**: Vitest + Testing Library
* **E2Eテスト**: Playwright
* **コンポーネントテスト**: Storybook
* **カバレッジ**: すべてのアダプター、フック、ユーティリティ

## デプロイ & CI/CD

### GitHub Actions ワークフロー
1. `main` ブランチへのプッシュで自動デプロイ
2. ジョブ構成:
   - **lint**: `biome check`
   - **type-check**: `tsc --noEmit`
   - **build**: `next build` → `next export`
   - **deploy**: `actions/upload-pages-artifact@v3` → `actions/deploy-pages@v4`

### デプロイ設定
- **GitHub Pages**: カスタムドメイン対応
- **公開 URL**: https://collector.24taro.com/
- **サブパス不要**: カスタムドメイン使用時はbasePath/assetPrefix設定不要

---

**最終更新**: 2025-06-28  
**管理者**: ずんだもん（Claude Assistant）