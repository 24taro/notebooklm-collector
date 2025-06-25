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
    <main className="flex min-h-screen flex-col text-gray-800 selection:bg-blue-100 font-sans">
      <Header title="NotebookLM Collector - Slack" />
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!border !border-gray-200 !bg-white !text-gray-700 !shadow-lg !rounded-md",
          success: {
            iconTheme: {
              primary: "#36C5F0", // Slackブルー
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
        {/* ヒーローセクション */}
        <section className="w-full text-center my-32">
          <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-800 leading-tight">
              Slackの会話を、
              <br />
              NotebookLMへ簡単連携
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
              キーワードや期間でSlackメッセージを検索し、NotebookLM用のMarkdownファイルをすぐに生成できます。
            </p>
          </div>
        </section>

        <div className="flex justify-center bg-blue-500 w-full py-10">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("main-tool-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"
            >
              今すぐMarkdownを生成
            </button>
            <p className="text-white text-sm mt-2">
              取得したSlackの情報はブラウザ内でのみ利用されます。サーバーには保存、送信されません。
            </p>
          </div>
        </div>

        {/* 使い方説明セクション */}
        <section className="w-full mt-12">
          <div className="max-w-screen-lg mx-auto px-6 sm:px-10 lg:px-24 py-16 rounded-xl border border-gray-200 bg-gray-50">
            <h2 className="text-3xl md:text-4xl font-bold mb-20 text-center text-gray-800">
              利用はかんたん3ステップ
            </h2>
            <div className="grid md:grid-cols-3 gap-x-8 gap-y-10 relative">
              {[
                {
                  step: "1",
                  title: "情報を入力",
                  description:
                    "Slackトークン、検索キーワード、期間などを入力します。トークンは保存可能です。",
                  icon: "⌨️",
                },
                {
                  step: "2",
                  title: "検索して生成",
                  description:
                    "「検索実行」ボタンでSlackからメッセージを取得し、NotebookLM用Markdownをプレビューします。",
                  icon: "🔍",
                },
                {
                  step: "3",
                  title: "ダウンロード",
                  description:
                    "生成されたMarkdownを「ダウンロード」ボタンで保存。すぐにAIに学習させられます。",
                  icon: "💾",
                },
              ].map((item) => (
                <div key={item.step} className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start mb-4">
                    <span className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white text-xl font-bold rounded-full mr-4">
                      {item.step}
                    </span>
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* セキュリティ説明セクション */}
        <section className="w-full mt-12">
          <div className="max-w-screen-lg mx-auto px-6 sm:px-10 lg:px-24 py-16 rounded-xl border border-gray-200 bg-gray-50">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">
                🔒 セキュリティについて
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
                入力されたSlack
                APIトークンや取得したメッセージ内容は、お使いのブラウザ内でのみ処理されます。
                これらの情報が外部サーバーに送信されたり、保存されたりすることは一切ありませんので、安心してご利用いただけます。
              </p>
            </div>
          </div>
        </section>

        {/* メイン機能セクション (横配置レイアウト) */}
        <section id="main-tool-section" className="w-full my-12 bg-white">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 shadow-md rounded-lg border border-gray-200">
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
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
