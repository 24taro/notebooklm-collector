"use client"; // クライアントコンポーネントとしてマーク

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { ZennMarkdownPreview } from "../../components/ZennMarkdownPreview";
import { ZennSearchForm } from "../../components/ZennSearchForm";
import type { ZennArticle } from "../../types/zenn";
import { generateZennMarkdown } from "../../utils/zennMarkdownGenerator";
import { useDownload } from "../../hooks/useDownload";
import type { ApiError } from "../../types/error";

export default function ZennPage() {
  const [searchResults, setSearchResults] = useState<{
    articles: ZennArticle[];
    filteredArticles: ZennArticle[];
    markdownContent: string;
    isLoading: boolean;
    error: ApiError | null;
    searchKeyword?: string;
    searchUsername?: string;
  }>({
    articles: [],
    filteredArticles: [],
    markdownContent: "",
    isLoading: false,
    error: null,
  });

  const { isDownloading, handleDownload } = useDownload();

  const handleDownloadClick = () => {
    const articlesExist = searchResults.filteredArticles && searchResults.filteredArticles.length > 0;
    if (articlesExist) {
      // ダウンロード時は全件のMarkdownを生成
      const fullMarkdown = generateZennMarkdown(
        searchResults.filteredArticles,
        {
          searchKeyword: searchResults.searchKeyword,
          searchUsername: searchResults.searchUsername,
          totalOriginalCount: searchResults.articles.length,
        }
      );
      const filename = searchResults.searchKeyword || searchResults.searchUsername || "zenn-articles";
      handleDownload(fullMarkdown, filename, articlesExist, "zenn");
    } else {
      const filename = searchResults.searchKeyword || searchResults.searchUsername || "zenn-articles";
      handleDownload(
        searchResults.markdownContent,
        filename,
        articlesExist,
        "zenn"
      );
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-800 selection:bg-green-500 font-sans">
      <Header title="NotebookLM Collector - Zenn" />
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!border !border-gray-200 !bg-white !text-gray-700 !shadow-lg !rounded-md",
          success: {
            iconTheme: {
              primary: "#10B981", // Zenn風グリーン
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
        <section className="w-full bg-gradient-to-br from-green-50 to-emerald-50 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Zenn
              </span>{" "}
              記事検索・収集
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Zennの技術記事・アイデア記事を効率的に検索・収集し、
              <span className="font-semibold text-green-700">NotebookLM</span>
              で活用できる形式で出力します
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>認証不要</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>リアルタイム検索</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>LLM最適化出力</span>
              </div>
            </div>
          </div>
        </section>

        {/* 使い方セクション */}
        <section className="w-full py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
              使い方
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">1. 検索条件設定</h3>
                <p className="text-sm text-gray-600">
                  キーワードやユーザー名、記事タイプなどの条件を指定
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">2. プレビュー確認</h3>
                <p className="text-sm text-gray-600">
                  検索結果をプレビューで確認し、フィルターで絞り込み
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💾</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">3. ダウンロード</h3>
                <p className="text-sm text-gray-600">
                  LLM最適化されたMarkdown形式でダウンロード
                </p>
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
              Zenn 記事検索・収集ツール
            </h2>

            {/* レスポンシブレイアウト: デスクトップは横並び、モバイルは縦並び */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左側: 検索フォーム */}
              <div className="space-y-6">
                <ZennSearchForm onSearchResults={setSearchResults} />

                {/* 検索結果の統計情報 */}
                {searchResults.filteredArticles &&
                  searchResults.filteredArticles.length > 0 &&
                  !searchResults.isLoading &&
                  !searchResults.error && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-gray-700">
                        取得件数: {searchResults.filteredArticles.length}件
                        {searchResults.articles.length !== searchResults.filteredArticles.length && (
                          <span className="text-gray-500">
                            {" "}(フィルター前: {searchResults.articles.length}件)
                          </span>
                        )}
                      </p>
                      {searchResults.filteredArticles.length > 10 && (
                        <p className="text-sm text-gray-600 mt-1">
                          プレビューには最初の10件が表示されます。すべての内容を確認するには、ダウンロードボタンをご利用ください。
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {/* 右側: プレビューエリア */}
              <div className="space-y-6">
                <ZennMarkdownPreview
                  articles={
                    searchResults.filteredArticles.length > 0
                      ? searchResults.filteredArticles
                      : undefined
                  }
                  title="検索結果プレビュー"
                  onDownload={handleDownloadClick}
                  emptyMessage="Zenn記事の検索結果がここに表示されます。"
                  useAccordion={true}
                  className=""
                />
              </div>
            </div>
          </div>
        </section>

        {/* セキュリティ・制限事項セクション */}
        <section className="w-full py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
              機能と制限事項
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  利用可能な機能
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• ユーザー名指定検索</li>
                  <li>• キーワード検索（タイトル内）</li>
                  <li>• 記事タイプフィルター（tech/idea）</li>
                  <li>• いいね数フィルター</li>
                  <li>• 公開日範囲フィルター</li>
                  <li>• メタデータ情報取得</li>
                  <li>• LLM最適化Markdown出力</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  制限事項
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 記事本文は取得できません</li>
                  <li>• 非公式APIのため仕様変更の可能性</li>
                  <li>• レート制限により取得速度に制約</li>
                  <li>• メタデータと概要情報のみ提供</li>
                  <li>• パブリック記事のみ対象</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>セキュリティ:</strong> すべての処理はお客様のブラウザ内で完結し、
                入力された情報や検索結果が外部サーバーに送信されることはありません。
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}