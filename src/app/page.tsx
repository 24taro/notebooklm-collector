"use client";

import Image from "next/image";
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

          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            <Link
              href="/docbase"
              className="flex items-center space-x-4 p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
                <Image
                  src="/docbase-icon.jpeg"
                  alt="Docbase"
                  width={36}
                  height={36}
                  className="rounded object-contain"
                />
              </div>
              <div>
                <h2 className="text-lg text-gray-900">Docbase連携</h2>
                <p className="text-gray-600 mt-2">Docbaseの記事を検索・収集</p>
              </div>
            </Link>

            <Link
              href="/slack"
              className="flex items-center space-x-4 p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
                <Image
                  src="/slack-icon.svg"
                  alt="Slack"
                  width={64}
                  height={64}
                  className="rounded object-contain"
                />
              </div>
              <div>
                <h2 className="text-lg text-gray-900">Slack連携</h2>
                <p className="text-gray-600 mt-2">
                  Slackのスレッドを検索・収集
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
