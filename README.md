# NotebookLM Collector

DocbaseとSlackから情報を収集し、NotebookLM向けに最適化されたMarkdownファイルを生成するWebアプリケーションです。

## 🎯 概要

NotebookLM Collectorは、**ブラウザ完結型**でセキュアな情報収集ツールです。APIトークンや取得データは外部サーバーに送信されることなく、すべてユーザーのブラウザ内で処理されます。

### 主要機能

- **Docbase連携**: 記事検索・取得（最大500件）
- **Slack連携**: スレッド検索・収集（最大300件）  
- **NotebookLM最適化**: YAML Front Matter付きMarkdown生成
- **セキュア処理**: ブラウザ内完結、外部送信なし
- **LocalStorage対応**: APIトークンの自動保存・復元

### 機能比較

| 機能 | Docbase | Slack |
|------|---------|-------|
| 検索方式 | 記事単位 | スレッド単位 |
| 最大取得件数 | 500件 | 300件 |
| 詳細検索 | タグ、投稿者、期間、グループ | チャンネル、投稿者、期間 |
| 認証方式 | API Token | User Token (xoxp-) |

## 🚀 セットアップ

### 必要な環境

- Node.js 18.x以上
- npm、yarn、pnpm、bunのいずれか

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/sotaroNishioka/notebooklm-collector.git
cd notebooklm-collector

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

## 🔑 APIトークン設定

### Docbase APIトークン

1. Docbaseにログインし、設定画面に移動
2. 「API」タブを選択
3. 「新しいトークンを作成」をクリック
4. トークンをコピーし、アプリの「Docbaseドメイン」欄に `{team}` 部分、「APIトークン」欄にトークンを入力

### Slack APIトークン

