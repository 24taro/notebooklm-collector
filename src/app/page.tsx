"use client";

import Link from "next/link";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-900 font-sans">
      <Header title="NotebookLM Collector" />
      <div className="flex-grow flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-3xl">
          <h1 className="text-3xl font-normal mb-4">NotebookLM Collector</h1>
          <p className="text-gray-600 mb-12">
            情報ソースからデータを収集し、NotebookLM用Markdownを生成
          </p>
          
          <div className="space-y-8">
            <div>
              <Link 
                href="/docbase" 
                className="text-lg text-gray-900 underline hover:text-gray-600"
              >
                Docbase連携
              </Link>
              <p className="text-gray-600 mt-2">
                Docbaseの記事を検索・収集（最大500件）
              </p>
            </div>
            
            <div>
              <Link 
                href="/slack" 
                className="text-lg text-gray-900 underline hover:text-gray-600"
              >
                Slack連携
              </Link>
              <p className="text-gray-600 mt-2">
                Slackのスレッドを検索・収集（最大300件）
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
