"use client";

import React, { useState } from "react";
import DocbaseDomainInput from "./DocbaseDomainInput";
import DocbaseTokenInput from "./DocbaseTokenInput";

/**
 * 検索フォームコンポーネント
 */
const SearchForm: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // ここで検索処理を呼び出す (Issue #2 で実装予定)
    console.log({ keyword, domain, token });
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
        />
      </div>
      <DocbaseDomainInput value={domain} onChange={setDomain} />
      <DocbaseTokenInput value={token} onChange={setToken} />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        検索
      </button>
    </form>
  );
};

export default SearchForm;