1. [Slack API](https://api.slack.com/apps) にアクセス
2. 「Create New App」→「From scratch」を選択
3. App NameとWorkspaceを設定
4. 「OAuth & Permissions」で以下のスコープを追加：
   - `search:read` - メッセージ検索
   - `users:read` - ユーザー情報取得
   - `channels:read` - チャンネル情報取得
5. 「Install to Workspace」でアプリをインストール
6. 生成された「User OAuth Token」（`xoxp-`で始まる）をコピー
7. アプリの「Slack APIトークン」欄に入力

## 📖 使用方法

### Docbase連携

1. **認証情報入力**: ドメインとAPIトークンを入力
2. **検索条件設定**: キーワードと詳細フィルター（オプション）
3. **検索実行**: 最大500件の記事を取得
4. **プレビュー確認**: 生成されるMarkdownを確認
5. **ダウンロード**: Markdownファイルをダウンロード

### Slack連携

1. **認証情報入力**: User Tokenを入力
2. **検索条件設定**: 検索クエリと詳細フィルター（オプション）
3. **検索実行**: スレッド単位で最大300件を取得
4. **プレビュー確認**: 最初の10スレッドをプレビュー
5. **ダウンロード**: 全スレッドのMarkdownファイルをダウンロード

### 詳細検索例

#### Docbase
```
# タグ指定
tag:API tag:設計

# 投稿者指定
author:user123

# 期間指定
created_at:2023-01-01~2023-12-31
```

#### Slack
```
# チャンネル指定
重要な議事録 in:#general

# 投稿者指定
API設計 from:@developer

# 期間指定
after:2023-01-01 before:2023-12-31
```

## 🛠️ 技術仕様

### 技術スタック

- **フレームワーク**: Next.js 15.3.2 / React 19
- **言語**: TypeScript 5
- **スタイリング**: Tailwind CSS 4.1.7
- **品質管理**: Biome 1.9.4 (lint/format)
- **テスト**: Vitest 3.1.4 + Playwright 1.52.0
- **Storybook**: 8.6.14
- **エラーハンドリング**: neverthrow Result型
- **デプロイ**: GitHub Pages
- **開発体験**: Turbopack (Next.js dev mode)

### アーキテクチャ

#### ディレクトリ構成

```
src/
├── __tests__/        # テストファイル群（Vitest）
│   ├── adapters/     # アダプターテスト
│   ├── components/   # コンポーネントテスト
│   ├── hooks/        # カスタムフックテスト
│   ├── lib/          # ライブラリテスト
│   └── utils/        # ユーティリティテスト
├── app/             # Next.js App Router
│   ├── docbase/     # Docbase連携ページ
│   ├── slack/       # Slack連携ページ
│   ├── globals.css  # グローバルスタイル
│   └── layout.tsx   # ルートレイアウト
├── components/      # UIコンポーネント（18個）
├── hooks/          # カスタムフック（5個）
├── lib/            # APIクライアント
├── types/          # 型定義
├── utils/          # ユーティリティ関数
└── adapters/       # 外部依存抽象化（アダプターパターン）
```

#### コンポーネント設計

**20個のUIコンポーネント**:
- **認証系**: `DocbaseDomainInput`, `DocbaseTokenInput`, `SlackTokenInput`
- **検索系**: `DocbaseSearchForm`, `SlackSearchForm`, `SearchForm`, `SearchFormWithErrorBoundary`
- **Slack詳細検索**: `SlackAdvancedFilters`, `SlackAuthorInput`, `SlackChannelInput`
- **プレビュー系**: `MarkdownPreview`, `SlackMarkdownPreview`
- **エラーハンドリング**: `ErrorBoundary`, `ErrorBoundaryProvider`, `ErrorFallback`
- **レイアウト**: `Header`, `Footer`, `SlackHeroSection`
- **Storybook**: `MarkdownPreview.stories`, `SlackAdvancedFilters.stories`

**5つのカスタムフック**:
- `useDownload`: ファイルダウンロード機能（blob生成・自動保存）
- `useErrorRecovery`: エラー復旧機能（リトライ・状態リセット）
- `useLocalStorage`: localStorage操作抽象化（型安全・同期）
- `useSearch`: Docbase記事検索機能（状態管理・エラーハンドリング）
- `useSlackSearchUnified`: Slack統合検索（メッセージ・スレッド・ユーザー情報）

**アダプターパターン実装（6ファイル）**:
- 外部API依存を抽象化し、テスタビリティとモック性を向上
- `docbaseAdapter`: Docbase API連携（記事検索・取得）
- `slackAdapter`: Slack API連携（メッセージ検索・スレッド取得・ユーザー情報）
- `fetchHttpClient`: HTTP通信（リトライ機能・エラーハンドリング）
- `mockHttpClient`: テスト用モック（開発・テスト環境）
- `types`: アダプター共通型定義
- `index`: 統一エクスポート

## 👩‍💻 開発者向け

### 開発コマンド（全22のnpmスクリプト）

#### 開発・ビルド（3コマンド）
```bash
npm run dev              # Turbopack開発サーバー起動（高速HMR・ファイル監視）
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

**ユニットテスト（Vitest 3.1.4）**:
```bash
npm run test             # 単体テスト実行（jsdom環境・カスタムフック・ユーティリティ）
npm run test:watch       # ウォッチモード（ファイル変更時自動実行・リアルタイムフィードバック）
npm run test:coverage    # カバレッジ測定（閾値80%・詳細レポート生成）
npm run test:ui          # Vitest Web UI（ブラウザでテスト結果確認・インタラクティブ実行）
```

**E2Eテスト（Playwright 1.52.0）**:
```bash
npm run test:e2e         # Storybook E2Eテスト（Chromium・並列実行・自動化）
npm run test:e2e:ui      # Playwright Test UI（インタラクティブモード・ステップ確認）
npm run test:e2e:debug   # Playwright デバッグモード（ステップ実行・スクリーンショット・詳細ログ）
```

**Storybook（8.6.14）**:
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

### コントリビューション

1. Issueを作成または既存のIssueを確認
2. フィーチャーブランチを作成
3. 変更を実装し、テストを追加
4. プルリクエストを作成

詳細なコーディング規約は [CLAUDE.md](./CLAUDE.md) を参照してください。

## 🔒 セキュリティ

### データ取扱い

- **ブラウザ内完結**: 全ての処理がユーザーのブラウザ内で完了
- **外部送信なし**: APIトークンや取得データは外部サーバーに送信されません
- **LocalStorage**: APIトークンは利便性のためにLocalStorageに保存されます

### 注意事項

- APIトークンは適切な権限のみ付与してください
- 各APIサービスの利用規約を遵守してください
- 機密情報を含むデータの取扱いに注意してください

## 🐛 トラブルシューティング

### よくある問題

**APIトークンエラー**
- トークンの有効性を確認
- 必要な権限（スコープ）が付与されているか確認

**ネットワークエラー**
- インターネット接続を確認
- 企業ファイアウォールの設定を確認

**Markdown生成失敗**
- 検索結果が0件でないか確認
- ブラウザのメモリ不足の可能性

### サポート

問題が発生した場合は、以下のリソースを活用してください：

- [GitHub Issues](https://github.com/sotaroNishioka/notebooklm-collector/issues) - バグ報告・機能要望
- [service.md](./service.md) - 詳細な技術仕様
- [CLAUDE.md](./CLAUDE.md) - 開発ルール・アーキテクチャ

## 📄 ライセンス

このプロジェクトは各APIサービスの利用規約に従って使用してください。

---

## 🌐 デプロイ

このアプリケーションは GitHub Pages でホストされています：
**URL**: [https://sotaronishioka.github.io/notebooklm-collector/](https://sotaronishioka.github.io/notebooklm-collector/)

### GitHub Pages デプロイ仕様

- **ワークフロー**: `.github/workflows/deploy.yml`
- **トリガー**: `main` ブランチへのプッシュ
- **ビルド**: Next.js Static Export (`next build && next export`)
- **配信**: GitHub Pages 静的サイトホスティング

---

**NotebookLM Collector v0.1.0**  
🤖 Generated with [Claude Code](https://claude.ai/code)