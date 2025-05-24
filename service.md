| ID | 画面名      | 主なコンポーネント                                                                  | 機能概要                          |
| -- | ----- | ----- | ----- |
| S1 | **検索画面** | `SearchForm`, `DocbaseDomainInput`, `DocbaseTokenInput`, `MarkdownPreview`, `AdvancedSearchFilters` (タグ、投稿者、タイトル、投稿期間、グループ入力欄) | 検索実行・Markdown 生成・DL |

---

## 2. 機能要件

### 2.1 データ取得フロー（フロントエンド fetch）

| フェーズ | メソッド & エンドポイント                   | 認証ヘッダー           | パラメータ                             | 目的                                       |
| ---- | ----- | ---- | --- | ---- |
| 検索   | `GET /teams/{domain}/posts`      | `X-DocBaseToken` | `q` (キーワードおよび詳細検索条件。詳細は2.1.1参照), `page`, `per_page` | 該当メモの **ID・title・created_at・url・body** を取得             |

### 2.1.1 詳細検索条件

ユーザーが入力した詳細検索条件は、メインの検索キーワードと組み合わせて Docbase API の検索クエリパラメータ `q` にAND条件として結合されます。

| 条件       | Docbase API クエリ形式                  | 例                                         |
| ---------- | --------------------------------------- | ------------------------------------------ |
| タグ       | `tag:タグ名`                            | `tag:API tag:設計` (複数指定可、カンマ区切り入力) |
| 投稿者     | `author:ユーザーID`                     | `author:user123`                           |
| タイトル   | `title:キーワード`                      | `title:仕様書`                             |
| 投稿期間   | `created_at:YYYY-MM-DD~YYYY-MM-DD`      | `created_at:2023-01-01~2023-12-31`         |
|            | `created_at:YYYY-MM-DD~*` (開始日のみ)  | `created_at:2024-01-01~*`                  |
|            | `created_at:*~YYYY-MM-DD` (終了日のみ)  | `created_at:*~2024-03-31`                  |
| グループ   | `group:グループ名`                      | `group:開発チーム`                         |

例: キーワード「バグ報告」、タグ「iOS」、投稿者「dev_user」、タイトル「クラッシュ」、投稿期間「2024-01-01から」、グループ「モバイル班」の場合の `q` パラメータ
`"バグ報告" tag:iOS author:dev_user title:クラッシュ created_at:2024-01-01~* group:モバイル班`

### 2.2 Markdown 生成

* 投稿ごとに以下のテンプレートで追加。 