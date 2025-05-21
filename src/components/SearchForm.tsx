"use client";

import React, { useState, type FormEvent } from "react";
import DocbaseDomainInput from "./DocbaseDomainInput";
import DocbaseTokenInput from "./DocbaseTokenInput";
import { useSearch } from "../hooks/useSearch";
import type { ApiError } from "../types/error";

/**
 * 検索フォームコンポーネント
 */
const SearchForm = () => {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");

  const { posts, isLoading, error, searchPosts } = useSearch();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await searchPosts(domain, token, keyword);
  };

  const renderErrorCause = (currentError: ApiError | null) => {
    if (!currentError) return null;

    if (currentError.type === "network" || currentError.type === "unknown") {
      if (currentError.cause) {
        if (currentError.cause instanceof Error) {
          return <p className="text-sm">詳細: {currentError.cause.message}</p>;
        }
        return <p className="text-sm">詳細: {String(currentError.cause)}</p>;
      }
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="keyword">Keyword:</label>
        <input
          id="keyword"
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="検索キーワード"
          className="border p-2 rounded w-full"
          disabled={isLoading}
        />
      </div>
      <DocbaseDomainInput value={domain} onChange={setDomain} />
      <DocbaseTokenInput value={token} onChange={setToken} />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        disabled={isLoading}
      >
        {isLoading ? "検索中..." : "検索"}
      </button>

      {error && (
        <div className="mt-4 p-2 text-red-700 bg-red-100 border border-red-400 rounded">
          <p>エラー: {error.message}</p>
          {renderErrorCause(error)}
        </div>
      )}

      {posts.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">検索結果:</h2>
          <ul className="list-disc pl-5">
            {posts.map((post) => (
              <li key={post.id}>{post.title}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
};

export default SearchForm;
