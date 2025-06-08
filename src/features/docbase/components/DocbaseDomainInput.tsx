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
        className="block text-base font-medium text-docbase-text mb-1"
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
        className={`block w-full px-4 py-3 border ${error ? "border-red-500" : "border-gray-400"} rounded-md shadow-sm placeholder-docbase-text-sub focus:outline-none focus:ring-1 ${error ? "focus:ring-red-500 focus:border-red-500" : "focus:ring-docbase-primary focus:border-docbase-primary"} disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
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
