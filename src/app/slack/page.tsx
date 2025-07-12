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
    <main className="flex min-h-screen flex-col bg-white text-gray-800 selection:bg-slack-primary font-sans">
      <Header title="NotebookLM Collector - Slack" />

      {/* Slackブランドカラーに合わせたToaster設定 */}
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!border !border-gray-200 !bg-white !text-gray-700 !shadow-lg !rounded-md",
          success: {
            iconTheme: {
              primary: "#4A154B", // Slack Purple
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
        {/* ヒーローセクション */}
        <section className="w-full text-center my-32">
          <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-800 leading-tight">
              Slackの知識を、
              <br />
              NotebookLMへ簡単連携
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
              キーワード検索でSlackのスレッドをまとめ、NotebookLMでのAI活用に最適化されたMarkdownファイルを瞬時に生成します。
            </p>
          </div>
        </section>

        {/* CTAセクション */}
        <div className="flex justify-center bg-slack-primary w-full py-10">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("main-tool-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-3 bg-white hover:bg-gray-50 text-slack-primary font-semibold rounded-md shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out text-lg border-2 border-slack-primary"
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
                  title: "トークンを設定",
                  description:
                    "Slack APIトークンとキーワードを入力します。トークンは設定ページから発行でき、保存も可能です。",
                  icon: "🔑",
                },
                {
                  step: "2",
                  title: "検索して生成",
                  description:
                    "キーワードを入力し「検索実行」ボタンを押すと、Slackからスレッドを取得し、NotebookLM用Markdownをプレビューします。",
                  icon: "🔍",
                },
                {
                  step: "3",
                  title: "ダウンロード",
                  description:
                    "生成されたMarkdown内容を確認し、「ダウンロード」ボタンでファイルとして保存。すぐにAIに学習させられます。",
                  icon: "💾",
                },
              ].map((item, index) => (
                <div key={item.step} className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start mb-4">
                    <span className="flex items-center justify-center w-10 h-10 bg-slack-primary text-white text-xl font-bold rounded-full mr-4">
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

        {/* Slack特有の機能説明セクション */}
        <section className="w-full mt-12">
          <div className="max-w-screen-lg mx-auto px-6 sm:px-10 lg:px-24 py-16 rounded-xl border border-gray-200 bg-slack-primary/5">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">
              ✨ Slack連携の特徴
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slack-primary-dark">
                  🎯 高度な検索機能
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-slack-primary mr-2">•</span>
                    チャンネル・投稿者・期間での絞り込み検索
                  </li>
                  <li className="flex items-start">
                    <span className="text-slack-primary mr-2">•</span>
                    スレッド単位での構造化された情報取得
                  </li>
                  <li className="flex items-start">
                    <span className="text-slack-primary mr-2">•</span>
                    最大500件までのメッセージ取得・スレッド構築
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slack-primary-dark">
                  📊 豊富なメタデータ
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-slack-primary mr-2">•</span>
                    スレッド数・参加者・投稿日時の統計
                  </li>
                  <li className="flex items-start">
                    <span className="text-slack-primary mr-2">•</span>
                    チャンネル別の会話分析
                  </li>
                  <li className="flex items-start">
                    <span className="text-slack-primary mr-2">•</span>
                    返信数・エンゲージメント傾向分析
                  </li>
                </ul>
              </div>
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
                APIトークンや取得されたメッセージの内容は、お使いのブラウザ内でのみ処理されます。
                これらの情報が外部のサーバーに送信されたり、保存されたりすることは一切ありませんので、安心してご利用いただけます。
              </p>
              <div className="mt-6 inline-flex items-center px-4 py-2 bg-slack-primary/10 border border-slack-primary/20 rounded-md">
                <svg
                  className="w-5 h-5 text-slack-primary mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>プライバシー保護</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-slack-primary font-medium">
                  プライバシー保護設計
                </span>
              </div>
            </div>
          </div>
        </section>

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
