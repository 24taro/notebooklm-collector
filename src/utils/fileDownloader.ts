/**
 * LLM最適化Markdown文字列をファイルとしてダウンロードする関数
 * NotebookLM向けの命名規則を適用
 *
 * @param markdownContent ダウンロードするMarkdown文字列
 * @param keyword ファイル名に使用するキーワード
 * @param postsExist 投稿があったかどうか
 * @param sourceType ソースタイプ（'docbase' | 'slack' | 'github'）
 */
export const downloadMarkdownFile = (
  markdownContent: string,
  keyword: string,
  postsExist: boolean,
  sourceType: "docbase" | "slack" | "github" = "docbase"
): { success: boolean; message?: string } => {
  // 投稿が存在しない、またはMarkdownコンテントが空の場合はダウンロードしない
  if (!postsExist || !markdownContent.trim()) {
    // ユーザーに通知するかどうかは呼び出し側で判断するため、ここでは特別なメッセージは返さない
    return {
      success: false,
      message: "ダウンロードするコンテンツがありません。",
    };
  }

  let url: string | null = null;
  try {
    const blob = new Blob([markdownContent], {
      type: "text/markdown;charset=utf-8",
    });
    url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // LLM最適化ファイル命名規則: {source}_YYYY-MM-DD_{keyword}_{type}.md
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // キーワードをファイル名に安全な形式に変換
    const safeKeyword = keyword.trim()
      ? keyword
          .trim()
          .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "_")
      : "search";

    // ソースタイプ別のファイル名
    const contentType =
      sourceType === "slack"
        ? "threads"
        : sourceType === "github"
          ? "issues_discussions"
          : "articles";
    a.download = `${sourceType}_${dateStr}_${safeKeyword}_${contentType}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    console.error("Markdown file download error:", error);
    // エラーの場合でもリソースをクリーンアップ
    if (url) {
      URL.revokeObjectURL(url);
    }
    return {
      success: false,
      message: "ファイルのダウンロード中にエラーが発生しました。",
    };
  }
};
