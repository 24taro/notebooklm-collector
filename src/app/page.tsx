"use client"; // クライアントコンポーネントとしてマーク

import SearchForm from "../components/SearchForm"; // パスを修正

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Docbase NotebookLM Collector</h1>
      <div className="w-full max-w-lg">
        <SearchForm />
      </div>
    </main>
  );
}
