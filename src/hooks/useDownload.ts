import { useState, useCallback } from "react";
import { downloadMarkdownFile } from "../utils/fileDownloader";
import toast from "react-hot-toast";

interface UseDownloadResult {
  isDownloading: boolean;
  handleDownload: (
    markdownContent: string,
    keyword: string,
    postsExist: boolean
  ) => Promise<void>;
}

/**
 * Markdownファイルのダウンロード処理と通知を行うカスタムフック
 */
export const useDownload = (): UseDownloadResult => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleDownload = useCallback(
    async (markdownContent: string, keyword: string, postsExist: boolean) => {
      setIsDownloading(true);
      // ダウンロード対象がない場合は、fileDownloaderからのメッセージをtoastで表示
      if (!postsExist || !markdownContent.trim()) {
        const result = downloadMarkdownFile(
          markdownContent,
          keyword,
          postsExist
        );
        if (result.message) {
          toast.error(result.message);
        }
        setIsDownloading(false);
        return;
      }

      // ダウンロード処理を実行
      const toastId = toast.loading("Markdownファイルをダウンロード中です...");
      try {
        // 非同期処理っぽく見せるために少し待つ（実際にはdownloadMarkdownFileは同期的）
        await new Promise((resolve) => setTimeout(resolve, 500));
        const result = downloadMarkdownFile(
          markdownContent,
          keyword,
          postsExist
        );

        if (result.success) {
          toast.success("Markdownファイルをダウンロードしました。", {
            id: toastId,
          });
        } else {
          toast.error(result.message || "ダウンロードに失敗しました。", {
            id: toastId,
          });
        }
      } catch (error) {
        console.error("Download process error:", error);
        toast.error("予期せぬエラーによりダウンロードに失敗しました。", {
          id: toastId,
        });
      } finally {
        setIsDownloading(false);
      }
    },
    []
  );

  return { isDownloading, handleDownload };
};
