"use client"; // クライアントコンポーネントとしてマーク

import SearchForm from "../components/SearchForm"; // パスを修正
import { Toaster } from "react-hot-toast"; // Toasterをインポート
// import { SparklesCore } from "../components/ui/sparkles"; // 架空のUIコンポーネントなのだ -> 一旦コメントアウト

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start px-4 py-8 md:p-12 bg-white text-gray-800 selection:bg-blue-100 font-sans">
      {/* 背景のパーティクルエフェクト (架空のコンポーネント) */}
      {/* <div className=\"absolute inset-0 w-full h-full z-0\"> */}
      {/*  <SparklesCore */}
      {/*    id=\"tsparticles\" */}
      {/*    background=\"transparent\" */}
      {/*    minSize={0.2} */}
      {/*    maxSize={1.2} */}
      {/*    particleDensity={80} */}
      {/*    className=\"w-full h-full\" */}
      {/*    particleColor=\"#FFFFFF\" */}
      {/*  /> */}
      {/* </div> */}

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

      <div className="relative z-10 flex flex-col items-center w-full max-w-6xl mx-auto">
        {/* ヘッダー的な要素 (オプション) */}
        <header className="w-full py-6 mb-10 flex justify-between items-center">
          <div className="flex items-center">
            {/* <img src="/docbase-collector-logo.svg" alt="Docbase Collector Logo" className="h-8 w-auto mr-3" /> */}
            <span className="text-2xl font-semibold text-gray-700">
              Docbase Collector
            </span>
          </div>
          {/* <a href="#" className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">ログイン(仮)</a> */}
        </header>

        {/* ヒーローセクション */}
        <section className="w-full text-center py-12 md:py-20 lg:py-28">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-800 leading-tight">
            Docbaseの情報を、
            <br className="md:hidden" />
            NotebookLMへ簡単連携
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
            キーワード検索でDocbaseの記事をまとめ、NotebookLMでのAI活用に最適化されたMarkdownファイルを瞬時に生成します。
          </p>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("main-tool-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"
          >
            今すぐMarkdownを生成
          </button>
        </section>

        {/* プロダクト説明セクション (3つの特徴) */}
        <section className="w-full py-12 md:py-16 lg:py-20 my-12">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "かんたん検索・収集",
                description:
                  "使い慣れたキーワード入力だけで、Docbase内の関連情報をまとめて取得。情報の見落としを防ぎます。",
                icon: "📄", // Docbase風のアイコンに変更 (例)
              },
              {
                title: "AI学習に最適化",
                description:
                  "NotebookLMが最も効率的に学習できるよう、記事構造や書式をMarkdownに最適化して出力します。",
                icon: "✨",
              },
              {
                title: "すぐに利用開始",
                description:
                  "複雑な設定やマニュアルは不要。直感的な操作で、どなたでもすぐに高度なAI連携を実現できます。",
                icon: "🚀",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out"
              >
                <div className="text-4xl mb-5 text-center text-blue-500">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center text-gray-800">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 使い方説明セクション */}
        <section className="w-full py-12 md:py-16 lg:py-20 my-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="px-6 md:px-10 lg:px-16 py-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-800">
              利用はかんたん3ステップ
            </h2>
            <div className="grid md:grid-cols-3 gap-x-8 gap-y-10 relative">
              {[
                {
                  step: "1",
                  title: "情報を入力",
                  description:
                    "Docbaseドメイン、APIトークン、検索したいキーワードの3点を入力します。ドメインとトークンは保存可能です。",
                  icon: "⌨️",
                },
                {
                  step: "2",
                  title: "検索して生成",
                  description:
                    "「検索実行」ボタンを押すと、Docbaseから記事を取得し、NotebookLM用Markdownをプレビューします。",
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

        {/* メイン機能セクション (SearchForm) */}
        <section
          id="main-tool-section"
          className="w-full max-w-3xl py-12 md:py-16 lg:py-20 my-12 bg-white shadow-lg rounded-xl border border-gray-200"
        >
          <div className="px-6 md:px-10 lg:px-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-gray-800">
              Markdown生成ツール
            </h2>
            <SearchForm />
          </div>
        </section>

        <footer className="w-full text-center py-10 mt-12 text-gray-500 text-xs border-t border-gray-200">
          <p>
            &copy; {new Date().getFullYear()} Docbase Collector. All rights
            reserved.
          </p>
          {/* <p className="mt-1">A tool by Your Name/Company</p> */}
        </footer>
      </div>
    </main>
  );
}
