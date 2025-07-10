# Zenn 統合実装計画書

## 1. 実装概要

**GitHub Issue**: [#240 feat(zenn): Zenn統合機能の実装](https://github.com/24taro/notebooklm-collector/issues/240)  
**仕様書**: [docs/zenn-integration-specs.md](./zenn-integration-specs.md)

## 2. 実装戦略

### 2.1 基本方針
1. **既存パターンの踏襲**: Docbase 統合の実装パターンを基に構築
2. **段階的実装**: Phase 単位での実装で、早期の動作確認を実現
3. **品質重視**: テスト駆動開発でバグを最小化
4. **ユーザー体験統一**: 既存の 2 つの媒体と同じ操作感を実現

### 2.2 技術的制約と対応
| 制約 | 対応策 |
|------|--------|
| 非公式 API | 適切なエラーハンドリング・リトライ機能 |
| 記事本文取得不可 | メタデータ中心の価値提供・明確な説明 |
| レート制限不明 | 指数バックオフによる自動調整 |
| 仕様変更リスク | アダプターパターンによる影響局所化 |

## 3. 詳細実装ステップ

### Phase 1: 基盤実装（Priority: High）

#### 3.1.1 型定義作成 (`src/types/zenn.ts`)
**推定工数**: 2 時間  
**依存関係**: なし

```typescript
// 実装内容の概要
export interface ZennArticle {
  id: number;
  title: string;
  slug: string;
  article_type: "tech" | "idea";
  published_at: string;
  liked_count: number;
  user: ZennUser;
  publication: ZennPublication | null;
  // 詳細フィールド
}

export interface ZennSearchParams {
  username?: string;
  order?: string;
  page?: number;
  keyword?: string;
}
```

**実装ポイント**:
- 調査済みの API レスポンス構造に基づく厳密な型定義
- 既存の Docbase・Slack 型定義との一貫性確保
- 将来の拡張性を考慮したオプショナルフィールド設計

#### 3.1.2 エラー型拡張 (`src/types/error.ts`)
**推定工数**: 1 時間  
**依存関係**: 3.1.1

```typescript
// 追加内容
export type ZennSpecificApiError = { 
  type: 'zenn_api'; 
  message: string;
}

export type ApiError = 
  | NetworkApiError
  | UnauthorizedApiError
  // ...既存の型
  | ZennSpecificApiError // 追加
```

#### 3.1.3 アダプター実装 (`src/adapters/zennAdapter.ts`)
**推定工数**: 4 時間  
**依存関係**: 3.1.1, 3.1.2

**実装内容**:
- HttpClient を使った Zenn API 呼び出し
- ページネーション処理（最大 5 ページ、100 件/ページ）
- Result 型による統一エラーハンドリング
- クエリパラメータの適切な構築

**参考実装**: `src/adapters/docbaseAdapter.ts`

#### 3.1.4 単体テスト作成
**推定工数**: 3 時間  
**依存関係**: 3.1.1, 3.1.2, 3.1.3

- `src/__tests__/adapters/zennAdapter.test.ts`
- モックを使った API 呼び出しテスト
- エラーシナリオのテスト
- ページネーション処理のテスト

**Phase 1 完了条件**: 
- [ ] 型定義完了・型エラーなし
- [ ] アダプター実装完了・単体テスト通過
- [ ] エラーハンドリング検証完了

---

### Phase 2: ビジネスロジック実装（Priority: High）

#### 3.2.1 カスタムフック実装 (`src/hooks/useZennSearch.ts`)
**推定工数**: 4 時間  
**依存関係**: Phase 1 完了

**実装内容**:
- React 状態管理（articles, isLoading, error）
- 検索実行ロジック
- エラーハンドリング・ユーザー通知
- リトライ機能

**参考実装**: `src/hooks/useSearch.ts`

#### 3.2.2 Markdown 生成実装 (`src/utils/zennMarkdownGenerator.ts`)
**推定工数**: 5 時間  
**依存関係**: Phase 1 完了

**実装内容**:
- LLM 最適化 YAML Front Matter
- 階層的見出し構造（Collection Overview, Index, Content）
- 記事メタデータの構造化表示
- 内部リンク・目次機能

**参考実装**: `src/utils/markdownGenerator.ts`

#### 3.2.3 クライアント実装 (`src/lib/zennClient.ts`)
**推定工数**: 2 時間  
**依存関係**: 3.2.1

**実装内容**:
- デフォルトアダプターインスタンス提供
- 下位互換性レイヤー
- 統一インターフェース実装

#### 3.2.4 単体テスト作成
**推定工数**: 4 時間  
**依存関係**: 3.2.1, 3.2.2

- `src/__tests__/hooks/useZennSearch.test.ts`
- `src/__tests__/utils/zennMarkdownGenerator.test.ts`
- モック環境での動作検証
- Markdown 出力品質のテスト

**Phase 2 完了条件**: 
- [ ] カスタムフック実装完了・テスト通過
- [ ] Markdown 生成実装完了・出力品質確認
- [ ] 既存パターンとの整合性確認

---

### Phase 3: UI 実装（Priority: Medium）

#### 3.3.1 ページコンポーネント (`src/app/zenn/page.tsx`)
**推定工数**: 3 時間  
**依存関係**: Phase 2 完了

**実装内容**:
- Docbase ページと同等のレイアウト
- ヒーローセクション・使い方説明
- セキュリティ・制限事項の説明
- SearchForm 配置

**参考実装**: `src/app/docbase/page.tsx`

#### 3.3.2 検索フォーム (`src/components/ZennSearchForm.tsx`)
**推定工数**: 5 時間  
**依存関係**: 3.3.1

**実装内容**:
- キーワード検索フィールド
- ユーザー名入力（任意）
- 詳細検索オプション（記事タイプ、いいね数など）
- プレビュー・ダウンロード機能統合

**参考実装**: `src/components/DocbaseSearchForm.tsx`

#### 3.3.3 入力コンポーネント (`src/components/ZennUsernameInput.tsx`)
**推定工数**: 2 時間  
**依存関係**: 3.3.2

**実装内容**:
- ユーザー名入力フィールド
- バリデーション・フォーカス制御
- 既存パターンとの統一

#### 3.3.4 ルーティング・ナビゲーション統合
**推定工数**: 2 時間  
**依存関係**: 3.3.1

- `src/app/page.tsx` の更新
- ナビゲーションリンク追加
- メタデータ設定

**Phase 3 完了条件**: 
- [ ] ページアクセス可能・基本動作確認
- [ ] 検索フォーム実装完了・検索実行可能
- [ ] プレビュー・ダウンロード機能動作確認

---

### Phase 4: テスト・最終化（Priority: Medium）

#### 3.4.1 結合テスト
**推定工数**: 3 時間  
**依存関係**: Phase 3 完了

- E2E 動作確認
- エラーシナリオテスト
- パフォーマンステスト
- ブラウザ互換性確認

#### 3.4.2 エラーメッセージ対応 (`src/utils/errorMessage.ts`)
**推定工数**: 2 時間  
**依存関係**: 3.4.1

**実装内容**:
- Zenn 固有エラーの対応
- ユーザーフレンドリーメッセージ
- アクション提案機能

#### 3.4.3 ドキュメント更新
**推定工数**: 2 時間  
**依存関係**: 3.4.1

- README.md の更新
- CLAUDE.md の API 仕様追加
- 使い方ガイド作成

**Phase 4 完了条件**: 
- [ ] 全機能の動作確認完了
- [ ] エラーハンドリング検証完了
- [ ] ドキュメント更新完了

## 4. 優先順位マトリックス

| タスク | 重要度 | 緊急度 | 優先度 | 推定工数 |
|--------|--------|--------|--------|----------|
| Phase 1: 基盤実装 | High | High | 1 | 10 時間 |
| Phase 2: ビジネスロジック | High | Medium | 2 | 15 時間 |
| Phase 3: UI 実装 | Medium | Medium | 3 | 12 時間 |
| Phase 4: テスト・最終化 | Medium | Low | 4 | 7 時間 |

**総推定工数**: 44 時間（5.5 日相当）

## 5. リスク管理

### 5.1 技術リスク

| リスク | 影響度 | 発生確率 | 対応策 |
|--------|--------|----------|--------|
| Zenn API 仕様変更 | High | Medium | アダプターパターンによる影響局所化 |
| レート制限による制約 | Medium | Medium | 適切なリトライ・エラーハンドリング |
| パフォーマンス問題 | Medium | Low | 段階的最適化・キャッシュ機能検討 |

### 5.2 スケジュールリスク

| リスク | 対応策 |
|--------|--------|
| 工数超過 | Phase 単位での中間確認・早期問題発見 |
| 品質問題 | テスト駆動開発・継続的な品質チェック |
| 統合問題 | 既存パターンの厳密な踏襲・コードレビュー |

## 6. 成功指標・検証項目

### 6.1 機能検証
- [ ] Zenn 記事の検索・取得が正常動作
- [ ] Docbase と同等の UI/UX を実現
- [ ] LLM 最適化 Markdown の品質確認
- [ ] エラーハンドリングの適切性確認

### 6.2 非機能検証
- [ ] 既存アーキテクチャとの整合性
- [ ] テストカバレッジ 80% 以上
- [ ] パフォーマンス（検索 5 秒以内）
- [ ] アクセシビリティ準拠

### 6.3 ユーザビリティ検証
- [ ] 操作の一貫性（Docbase・Slack との統一感）
- [ ] エラーメッセージの分かりやすさ
- [ ] 検索結果の有用性
- [ ] ダウンロードファイルの品質

## 7. 次ステップ・継続改善

### 7.1 リリース後の改善候補
- Zenn の新機能（Books、Scraps）への対応
- より詳細な検索フィルター追加
- パフォーマンス最適化（キャッシュ機能）
- バッチ検索機能（複数ユーザー同時検索）

### 7.2 技術負債対策
- 非公式 API への依存度削減策の検討
- より柔軟な検索機能の設計
- 統一された媒体管理システムの構築

---

**作成日**: 2024-12-10  
**最終更新**: 2024-12-10  
**関連 Issue**: [#240](https://github.com/24taro/notebooklm-collector/issues/240)