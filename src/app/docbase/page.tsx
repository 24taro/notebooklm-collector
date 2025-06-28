"use client"; // クライアントコンポーネントとしてマーク

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { DocbaseMarkdownPreview } from "../../features/docbase/components/DocbaseMarkdownPreview";
import { DocbaseSearchForm } from "../../features/docbase/components/DocbaseSearchForm"; // パスを修正
import type { DocbasePostListItem } from "../../features/docbase/types/docbase";
import { generateDocbaseMarkdown } from "../../features/docbase/utils/docbaseMarkdownGenerator";
import { useDownload } from "../../hooks/useDownload";
import type { ApiError } from "../../types/error";

export default function DocbasePage() {
  const [searchResults, setSearchResults] = useState<{
    posts: DocbasePostListItem[];
    markdownContent: string;
    isLoading: boolean;
    error: ApiError | null;
  }>({
    posts: [],
    markdownContent: "",
    isLoading: false,
    error: null,
  });

  const { isDownloading, handleDownload } = useDownload();

  const handleDownloadClick = () => {
    const postsExist = searchResults.posts && searchResults.posts.length > 0;
    if (postsExist) {
      // ダウンロード時は全件のMarkdownを生成
      const fullMarkdown = generateDocbaseMarkdown(
        searchResults.posts,
        "検索キーワード"
      );
      handleDownload(fullMarkdown, "検索キーワード", postsExist, "docbase");
    } else {
      handleDownload(
        searchResults.markdownContent,
        "検索キーワード",
        postsExist,
        "docbase"
      );
    }
  };
  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-800 selection:bg-docbase-primary font-sans">
      <Header title="NotebookLM Collector - Docbase" />
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!border !border-gray-200 !bg-white !text-gray-700 !shadow-lg !rounded-md",
          success: {
            iconTheme: {
              primary: "#3B82F6", // Docbase風ブルー
              secondary: "#FFFFFF",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444", // 赤
              secondary: "#FFFFFF",
            },
          },
        }}
      />
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* メイン機能セクション (横配置レイアウト) */}
        <section
          id="main-tool-section"
          className="w-full my-12 bg-white flex justify-center"
        >
          <div className="max-w-screen-xl w-full mx-4 sm:mx-8 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 shadow-none sm:shadow-md rounded-lg border-0 sm:border sm:border-gray-200">
            <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">
              DocBase 記事検索・収集
            </h2>

            {/* レスポンシブレイアウト: デスクトップは横並び、モバイルは縦並び */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左側: 検索フォーム */}
              <div className="space-y-6">
                <DocbaseSearchForm onSearchResults={setSearchResults} />

                {/* 検索結果の統計情報 */}
                {searchResults.posts &&
                  searchResults.posts.length > 0 &&
                  !searchResults.isLoading &&
                  !searchResults.error && (
                    <div className="p-4 bg-docbase-primary/5 border border-docbase-primary/20 rounded-lg">
                      <p className="text-sm text-docbase-text-sub">
                        取得件数: {searchResults.posts.length}件
                      </p>
                      {searchResults.posts.length > 10 && (
                        <p className="text-sm text-docbase-text-sub mt-1">
                          プレビューには最初の10件が表示されます。すべての内容を確認するには、ダウンロードボタンをご利用ください。
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {/* 右側: プレビューエリア */}
              <div className="space-y-6">
                <DocbaseMarkdownPreview
                  posts={
                    searchResults.posts.length > 0
                      ? searchResults.posts
                      : undefined
                  }
                  title="検索結果プレビュー"
                  onDownload={handleDownloadClick}
                  emptyMessage="Docbase記事の検索結果がここに表示されます。"
                  useAccordion={true}
                  className=""
                />
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
