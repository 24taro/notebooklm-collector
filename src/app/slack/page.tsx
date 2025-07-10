"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SlackMarkdownPreview } from "@/features/slack/components/SlackMarkdownPreview";
import { SlackSearchForm } from "@/features/slack/components/SlackSearchForm";
import { useSlackForm } from "@/features/slack/hooks/useSlackForm";
import { Toaster } from "react-hot-toast";

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
              primary: "#4A154B", // Slack purple
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
                    <div className="p-4 bg-slack-primary/5 border border-slack-primary/20 rounded-lg">
                      <p className="text-sm text-slack-text-sub">
                        取得スレッド数: {slackForm.slackThreads.length}件
                      </p>
                      {slackForm.slackThreads.length > 10 && (
                        <p className="text-sm text-slack-text-sub mt-1">
                          プレビューには最初の10件が表示されます。すべての内容を確認するには、ダウンロードボタンをご利用ください。
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {/* 右側: プレビューエリア */}
              <div className="space-y-6">
                {!slackForm.isLoading && (
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
                )}
                {slackForm.isLoading && (
                  <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      検索結果プレビュー
                    </h3>
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <svg
                          className="animate-spin h-8 w-8 text-slack-primary mx-auto"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <title>検索処理ローディング</title>
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <div className="space-y-2">
                          <p className="text-gray-800 font-medium">
                            {slackForm.progressStatus?.message || "検索中..."}
                          </p>
                          {slackForm.progressStatus?.current &&
                            slackForm.progressStatus?.total && (
                              <p className="text-sm text-gray-600">
                                {slackForm.progressStatus.current} /{" "}
                                {slackForm.progressStatus.total}
                              </p>
                            )}
                        </div>
                        {/* プログレスバー */}
                        <div className="w-64 mx-auto">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-slack-primary h-2 rounded-full transition-all duration-300"
                              style={{
                                width:
                                  slackForm.progressStatus?.phase ===
                                  "searching"
                                    ? "25%"
                                    : slackForm.progressStatus?.phase ===
                                        "fetching_threads"
                                      ? "50%"
                                      : slackForm.progressStatus?.phase ===
                                          "fetching_users"
                                        ? "75%"
                                        : slackForm.progressStatus?.phase ===
                                            "generating_permalinks"
                                          ? "90%"
                                          : slackForm.progressStatus?.phase ===
                                              "completed"
                                            ? "100%"
                                            : "10%",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
