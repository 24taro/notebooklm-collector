import type { GitHubDiscussion, GitHubIssue } from "@/features/github/types/github";
import {
  generateGitHubIssuesMarkdown,
  generateGitHubDiscussionsMarkdown,
  generateGitHubIssuesMarkdownForPreview,
  generateGitHubDiscussionsMarkdownForPreview,
} from "@/features/github/utils/githubMarkdownGenerator";
import { describe, expect, it } from "vitest";

describe("githubMarkdownGenerator", () => {
  const mockIssues: GitHubIssue[] = [
    {
      id: 1,
      node_id: "I_test1",
      number: 123,
      title: "Bug: Login fails with special characters",
      body: "When users try to login with email addresses containing special characters, the login fails.",
      state: "open",
      user: {
        login: "testuser",
        id: 1,
        node_id: "U_test1",
        avatar_url: "https://github.com/avatars/1",
        html_url: "https://github.com/testuser",
        url: "https://api.github.com/users/testuser",
        type: "User",
        site_admin: false,
      },
      labels: [
        {
          id: 1,
          node_id: "L_test1",
          url: "https://api.github.com/repos/test/repo/labels/bug",
          name: "bug",
          description: "Something isn't working",
          color: "d73a4a",
          default: true,
        },
      ],
      assignee: null,
      assignees: [],
      milestone: null,
      comments: 3,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-02T00:00:00Z",
      closed_at: null,
      html_url: "https://github.com/test/repo/issues/123",
      repository_url: "https://api.github.com/repos/test/repo",
    },
    {
      id: 2,
      node_id: "PR_test2",
      number: 124,
      title: "Fix: Add validation for email addresses",
      body: "This PR adds proper validation for email addresses with special characters.",
      state: "closed",
      user: {
        login: "devuser",
        id: 2,
        node_id: "U_test2",
        avatar_url: "https://github.com/avatars/2",
        html_url: "https://github.com/devuser",
        url: "https://api.github.com/users/devuser",
        type: "User",
        site_admin: false,
      },
      labels: [
        {
          id: 2,
          node_id: "L_test2",
          url: "https://api.github.com/repos/test/repo/labels/enhancement",
          name: "enhancement",
          description: "New feature or request",
          color: "a2eeef",
          default: true,
        },
      ],
      assignee: {
        login: "assigneduser",
        id: 3,
        node_id: "U_test3",
        avatar_url: "https://github.com/avatars/3",
        html_url: "https://github.com/assigneduser",
        url: "https://api.github.com/users/assigneduser",
        type: "User",
        site_admin: false,
      },
      assignees: [
        {
          login: "assigneduser",
          id: 3,
          node_id: "U_test3",
          avatar_url: "https://github.com/avatars/3",
          html_url: "https://github.com/assigneduser",
          url: "https://api.github.com/users/assigneduser",
          type: "User",
          site_admin: false,
        },
      ],
      milestone: {
        id: 1,
        node_id: "M_test1",
        number: 1,
        state: "open",
        title: "v1.0",
        description: "First major release",
        creator: {
          login: "testuser",
          id: 1,
          node_id: "U_test1",
          avatar_url: "https://github.com/avatars/1",
          html_url: "https://github.com/testuser",
          url: "https://api.github.com/users/testuser",
          type: "User",
          site_admin: false,
        },
        open_issues: 5,
        closed_issues: 2,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        closed_at: null,
        due_on: "2023-12-31T00:00:00Z",
        html_url: "https://github.com/test/repo/milestone/1",
      },
      comments: 1,
      created_at: "2023-01-02T00:00:00Z",
      updated_at: "2023-01-03T00:00:00Z",
      closed_at: "2023-01-03T00:00:00Z",
      html_url: "https://github.com/test/repo/pull/124",
      repository_url: "https://api.github.com/repos/test/repo",
      pull_request: {
        url: "https://api.github.com/repos/test/repo/pulls/124",
        html_url: "https://github.com/test/repo/pull/124",
        diff_url: "https://github.com/test/repo/pull/124.diff",
        patch_url: "https://github.com/test/repo/pull/124.patch",
      },
    },
  ];

  const mockDiscussions: GitHubDiscussion[] = [
    {
      id: "D_test1",
      node_id: "D_test1",
      number: 1,
      title: "How to implement authentication?",
      body: "I'm looking for best practices on implementing authentication in this project.",
      bodyText: "I'm looking for best practices on implementing authentication in this project.",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
      url: "https://github.com/test/repo/discussions/1",
      repository: {
        nameWithOwner: "test/repo",
        url: "https://github.com/test/repo",
      },
      author: {
        login: "questioner",
        id: 4,
        node_id: "U_test4",
        avatar_url: "https://github.com/avatars/4",
        html_url: "https://github.com/questioner",
        url: "https://api.github.com/users/questioner",
        type: "User",
        site_admin: false,
      },
      category: {
        id: "C_test1",
        name: "Q&A",
        description: "Ask questions and get answers",
      },
      upvoteCount: 5,
      comments: {
        totalCount: 3,
      },
      isAnswered: true,
      answer: {
        id: "A_test1",
        body: "You should use OAuth 2.0 with PKCE flow for better security.",
        createdAt: "2023-01-01T12:00:00Z",
        author: {
          login: "expert",
          id: 5,
          node_id: "U_test5",
          avatar_url: "https://github.com/avatars/5",
          html_url: "https://github.com/expert",
          url: "https://api.github.com/users/expert",
          type: "User",
          site_admin: false,
        },
      },
      answerChosenAt: "2023-01-01T12:30:00Z",
    },
  ];

  describe("generateGitHubIssuesMarkdown", () => {
    it("空の配列の場合は空文字列を返す", () => {
      const result = generateGitHubIssuesMarkdown([], "test");
      expect(result).toBe("");
    });

    it("undefinedの場合は空文字列を返す", () => {
      const result = generateGitHubIssuesMarkdown(undefined as any, "test");
      expect(result).toBe("");
    });

    it("Issuesの配列からMarkdownを生成する", () => {
      const result = generateGitHubIssuesMarkdown(mockIssues, "login bug");

      // YAML Front Matterをチェック
      expect(result).toContain('source: "github"');
      expect(result).toContain('search_type: "issues"');
      expect(result).toContain('total_items: 2');
      expect(result).toContain('issues_count: 1');
      expect(result).toContain('pull_requests_count: 1');
      expect(result).toContain('search_keyword: "login bug"');

      // タイトルとOverviewをチェック
      expect(result).toContain("# GitHub Issues & Pull Requests Collection");
      expect(result).toContain("## Collection Overview");

      // Issuesの内容をチェック
      expect(result).toContain("Bug: Login fails with special characters");
      expect(result).toContain("Fix: Add validation for email addresses");
      expect(result).toContain("**Type**: Issue");
      expect(result).toContain("**Type**: Pull Request");
      expect(result).toContain("**Repository**: test/repo");
      expect(result).toContain("**State**: open");
      expect(result).toContain("**State**: closed");
      expect(result).toContain("**Author**: testuser");
      expect(result).toContain("**Author**: devuser");
      expect(result).toContain("**Labels**: bug");
      expect(result).toContain("**Labels**: enhancement");
      expect(result).toContain("**Assignees**: assigneduser");
      expect(result).toContain("**Milestone**: v1.0");

      // HTMLコメントの境界をチェック
      expect(result).toContain("<!-- GITHUB_CONTENT_START -->");
      expect(result).toContain("<!-- GITHUB_CONTENT_END -->");
    });

    it("検索キーワードなしでもMarkdownを生成する", () => {
      const result = generateGitHubIssuesMarkdown(mockIssues);

      expect(result).toContain('source: "github"');
      expect(result).not.toContain('search_keyword:');
      expect(result).toContain("Bug: Login fails with special characters");
    });
  });

  describe("generateGitHubDiscussionsMarkdown", () => {
    it("空の配列の場合は空文字列を返す", () => {
      const result = generateGitHubDiscussionsMarkdown([], "test");
      expect(result).toBe("");
    });

    it("undefinedの場合は空文字列を返す", () => {
      const result = generateGitHubDiscussionsMarkdown(undefined as any, "test");
      expect(result).toBe("");
    });

    it("Discussionsの配列からMarkdownを生成する", () => {
      const result = generateGitHubDiscussionsMarkdown(mockDiscussions, "auth");

      // YAML Front Matterをチェック
      expect(result).toContain('source: "github"');
      expect(result).toContain('search_type: "discussions"');
      expect(result).toContain('total_discussions: 1');
      expect(result).toContain('answered_discussions: 1');
      expect(result).toContain('search_keyword: "auth"');

      // タイトルとOverviewをチェック
      expect(result).toContain("# GitHub Discussions Collection");
      expect(result).toContain("## Collection Overview");

      // Discussionsの内容をチェック
      expect(result).toContain("How to implement authentication?");
      expect(result).toContain("**Repository**: test/repo");
      expect(result).toContain("**Category**: Q&A");
      expect(result).toContain("**Status**: Answered");
      expect(result).toContain("**Author**: questioner");
      expect(result).toContain("**Upvotes**: 5");
      expect(result).toContain("**Comments**: 3");

      // 質問と回答をチェック
      expect(result).toContain("#### Question");
      expect(result).toContain("#### Accepted Answer");
      expect(result).toContain("**Answered by**: expert");
      expect(result).toContain("OAuth 2.0 with PKCE flow");

      // HTMLコメントの境界をチェック
      expect(result).toContain("<!-- GITHUB_DISCUSSION_START -->");
      expect(result).toContain("<!-- GITHUB_DISCUSSION_END -->");
    });
  });

  describe("generateGitHubIssuesMarkdownForPreview", () => {
    it("空の配列の場合は空文字列を返す", () => {
      const result = generateGitHubIssuesMarkdownForPreview([], "test");
      expect(result).toBe("");
    });

    it("Issuesの配列からプレビューMarkdownを生成する", () => {
      const result = generateGitHubIssuesMarkdownForPreview(mockIssues, "login");

      // プレビュー形式の内容をチェック
      expect(result).toContain("## Issue #123: Bug: Login fails with special characters");
      expect(result).toContain("## PR #124: Fix: Add validation for email addresses");
      expect(result).toContain("**Repository**: test/repo");
      expect(result).toContain("**作成者**: testuser");
      expect(result).toContain("**作成者**: devuser");
      expect(result).toContain("**状態**: open");
      expect(result).toContain("**状態**: closed");
      expect(result).toContain("**ラベル**: bug");
      expect(result).toContain("**ラベル**: enhancement");

      // 本文の切り詰めをチェック
      expect(result).toContain("When users try to login");
      expect(result).toContain("This PR adds proper validation");
    });

    it("長い本文は切り詰められる", () => {
      const longBodyIssue: GitHubIssue = {
        ...mockIssues[0],
        body: "A".repeat(200) + "This should be truncated",
      };

      const result = generateGitHubIssuesMarkdownForPreview([longBodyIssue]);

      expect(result).toContain("A".repeat(150) + "...");
      expect(result).not.toContain("This should be truncated");
    });
  });

  describe("generateGitHubDiscussionsMarkdownForPreview", () => {
    it("空の配列の場合は空文字列を返す", () => {
      const result = generateGitHubDiscussionsMarkdownForPreview([], "test");
      expect(result).toBe("");
    });

    it("Discussionsの配列からプレビューMarkdownを生成する", () => {
      const result = generateGitHubDiscussionsMarkdownForPreview(mockDiscussions);

      expect(result).toContain("## Discussion #1: How to implement authentication?");
      expect(result).toContain("**Repository**: test/repo");
      expect(result).toContain("**作成者**: questioner");
      expect(result).toContain("**カテゴリ**: Q&A");
      expect(result).toContain("**状態**: ✅ 回答済み");
      expect(result).toContain("**アップヴォート**: 5");
      expect(result).toContain("I'm looking for best practices");
    });

    it("未回答のDiscussionは適切に表示される", () => {
      const unansweredDiscussion: GitHubDiscussion = {
        ...mockDiscussions[0],
        isAnswered: false,
        answer: undefined,
      };

      const result = generateGitHubDiscussionsMarkdownForPreview([unansweredDiscussion]);

      expect(result).toContain("**状態**: ❓ 未回答");
    });
  });
});