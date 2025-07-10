import { describe, expect, it } from "vitest";
import type { QiitaItem } from "../../features/qiita/types/qiita";
import {
  generateQiitaMarkdown,
  generateQiitaPreviewMarkdown,
} from "../../features/qiita/utils/qiitaMarkdownGenerator";

describe("qiitaMarkdownGenerator", () => {
  const mockQiitaItems: QiitaItem[] = [
    {
      id: "c686397e4a0f4f11683d",
      title: "React 18の新機能完全ガイド",
      body: "# React 18について\n\nReact 18の新機能を詳しく解説します。",
      rendered_body:
        "<h1>React 18について</h1><p>React 18の新機能を詳しく解説します。</p>",
      created_at: "2024-01-15T10:30:00+09:00",
      updated_at: "2024-01-15T12:00:00+09:00",
      url: "https://qiita.com/example/items/c686397e4a0f4f11683d",
      user: {
        id: "example_user",
        name: "Example User",
        profile_image_url: "https://example.com/profile.png",
        description: "フロントエンドエンジニア",
        github_login_name: "example_user",
        twitter_screen_name: "example_user",
        website_url: "https://example.com",
        organization: "Example Inc.",
        location: "Tokyo, Japan",
        followees_count: 100,
        followers_count: 200,
        items_count: 50,
        permanent_id: 12345,
        team_only: false,
        facebook_id: "",
        linkedin_id: "",
      },
      tags: [
        { name: "React", versions: ["18"] },
        { name: "JavaScript", versions: ["ES2022"] },
      ],
      likes_count: 150,
      comments_count: 12,
      stocks_count: 89,
      reactions_count: 150,
      page_views_count: 2500,
      private: false,
      coediting: false,
      group: null,
    },
    {
      id: "d787498f5b1f5f22794e",
      title: "TypeScriptとReactのベストプラクティス",
      body: "# TypeScriptについて\n\nTypeScriptを使ったReact開発のコツを紹介します。\n\n## 型定義\n\n型安全性を保つために...",
      rendered_body:
        "<h1>TypeScriptについて</h1><p>TypeScriptを使ったReact開発のコツを紹介します。</p>",
      created_at: "2024-01-14T15:45:00+09:00",
      updated_at: "2024-01-14T16:00:00+09:00",
      url: "https://qiita.com/another/items/d787498f5b1f5f22794e",
      user: {
        id: "another_user",
        name: "Another User",
        profile_image_url: "https://example.com/profile2.png",
        description: "TypeScript愛好家",
        github_login_name: "another_user",
        twitter_screen_name: "another_user",
        website_url: "",
        organization: "",
        location: "Osaka, Japan",
        followees_count: 50,
        followers_count: 75,
        items_count: 25,
        permanent_id: 67890,
        team_only: false,
        facebook_id: "",
        linkedin_id: "",
      },
      tags: [
        { name: "TypeScript", versions: ["5.0"] },
        { name: "React", versions: ["18"] },
      ],
      likes_count: 95,
      comments_count: 8,
      stocks_count: 65,
      reactions_count: 95,
      page_views_count: 1800,
      private: false,
      coediting: false,
      group: null,
    },
    {
      id: "e898509f6c2f6f33905f",
      title: "Next.js 14のApp Routerを使った開発",
      body: "# Next.js 14について\n\nApp Routerの使い方を詳しく解説します。",
      rendered_body:
        "<h1>Next.js 14について</h1><p>App Routerの使い方を詳しく解説します。</p>",
      created_at: "2024-01-13T09:15:00+09:00",
      updated_at: "2024-01-13T10:00:00+09:00",
      url: "https://qiita.com/nextjs_dev/items/e898509f6c2f6f33905f",
      user: {
        id: "nextjs_dev",
        name: "Next.js Developer",
        profile_image_url: "https://example.com/profile3.png",
        description: "Next.js専門開発者",
        github_login_name: "nextjs_dev",
        twitter_screen_name: "nextjs_dev",
        website_url: "https://nextjsdev.com",
        organization: "Next.js Team",
        location: "San Francisco, CA",
        followees_count: 80,
        followers_count: 300,
        items_count: 75,
        permanent_id: 98765,
        team_only: false,
        facebook_id: "",
        linkedin_id: "",
      },
      tags: [
        { name: "Next.js", versions: ["14"] },
        { name: "React", versions: ["18"] },
      ],
      likes_count: 200,
      comments_count: 15,
      stocks_count: 120,
      reactions_count: 200,
      page_views_count: null, // nullケースのテスト
      private: false,
      coediting: false,
      group: null,
    },
  ];

  describe("generateQiitaMarkdown", () => {
    describe("基本機能", () => {
      it("空の配列の場合は空文字列を返す", () => {
        const result = generateQiitaMarkdown([]);
        expect(result).toBe("");
      });

      it("nullまたはundefinedの場合は空文字列を返す", () => {
        expect(generateQiitaMarkdown(null as unknown as QiitaItem[])).toBe("");
        expect(generateQiitaMarkdown(undefined as unknown as QiitaItem[])).toBe(
          ""
        );
      });

      it("記事リストから正しいMarkdownを生成する", () => {
        const result = generateQiitaMarkdown(mockQiitaItems, "React");

        // YAML Front Matterの確認
        expect(result).toContain("---");
        expect(result).toContain('source: "qiita"');
        expect(result).toContain("total_articles: 3");
        expect(result).toContain('search_keyword: "React"');
        expect(result).toContain('date_range: "2024-01-13 - 2024-01-15"');
        expect(result).toContain("generated_at:");

        // エンゲージメント統計の確認
        expect(result).toContain("total_likes: 445"); // 150 + 95 + 200
        expect(result).toContain("total_stocks: 274"); // 89 + 65 + 120
        expect(result).toContain("total_comments: 35"); // 12 + 8 + 15

        // メインタイトルの確認
        expect(result).toContain("# Qiita Articles Collection");

        // 概要セクションの確認
        expect(result).toContain("## Collection Overview");
        expect(result).toContain("- **Total Articles**: 3");
        expect(result).toContain('- **Search Keyword**: "React"');
        expect(result).toContain(
          "- **Source**: Qiita Knowledge Sharing Platform"
        );
        expect(result).toContain(
          "- **Total Engagement**: 👍 445 likes, 📚 274 stocks, 💬 35 comments"
        );

        // 目次の確認
        expect(result).toContain("## Articles Index");
        expect(result).toContain(
          "1. [React 18の新機能完全ガイド](#article-1) - 2024/1/15 by Example User"
        );
        expect(result).toContain(
          "2. [TypeScriptとReactのベストプラクティス](#article-2) - 2024/1/14 by Another User"
        );
        expect(result).toContain(
          "3. [Next.js 14のApp Routerを使った開発](#article-3) - 2024/1/13 by Next.js Developer"
        );

        // 記事内容の確認
        expect(result).toContain("## Articles Content");
        expect(result).toContain("### Article 1");
        expect(result).toContain("### Article 2");
        expect(result).toContain("### Article 3");
      });

      it("検索キーワードなしでもMarkdownを生成する", () => {
        const result = generateQiitaMarkdown(mockQiitaItems);

        // 検索キーワードが含まれないことを確認
        expect(result).not.toContain("search_keyword:");
        expect(result).not.toContain("- **Search Keyword**:");

        // その他の基本要素は含まれることを確認
        expect(result).toContain("# Qiita Articles Collection");
        expect(result).toContain("total_articles: 3");
      });
    });

    describe("日付処理", () => {
      it("同じ日付の記事のみの場合、date_rangeが単一日付になる", () => {
        const sameDayItems = [
          {
            ...mockQiitaItems[0],
            created_at: "2024-01-15T10:00:00+09:00",
          },
          {
            ...mockQiitaItems[1],
            created_at: "2024-01-15T15:00:00+09:00",
          },
        ];

        const result = generateQiitaMarkdown(sameDayItems);

        expect(result).toContain('date_range: "2024-01-15 - 2024-01-15"');
        // Collection Overviewでの日付表示は単一日付になる
        expect(result).toMatch(/- \*\*Date Range\*\*: 2024\/1\/15/);
      });

      it("複数の日付範囲を正しく処理する", () => {
        const result = generateQiitaMarkdown(mockQiitaItems);

        expect(result).toContain('date_range: "2024-01-13 - 2024-01-15"');
        expect(result).toMatch(
          /- \*\*Date Range\*\*: 2024\/1\/13 - 2024\/1\/15/
        );
      });

      it("記事の日付が正しく日本語形式でフォーマットされる", () => {
        const result = generateQiitaMarkdown([mockQiitaItems[0]]);

        // 記事詳細での日付表示
        expect(result).toMatch(/\*\*Created\*\*: 2024年1月15日月曜日/);
      });
    });

    describe("記事メタデータの処理", () => {
      it("記事のYAML Front Matterが正しく生成される", () => {
        const result = generateQiitaMarkdown([mockQiitaItems[0]]);

        expect(result).toContain('qiita_id: "c686397e4a0f4f11683d"');
        expect(result).toContain('title: "React 18の新機能完全ガイド"');
        expect(result).toContain('created_at: "2024-01-15T01:30:00.000Z"');
        expect(result).toContain('updated_at: "2024-01-15T03:00:00.000Z"');
        expect(result).toContain(
          'url: "https://qiita.com/example/items/c686397e4a0f4f11683d"'
        );
        expect(result).toContain('author: "example_user"');
        expect(result).toContain('author_name: "Example User"');
        expect(result).toContain('tags: ["React", "JavaScript"]');
        expect(result).toContain("likes_count: 150");
        expect(result).toContain("stocks_count: 89");
        expect(result).toContain("comments_count: 12");
        expect(result).toContain("page_views_count: 2500");
      });

      it("page_views_countがnullの場合は出力されない", () => {
        const result = generateQiitaMarkdown([mockQiitaItems[2]]); // page_views_count: null

        expect(result).not.toContain("page_views_count:");
      });

      it("記事の基本情報が正しく表示される", () => {
        const result = generateQiitaMarkdown([mockQiitaItems[0]]);

        expect(result).toContain("- **Author**: Example User (@example_user)");
        expect(result).toContain("- **Document ID**: c686397e4a0f4f11683d");
        expect(result).toContain("- **Tags**: React, JavaScript");
        expect(result).toContain(
          "- **Engagement**: 👍 150 likes, 📚 89 stocks, 💬 12 comments, 👀 2500 views"
        );
      });

      it("著者の組織・場所情報が表示される", () => {
        const result = generateQiitaMarkdown([mockQiitaItems[0]]);

        expect(result).toContain("## Author Information");
        expect(result).toContain("- **Organization**: Example Inc.");
        expect(result).toContain("- **Location**: Tokyo, Japan");
        expect(result).toContain("- **Total Articles**: 50");
      });

      it("著者情報がない場合はAuthor Informationセクションが表示されない", () => {
        const itemWithoutOrgLocation = {
          ...mockQiitaItems[1],
          user: {
            ...mockQiitaItems[1].user,
            organization: "",
            location: "",
          },
        };

        const result = generateQiitaMarkdown([itemWithoutOrgLocation]);

        expect(result).not.toContain("## Author Information");
      });

      it("記事本文がそのまま含まれる", () => {
        const result = generateQiitaMarkdown([mockQiitaItems[0]]);

        expect(result).toContain("## Content");
        expect(result).toContain("# React 18について");
        expect(result).toContain("React 18の新機能を詳しく解説します。");
      });
    });

    describe("エンゲージメント情報", () => {
      it("全体のエンゲージメント統計が正しく計算される", () => {
        const result = generateQiitaMarkdown(mockQiitaItems);

        expect(result).toContain("total_likes: 445");
        expect(result).toContain("total_stocks: 274");
        expect(result).toContain("total_comments: 35");
      });

      it("記事ごとのエンゲージメント情報が表示される", () => {
        const result = generateQiitaMarkdown([mockQiitaItems[0]]);

        expect(result).toContain(
          "👍 150 likes, 📚 89 stocks, 💬 12 comments, 👀 2500 views"
        );
      });

      it("page_views_countがnullの場合はviewsが表示されない", () => {
        const result = generateQiitaMarkdown([mockQiitaItems[2]]);

        expect(result).toContain("👍 200 likes, 📚 120 stocks, 💬 15 comments");
        expect(result).not.toContain("👀");
        expect(result).not.toContain("views");
      });
    });

    describe("特殊文字・エッジケース", () => {
      it("特殊文字を含むタイトルを正しく処理する", () => {
        const specialItem = {
          ...mockQiitaItems[0],
          title: 'React "Hook" & TypeScript',
        };

        const result = generateQiitaMarkdown([specialItem]);

        expect(result).toContain('# React "Hook" & TypeScript');
      });

      it("空のタグ配列を処理する", () => {
        const noTagItem = {
          ...mockQiitaItems[0],
          tags: [],
        };

        const result = generateQiitaMarkdown([noTagItem]);

        expect(result).toContain("tags: []");
        expect(result).not.toContain("- **Tags**:");
      });

      it("単一記事でも正しくMarkdownを生成する", () => {
        const result = generateQiitaMarkdown([mockQiitaItems[0]]);

        expect(result).toContain("total_articles: 1");
        expect(result).toContain("- **Total Articles**: 1");
        expect(result).toContain("### Article 1");
        expect(result).not.toContain("### Article 2");
      });
    });

    describe("LLM最適化要素", () => {
      it("LLM理解しやすい構造化された見出しを含む", () => {
        const result = generateQiitaMarkdown(mockQiitaItems);

        // 構造化された見出しレベル
        expect(result).toContain("# Qiita Articles Collection");
        expect(result).toContain("## Collection Overview");
        expect(result).toContain("## Articles Index");
        expect(result).toContain("## Articles Content");
        expect(result).toContain("### Article 1");
        expect(result).toContain("## Document Information");
        expect(result).toContain("## Content");
      });

      it("YAML Front Matterにメタデータが適切に含まれる", () => {
        const result = generateQiitaMarkdown(mockQiitaItems, "TypeScript");

        expect(result).toMatch(/^---\n/);
        expect(result).toContain('source: "qiita"');
        expect(result).toContain("total_articles: 3");
        expect(result).toContain('search_keyword: "TypeScript"');
        expect(result).toContain("generated_at:");
        expect(result).toContain("total_likes:");
        expect(result).toContain("total_stocks:");
        expect(result).toContain("total_comments:");
        expect(result).toMatch(/---\n\n/);
      });
    });
  });

  describe("generateQiitaPreviewMarkdown", () => {
    describe("基本機能", () => {
      it("空の配列の場合はメッセージを返す", () => {
        const result = generateQiitaPreviewMarkdown([]);
        expect(result).toBe("検索結果が見つかりませんでした。");
      });

      it("nullまたはundefinedの場合はメッセージを返す", () => {
        expect(
          generateQiitaPreviewMarkdown(null as unknown as QiitaItem[])
        ).toBe("検索結果が見つかりませんでした。");
        expect(
          generateQiitaPreviewMarkdown(undefined as unknown as QiitaItem[])
        ).toBe("検索結果が見つかりませんでした。");
      });

      it("プレビュー用の簡潔なMarkdownを生成する", () => {
        const result = generateQiitaPreviewMarkdown(mockQiitaItems, "React");

        // プレビュータイトル
        expect(result).toContain("# Qiita 検索結果プレビュー");
        expect(result).toContain('**検索キーワード**: "React"');
        expect(result).toContain("**総件数**: 3件");

        // 記事タイトルがH2見出しで表示されることを確認
        expect(result).toContain("## 1. React 18の新機能完全ガイド");
        expect(result).toContain("## 2. TypeScriptとReactのベストプラクティス");
        expect(result).toContain("## 3. Next.js 14のApp Routerを使った開発");

        // YAML Front Matterが含まれないことを確認
        expect(result).not.toContain("---\nsource:");
        expect(result).not.toContain("generated_at:");
      });

      it("検索キーワードなしでもプレビューを生成する", () => {
        const result = generateQiitaPreviewMarkdown(mockQiitaItems);

        // 記事が表示されることを確認
        expect(result).toContain("## 1. React 18の新機能完全ガイド");
        expect(result).not.toContain("**検索キーワード**:");
        expect(result).toContain("**総件数**: 3件");
      });
    });

    describe("記事の表示形式", () => {
      it("記事のメタデータが簡潔に表示される", () => {
        const result = generateQiitaPreviewMarkdown([mockQiitaItems[0]]);

        expect(result).toContain(
          "**投稿者**: Example User | **投稿日**: 2024/1/15 | **👍**: 150 | **📚**: 89"
        );
        expect(result).toContain("**タグ**: `React`, `JavaScript`");
      });

      it("記事内容が150文字で切り詰められる", () => {
        const longBodyItem = {
          ...mockQiitaItems[0],
          body: "あ".repeat(200), // 200文字の長い内容
        };

        const result = generateQiitaPreviewMarkdown([longBodyItem]);

        expect(result).toContain(`${"あ".repeat(150)}...`);
        expect(result).not.toContain("あ".repeat(200));
      });

      it("短い記事内容はそのまま表示される", () => {
        const result = generateQiitaPreviewMarkdown([mockQiitaItems[0]]);

        expect(result).toContain("# React 18について");
        expect(result).toContain("React 18の新機能を詳しく解説します。");
        expect(result).not.toContain("...");
      });

      it("記事リンクが含まれる", () => {
        const result = generateQiitaPreviewMarkdown([mockQiitaItems[0]]);

        expect(result).toContain(
          "[記事を読む](https://qiita.com/example/items/c686397e4a0f4f11683d)"
        );
      });

      it("タグがない記事ではタグ行が表示されない", () => {
        const noTagItem = {
          ...mockQiitaItems[0],
          tags: [],
        };

        const result = generateQiitaPreviewMarkdown([noTagItem]);

        expect(result).not.toContain("**タグ**:");
        expect(result).toContain("**投稿者**: Example User");
      });
    });

    describe("件数制限の処理", () => {
      it("10件を超える場合は最初の10件のみ表示される", () => {
        const manyItems = Array.from({ length: 15 }, (_, i) => ({
          ...mockQiitaItems[0],
          id: `item_${i + 1}`,
          title: `記事 ${i + 1}`,
        }));

        const result = generateQiitaPreviewMarkdown(manyItems);

        expect(result).toContain("**総件数**: 15件 (最初の10件を表示)");
        expect(result).toContain("## 1. 記事 1");
        expect(result).toContain("## 10. 記事 10");
        expect(result).not.toContain("## 11. 記事 11");
        expect(result).toContain(
          "*他に5件の記事があります。ダウンロードして全ての記事を確認してください。*"
        );
      });

      it("10件以下の場合は件数表示に注記が含まれない", () => {
        const result = generateQiitaPreviewMarkdown(mockQiitaItems);

        expect(result).toContain("**総件数**: 3件");
        expect(result).not.toContain("(最初の10件を表示)");
        expect(result).not.toContain("*他に");
      });
    });

    describe("記事間の区切り", () => {
      it("記事が水平線で区切られる", () => {
        const result = generateQiitaPreviewMarkdown(mockQiitaItems);

        // 水平線で区切られることを確認
        const sections = result.split("---\n\n");
        expect(sections.length).toBeGreaterThan(2);
      });
    });
  });
});
