'use client' // クライアントコンポーネントとしてマーク

import { Toaster } from 'react-hot-toast' // Toasterをインポート
import { ErrorBoundary } from '../../components/ErrorBoundary'
import SearchForm from '../../components/DocbaseSearchForm' // パスを修正
import Footer from '../../components/Footer'
// import { SparklesCore } from "../../components/ui/sparkles"; // 架空のUIコンポーネントなのだ -> 一旦コメントアウト
import Header from '../../components/Header'

export default function DocbasePage() {
  // コンポーネント名を DocbasePage に変更
  return (
    <main className="flex min-h-screen flex-col text-gray-800 selection:bg-docbase-primary font-sans">
      <Header title="NotebookLM Collector - Docbase" />
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
          className: '!border !border-gray-200 !bg-white !text-gray-700 !shadow-lg !rounded-md',
          success: {
            iconTheme: {
              primary: '#3B82F6', // Docbase風ブルー
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444', // 赤
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* <Header /> */}
        {/* これは以前削除したコメント */}

        {/* ヒーローセクション */}
        <section className="w-full text-center my-32">
          <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-800 leading-tight">
              Docbaseの情報を、
              <br />
              NotebookLMへ簡単連携
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
              キーワード検索でDocbaseの記事をまとめ、NotebookLMでのAI活用に最適化されたMarkdownファイルを瞬時に生成します。
            </p>
          </div>
        </section>

        <div className="flex justify-center bg-docbase-bg w-full py-10">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => document.getElementById('main-tool-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 bg-docbase-primary hover:bg-docbase-primary-dark text-white font-semibold rounded-md shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"
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
          <div className="max-w-screen-lg mx-auto px-6 sm:px-10 lg:px-24 py-16 rounded-xl border border-gray-200 bg-background-light">
            <h2 className="text-3xl md:text-4xl font-bold mb-20 text-center text-gray-800">利用はかんたん3ステップ</h2>
            <div className="grid md:grid-cols-3 gap-x-8 gap-y-10 relative">
              {[
                {
                  step: '1',
                  title: '情報を入力',
                  description:
                    'Docbaseドメイン、APIトークン、検索したいキーワードの3点を入力します。ドメインとトークンは保存可能です。',
                  icon: '⌨️',
                },
                {
                  step: '2',
                  title: '検索して生成',
                  description:
                    '「検索実行」ボタンを押すと、Docbaseから記事を取得し、NotebookLM用Markdownをプレビューします。',
                  icon: '🔍',
                },
                {
                  step: '3',
                  title: 'ダウンロード',
                  description:
                    '生成されたMarkdown内容を確認し、「ダウンロード」ボタンでファイルとして保存。すぐにAIに学習させられます。',
                  icon: '💾',
                },
              ].map((item, index) => (
                <div key={item.step} className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start mb-4">
                    <span className="flex items-center justify-center w-10 h-10 bg-docbase-primary text-white text-xl font-bold rounded-full mr-4">
                      {item.step}
                    </span>
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* セキュリティ説明セクション */}
        <section className="w-full mt-12">
          <div className="max-w-screen-lg mx-auto px-6 sm:px-10 lg:px-24 py-16 rounded-xl border border-gray-200 bg-background-light">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">🔒 セキュリティについて</h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
                入力されたDocbase APIトークンや取得された記事の内容は、お使いのブラウザ内でのみ処理されます。
                これらの情報が外部のサーバーに送信されたり、保存されたりすることは一切ありませんので、安心してご利用いただけます。
              </p>
            </div>
          </div>
        </section>

        {/* メイン機能セクション (SearchForm) */}
        <section id="main-tool-section" className="w-full my-12 bg-white">
          <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 shadow-md rounded-lg border border-gray-200">
            <div className="px-0">
              <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">DocBase 記事検索・収集</h2>
              <ErrorBoundary
                onError={(error, errorInfo) => {
                  console.error('Docbase search form error:', error, errorInfo)
                }}
              >
                <SearchForm />
              </ErrorBoundary>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
