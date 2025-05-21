"use client";

import React, { useState, type FormEvent, useEffect } from "react";
import DocbaseDomainInput from "./DocbaseDomainInput";
import DocbaseTokenInput from "./DocbaseTokenInput";
import { useSearch } from "../hooks/useSearch";
import { useDownload } from "../hooks/useDownload";
import useLocalStorage from "../hooks/useLocalStorage";
import type { ApiError } from "../types/error";
import { generateMarkdown } from "../utils/markdownGenerator";
import MarkdownPreview from "./MarkdownPreview";

const LOCAL_STORAGE_DOMAIN_KEY = "docbaseDomain";
const LOCAL_STORAGE_TOKEN_KEY = "docbaseToken";

/**
 * 検索フォームコンポーネント
 */
const SearchForm = () => {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useLocalStorage<string>(
    LOCAL_STORAGE_DOMAIN_KEY,
    ""
  );
  const [token, setToken] = useLocalStorage<string>(
    LOCAL_STORAGE_TOKEN_KEY,
    ""
  );
  const [markdownContent, setMarkdownContent] = useState("");

  const { posts, isLoading, error, searchPosts } = useSearch();
  const { isDownloading, handleDownload } = useDownload();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMarkdownContent("");
    await searchPosts(domain, token, keyword);
  };

  useEffect(() => {
    if (posts && posts.length > 0) {
      const md = generateMarkdown(posts);
      setMarkdownContent(md);
    } else {
      setMarkdownContent("");
    }
  }, [posts]);

  const handleDownloadClick = () => {
    const postsExist = posts && posts.length > 0;
    handleDownload(markdownContent, keyword, postsExist);
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
          disabled={isLoading || isDownloading}
        />
      </div>
      <DocbaseDomainInput value={domain} onChange={setDomain} />
      <DocbaseTokenInput value={token} onChange={setToken} />
      <div className="flex space-x-2">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          disabled={isLoading || isDownloading}
        >
          {isLoading ? "検索中..." : "検索"}
        </button>
        <button
          type="button"
          onClick={handleDownloadClick}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          disabled={isLoading || isDownloading || !markdownContent.trim()}
        >
          {isDownloading ? "ダウンロード中..." : "Markdownダウンロード"}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-2 text-red-700 bg-red-100 border border-red-400 rounded">
          <p>エラー: {error.message}</p>
          {renderErrorCause(error)}
        </div>
      )}

      {markdownContent && !isLoading && !error && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Markdownプレビュー</h2>
          <MarkdownPreview markdown={markdownContent} />
        </div>
      )}
    </form>
  );
};

export default SearchForm;
