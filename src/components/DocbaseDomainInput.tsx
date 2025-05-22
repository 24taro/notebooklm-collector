"use client";

import type { FC } from "react";

type DocbaseDomainInputProps = {
  domain: string;
  onDomainChange: (domain: string) => void;
  error?: string;
  disabled?: boolean;
};

/**
 * Docbaseドメイン入力コンポーネント
 * @param domain 入力値
 * @param onDomainChange 入力値変更ハンドラ
 * @param error エラーメッセージ
 * @param disabled 非活性状態にするかどうか
 */
export const DocbaseDomainInput: FC<DocbaseDomainInputProps> = ({
  domain,
  onDomainChange,
  error,
  disabled,
}) => {
  return (
    <div className="mb-4">
      <label
        htmlFor="docbase-domain"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Docbaseドメイン
      </label>
      <input
        type="text"
        id="docbase-domain"
        value={domain}
        onChange={(e) => onDomainChange(e.target.value)}
        placeholder="example"
        disabled={disabled}
        className={`w-full px-3 py-2 border ${
          error ? "border-red-500" : "border-gray-300"
        } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-150 ease-in-out bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed`}
        aria-describedby={error ? "docbase-domain-error" : undefined}
      />
      {error && (
        <p id="docbase-domain-error" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
