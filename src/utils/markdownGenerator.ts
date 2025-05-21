import type { DocbasePostListItem } from "../types/docbase";

/**
 * Docbaseの投稿リストからMarkdown文字列を生成する関数
 * @param posts DocbasePostListItemの配列
 * @returns 生成されたMarkdown文字列
 */
export const generateMarkdown = (posts: DocbasePostListItem[]): string => {
  if (!posts || posts.length === 0) {
    return ""; // 投稿がない場合は空文字列を返す
  }

  return posts
    .map((post) => {
      // created_at を YYYY/MM/DD 形式にフォーマット (簡易的なもの)
      let formattedDate = post.created_at;
      try {
        const date = new Date(post.created_at);
        formattedDate = `${date.getFullYear()}/${String(
          date.getMonth() + 1
        ).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
      } catch (e) {
        console.error("Error formatting date:", post.created_at, e);
        // フォーマットエラー時は元の文字列を使用
      }

      return [
        `## ${post.title}`,
        `> ${formattedDate}`,
        `> ${post.url}`,
        "```md",
        post.body,
        "```",
      ].join("\n\n"); // 各要素を2つの改行で結合
    })
    .join("\n\n---\n\n"); // 各投稿の間を水平線と2つの改行で区切る
};
