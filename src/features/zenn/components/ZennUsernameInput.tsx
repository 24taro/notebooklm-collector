"use client";

import type { FC } from "react";
import type { ZennUsernameInputProps } from "../types/forms";

/**
 * Zennユーザー名入力コンポーネント
 * @param username 入力値
 * @param onUsernameChange 入力値変更ハンドラ
 * @param error エラーメッセージ
 * @param disabled 非活性状態にするかどうか
 */
export const ZennUsernameInput: FC<ZennUsernameInputProps> = ({
  username,
  onUsernameChange,
  error,
  disabled,
}) => {
  return (
    <div className="mb-4">
      <label
        htmlFor="zenn-username"
        className="block text-base font-medium text-gray-700 mb-1"
      >
        Zennユーザー名（任意）
      </label>
      <input
        type="text"
        id="zenn-username"
        value={username}
        onChange={(e) => onUsernameChange(e.target.value)}
        placeholder="例: miyauchi"
        disabled={disabled}
        className={`block w-full px-4 py-3 border ${
          error ? "border-red-500" : "border-gray-400"
        } rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 ${
          error
            ? "focus:ring-red-500 focus:border-red-500"
            : "focus:ring-green-500 focus:border-green-500"
        } disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
        aria-describedby={error ? "zenn-username-error" : "zenn-username-help"}
      />
      {error && (
        <p id="zenn-username-error" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
      <p id="zenn-username-help" className="mt-1 text-xs text-gray-500">
        特定のユーザーの記事のみを検索したい場合に入力してください。空欄の場合は全ユーザーを対象とします。
      </p>
    </div>
  );
};
