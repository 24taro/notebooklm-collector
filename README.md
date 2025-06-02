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

### ディレクトリ構成

```
src/
├── app/          # Next.js App Router
│   ├── docbase/  # Docbase連携ページ
│   └── slack/    # Slack連携ページ
├── components/   # UIコンポーネント
├── hooks/        # カスタムフック
├── lib/          # APIクライアント
├── types/        # 型定義
├── utils/        # ユーティリティ
└── adapters/     # 外部依存抽象化
```

## 👩‍💻 開発者向け

### 開発コマンド

```bash
# 開発・ビルド
npm run dev              # 開発サーバー起動 (Turbopack)
npm run build            # 本番ビルド
npm run start            # 本番サーバー起動

# コード品質
npm run lint             # Biome lintチェック
npm run lint:fix         # Biome lint自動修正
npm run format           # Biome format
npm run type-check       # TypeScript型チェック

# テスト
npm run test             # Vitestユニットテスト
npm run test:watch       # Vitestウォッチモード
npm run test:coverage    # カバレッジ付きテスト
npm run test:ui          # Vitest UI
npm run test:e2e         # Playwright E2Eテスト
npm run test:e2e:ui      # Playwright UI
npm run test:e2e:debug   # Playwright デバッグ

# Storybook
npm run storybook        # Storybook開発サーバー
npm run build-storybook  # Storybookビルド
npm run storybook:test   # Storybook E2Eテスト
```

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