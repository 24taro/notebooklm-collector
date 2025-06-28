"use client";

import { useSlackForm } from "@/features/slack/hooks/useSlackForm";
import { Toaster } from "react-hot-toast";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { SlackMarkdownPreview } from "../../features/slack/components/SlackMarkdownPreview";
import { SlackSearchForm } from "../../features/slack/components/SlackSearchForm";

export default function SlackPage() {
  const slackForm = useSlackForm();

  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-800 selection:bg-gray-100 font-sans">
      <Header title="NotebookLM Collector - Slack" />
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!border !border-gray-200 !bg-white !text-gray-700 !shadow-lg !rounded-md",
          success: {
            iconTheme: {
              primary: "#5692ce", // グレー系ブルー
              secondary: "#FFFFFF",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
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
              Slack メッセージ検索・収集
            </h2>

            {/* レスポンシブレイアウト: デスクトップは横並び、モバイルは縦並び */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左側: 検索フォーム */}
              <div className="space-y-6">
                <SlackSearchForm form={slackForm} />

                {/* 検索結果の統計情報 */}
                {slackForm.slackThreads &&
                  slackForm.slackThreads.length > 0 &&
                  !slackForm.isLoading &&
                  !slackForm.error && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">
                        取得スレッド数: {slackForm.slackThreads.length}件
                      </p>
                      {slackForm.slackThreads.length > 10 && (
                        <p className="text-sm text-gray-600 mt-1">
                          プレビューには最初の10件が表示されます。すべての内容を確認するには、ダウンロードボタンをご利用ください。
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {/* 右側: プレビューエリア */}
              <div className="space-y-6">
                <SlackMarkdownPreview
                  threads={slackForm.slackThreads}
                  userMaps={slackForm.userMaps}
                  permalinkMaps={slackForm.permalinkMaps}
                  searchQuery={slackForm.searchQuery}
                  title="検索結果プレビュー"
                  onDownload={() =>
                    slackForm.onDownload(
                      "",
                      slackForm.searchQuery,
                      slackForm.slackThreads.length > 0
                    )
                  }
                  emptyMessage="Slackスレッドの検索結果がここに表示されます。"
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
