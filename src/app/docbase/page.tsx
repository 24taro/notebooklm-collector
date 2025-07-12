"use client"; // クライアントコンポーネントとしてマーク

import { Toaster } from "react-hot-toast";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { DocbaseSearchForm } from "../../features/docbase/components/DocbaseSearchForm";

export default function DocbasePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-800 selection:bg-docbase-primary font-sans">
      <Header title="NotebookLM Collector - Docbase" />

      {/* Docbaseブランドカラーに合わせたToaster設定 */}
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!border !border-gray-200 !bg-white !text-gray-700 !shadow-lg !rounded-md",
          success: {
            iconTheme: {
              primary: "#3B82F6", // Docbase Blue
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
              Docbaseの知識を、
              <br />
              NotebookLMへ簡単連携
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
              キーワード検索でDocbaseの記事をまとめ、NotebookLMでのAI活用に最適化されたMarkdownファイルを瞬時に生成します。
            </p>
          </div>
        </section>

        {/* CTAセクション */}
        <div className="flex justify-center bg-blue-500 w-full py-10">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("main-tool-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-3 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-md shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out text-lg border-2 border-blue-600"
            >
              今すぐMarkdownを生成
            </button>
            <p className="text-white text-sm mt-2">
              取得したDocbaseの情報はブラウザ内でのみ利用されます。サーバーには保存、送信されません。
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
                  title: "ドメインとトークンを設定",
                  description:
                    "Docbaseドメインとアクセストークンを入力します。トークンは設定ページから発行でき、保存も可能です。",
                  icon: "🔑",
                },
                {
                  step: "2",
                  title: "検索して生成",
                  description:
                    "キーワードを入力し「検索実行」ボタンを押すと、Docbaseから記事を取得し、NotebookLM用Markdownをプレビューします。",
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
                    <span className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white text-xl font-bold rounded-full mr-4">
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

        {/* Docbase特有の機能説明セクション */}
        <section className="w-full mt-12">
          <div className="max-w-screen-lg mx-auto px-6 sm:px-10 lg:px-24 py-16 rounded-xl border border-gray-200 bg-blue-50">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">
              ✨ Docbase連携の特徴
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-blue-700">
                  🎯 高度な検索機能
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    タグ・投稿者・期間での絞り込み検索
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    タイトルキーワードによる文書種別フィルター
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    最大500件までのチーム記事取得
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-blue-700">
                  📊 豊富なメタデータ
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    記事の文字数・作成日時・タグ情報
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    著者情報と投稿数統計
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    チーム知識ベースの傾向分析
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
                入力されたDocbase
                ドメインやAPIトークン、取得された記事の内容は、お使いのブラウザ内でのみ処理されます。
                これらの情報が外部のサーバーに送信されたり、保存されたりすることは一切ありませんので、安心してご利用いただけます。
              </p>
              <div className="mt-6 inline-flex items-center px-4 py-2 bg-docbase-primary/10 border border-docbase-primary/20 rounded-md">
                <svg
                  className="w-5 h-5 text-docbase-primary mr-2"
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
                <span className="text-docbase-primary font-medium">
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
              Docbase 記事検索・収集
            </h2>
            <DocbaseSearchForm />
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
