// ZennMarkdownGeneratorのテスト
// 記事データからMarkdown生成の動作を検証

import { describe, expect, it } from "vitest";
import {
  generateZennMarkdown,
  generateZennMarkdownForPreview,
} from "../../utils/zennMarkdownGenerator";
import type { ZennArticle } from "../../types/zenn";

describe("zennMarkdownGenerator", () => {
  const mockUser = {
    id: 1,
    username: "testuser",
    name: "テストユーザー",
    avatar_small_url: "https://example.com/avatar.jpg",
  };

  const mockPublication = {
    id: 1,
    name: "testpub",
    avatar_small_url: "https://example.com/pub-avatar.jpg",
    display_name: "テストPublication",
    beta_stats: false,
    avatar_registered: true,
  };

  const mockArticle1: ZennArticle = {
    id: 1,
    post_type: "Article",
    title: "React入門ガイド",
    slug: "react-beginner-guide",
    published: true,
    comments_count: 5,
    liked_count: 42,
    body_letters_count: 3000,
    article_type: "tech",
    emoji: "📚",
    is_suspending_private: false,
    published_at: "2024-01-01T00:00:00.000Z",
    body_updated_at: "2024-01-01T00:00:00.000Z",
    source_repo_updated_at: "2024-01-01T00:00:00.000Z",
    path: "/testuser/articles/react-beginner-guide",
    user: mockUser,
    publication: mockPublication,
  };

  const mockArticle2: ZennArticle = {
    id: 2,
    post_type: "Article",
    title: "プログラミングのアイデア",
    slug: "programming-ideas",
    published: true,
    comments_count: 2,
    liked_count: 15,
    body_letters_count: 1500,
    article_type: "idea",
    emoji: "💡",
    is_suspending_private: false,
    published_at: "2024-01-02T00:00:00.000Z",
    body_updated_at: "2024-01-02T00:00:00.000Z",
    source_repo_updated_at: "2024-01-02T00:00:00.000Z",
    path: "/testuser/articles/programming-ideas",
    user: mockUser,
    publication: null,
  };

  describe("generateZennMarkdown", () => {
    it("空の配列の場合は空文字列を返す", () => {
      const result = generateZennMarkdown([]);
      expect(result).toBe("");
    });

    it("nullまたはundefinedの場合は空文字列を返す", () => {
      // @ts-expect-error nullまたはundefinedのテスト用
      const resultNull = generateZennMarkdown(null);
      // @ts-expect-error nullまたはundefinedのテスト用
      const resultUndefined = generateZennMarkdown(undefined);
      expect(resultNull).toBe("");
      expect(resultUndefined).toBe("");
    });

    it("記事リストから正しいMarkdownを生成する", () => {
      const result = generateZennMarkdown([mockArticle1, mockArticle2], {
        searchKeyword: "React",
      });

      // YAML Front Matterが含まれていることを確認
      expect(result).toContain("---");
      expect(result).toContain('source: "zenn"');
      expect(result).toContain("total_articles: 2");
      expect(result).toContain('search_keyword: "React"');
      expect(result).toContain('article_types: ["tech", "idea"]');

      // メインタイトルが含まれていることを確認
      expect(result).toContain("# Zenn Articles Collection");

      // Collection Overviewが含まれていることを確認
      expect(result).toContain("## Collection Overview");
      expect(result).toContain("- **総記事数**: 2 件");

      // Articles Indexが含まれていることを確認
      expect(result).toContain("## Articles Index");
      expect(result).toContain("1. [React入門ガイド](#article-1)");
      expect(result).toContain("2. [プログラミングのアイデア](#article-2)");

      // 各記事のコンテンツが含まれていることを確認
      expect(result).toContain("## Articles Content");
      expect(result).toContain("### Article 1 {#article-1}");
      expect(result).toContain("### Article 2 {#article-2}");
    });

    it("検索キーワードなしでもMarkdownを生成する", () => {
      const result = generateZennMarkdown([mockArticle1]);

      // search_keywordが含まれていないことを確認
      expect(result).not.toContain("search_keyword:");
      expect(result).toContain("total_articles: 1");
    });

    it("ユーザー名オプションを含むMarkdownを生成する", () => {
      const result = generateZennMarkdown([mockArticle1], {
        searchUsername: "testuser",
      });

      expect(result).toContain('search_username: "testuser"');
      expect(result).toContain("- **対象ユーザー**: @testuser");
    });

    it("フィルター条件を含むMarkdownを生成する", () => {
      const result = generateZennMarkdown([mockArticle1], {
        filterCriteria: {
          articleType: "tech",
          minLikes: 30,
        },
        totalOriginalCount: 10,
      });

      expect(result).toContain("total_before_filter: 10");
      expect(result).toContain("filtered_count: 1");
      expect(result).toContain("### 適用されたフィルター");
      expect(result).toContain("- 記事タイプ: tech");
      expect(result).toContain("- 最小いいね数: 30以上");
    });

    it("記事タイプを正しく処理する", () => {
      const result = generateZennMarkdown([mockArticle1, mockArticle2]);

      // tech記事とidea記事の表示を確認
      expect(result).toContain("🔧tech");
      expect(result).toContain("💡idea");
      expect(result).toContain("🔧 技術記事");
      expect(result).toContain("💡 アイデア記事");
    });

    it("Publicationありとなしの記事を正しく処理する", () => {
      const result = generateZennMarkdown([mockArticle1, mockArticle2]);

      // Publication情報を確認
      expect(result).toContain('publications: ["テストPublication"]');
      expect(result).toContain("**Publication**: テストPublication");
    });

    it("記事メタデータが正しく表示される", () => {
      const result = generateZennMarkdown([mockArticle1]);

      // YAMLメタデータブロック
      expect(result).toContain("```yaml");
      expect(result).toContain("zenn_id: 1");
      expect(result).toContain('title: "React入門ガイド"');
      expect(result).toContain('slug: "react-beginner-guide"');
      expect(result).toContain('article_type: "tech"');
      expect(result).toContain("liked_count: 42");
      expect(result).toContain("comments_count: 5");
      expect(result).toContain('emoji: "📚"');
      expect(result).toContain('author: "テストユーザー"');
      expect(result).toContain('author_username: "testuser"');

      // Document Information
      expect(result).toContain("## Document Information");
      expect(result).toContain("- **著者**: テストユーザー (@testuser)");
      expect(result).toContain("- **いいね数**: ❤️ 42");
      expect(result).toContain("- **コメント数**: 💬 5");
    });

    it("日付範囲を正しく計算する", () => {
      const result = generateZennMarkdown([mockArticle1, mockArticle2]);

      expect(result).toContain('date_range: "2024-01-01 - 2024-01-02"');
      expect(result).toContain("- **対象期間**: 2024/1/1 - 2024/1/2");
    });

    it("同じ日付の記事のみの場合、日付範囲が単一日付になる", () => {
      const result = generateZennMarkdown([mockArticle1]);

      expect(result).toContain('date_range: "2024-01-01 - 2024-01-01"');
      expect(result).toContain("- **対象期間**: 2024/1/1");
    });

    it("著者が10人以下の場合は全員リストアップする", () => {
      const result = generateZennMarkdown([mockArticle1, mockArticle2]);

      expect(result).toContain('authors: ["testuser"]');
      expect(result).toContain("- **著者数**: 1 人");
    });

    it("著者が10人を超える場合は制限する", () => {
      const manyAuthorsArticles = Array.from({ length: 15 }, (_, i) => ({
        ...mockArticle1,
        id: i + 1,
        user: {
          ...mockUser,
          username: `user${i + 1}`,
          name: `ユーザー${i + 1}`,
        },
      }));

      const result = generateZennMarkdown(manyAuthorsArticles);

      expect(result).toContain("total_authors: 15");
      expect(result).toContain("authors_sample:");
      expect(result).toContain("- **著者数**: 15 人");
    });
  });

  describe("generateZennMarkdownForPreview", () => {
    it("空の配列の場合は空文字列を返す", () => {
      const result = generateZennMarkdownForPreview([]);
      expect(result).toBe("");
    });

    it("記事リストからプレビュー用Markdownを生成する", () => {
      const result = generateZennMarkdownForPreview(
        [mockArticle1, mockArticle2],
        "React"
      );

      // プレビュー用ヘッダー
      expect(result).toContain('# 検索結果プレビュー: "React"');
      expect(result).toContain("**表示件数**: 2 件");

      // 各記事のプレビュー
      expect(result).toContain("## 📚 React入門ガイド");
      expect(result).toContain("## 💡 プログラミングのアイデア");
      expect(result).toContain("**公開日**: 2024/01/01");
      expect(result).toContain("**著者**: テストユーザー (@testuser)");
      expect(result).toContain("**タイプ**: 🔧 技術記事");
      expect(result).toContain("**いいね**: ❤️ 42");
    });

    it("検索キーワードなしでもプレビューを生成する", () => {
      const result = generateZennMarkdownForPreview([mockArticle1]);

      expect(result).toContain("# Zenn記事プレビュー");
      expect(result).not.toContain("検索結果プレビュー:");
    });

    it("記事の要約情報が含まれる", () => {
      const result = generateZennMarkdownForPreview([mockArticle1]);

      expect(result).toContain("この技術記事は 3,000 文字で構成されており");
      expect(result).toContain("42件のいいねと5件のコメントを獲得しています");
    });

    it("Publicationありの記事でPublicationが表示される", () => {
      const result = generateZennMarkdownForPreview([mockArticle1]);

      expect(result).toContain("**Publication**: テストPublication");
    });

    it("Zenn記事へのリンクが含まれる", () => {
      const result = generateZennMarkdownForPreview([mockArticle1]);

      expect(result).toContain("[Zenn記事を見る](https://zenn.dev/testuser/articles/react-beginner-guide)");
    });
  });
});