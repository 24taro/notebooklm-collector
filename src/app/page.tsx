"use client"; // クライアントコンポーネントとしてマーク

import SearchForm from "../components/SearchForm"; // パスを修正
import { Toaster } from "react-hot-toast"; // Toasterをインポート

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Toaster position="top-right" /> {/* Toasterコンポーネントを配置 */}
      <h1 className="text-4xl font-bold mb-8">Docbase NotebookLM Collector</h1>
      <div className="w-full max-w-lg">
        <SearchForm />
      </div>
    </main>
  );
}
