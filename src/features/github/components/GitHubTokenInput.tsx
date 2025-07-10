import React, {
  type FC,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { GitHubTokenInputProps } from "../types/forms";

// focusメソッドを持つRefの型を定義
export type GitHubTokenInputRef = {
  focus: () => void;
};

/**
 * GitHub Personal Access Token入力コンポーネント
 * @param token 入力値
 * @param onTokenChange 入力値変更ハンドラ
 * @param isStoring ローカルストレージ保存フラグ
 * @param onStoringChange ローカルストレージ保存フラグ変更ハンドラ
 * @param className 追加のCSSクラス
 */
export const GitHubTokenInput = forwardRef<
  GitHubTokenInputRef,
  GitHubTokenInputProps
>(({ token, onTokenChange, isStoring, onStoringChange, className }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null); // input要素への参照を作成
  const [showToken, setShowToken] = useState(false); // トークン表示/非表示の状態

  // 親コンポーネントから呼び出せるメソッドを定義
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  return (
    <div className={`mb-4 ${className || ""}`}>
      <label
        htmlFor="github-token"
        className="block text-base font-medium text-gray-800 mb-1"
      >
        GitHub Personal Access Token
      </label>
      <div className="mb-2">
        <p className="text-sm text-gray-600">
          GitHubの検索を実行するには Personal Access Token が必要です。
        </p>
      </div>

      <div className="relative">
        <input
          type={showToken ? "text" : "password"}
          id="github-token"
          ref={inputRef} // input要素にrefを渡す
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className="block w-full px-4 py-3 pr-12 border border-gray-400 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          aria-describedby="github-token-help"
        />
        <button
          type="button"
          onClick={() => setShowToken(!showToken)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={showToken ? "トークンを隠す" : "トークンを表示する"}
        >
          {showToken ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>トークンを隠す</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>トークンを表示する</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* ローカルストレージ保存オプション */}
      <div className="mt-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isStoring}
            onChange={(e) => onStoringChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-600">
            ローカルストレージにトークンを保存（次回の入力を省略）
          </span>
        </label>
      </div>

      {/* ヘルプテキスト */}
      <div id="github-token-help" className="mt-2 text-sm text-gray-600">
        <div className="mb-2">
          <strong>Personal Access Token の作成手順:</strong>
        </div>
        <ol className="list-decimal ml-4 space-y-1">
          <li>
            GitHub → Settings → Developer settings →
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline ml-1"
            >
              Personal access tokens
            </a>
          </li>
          <li>
            <strong>Fine-grained tokens</strong> を推奨（より安全）
          </li>
          <li>
            必要な権限:{" "}
            <code className="bg-gray-100 px-1 rounded">Issues (read)</code>,{" "}
            <code className="bg-gray-100 px-1 rounded">
              Pull requests (read)
            </code>
            ,{" "}
            <code className="bg-gray-100 px-1 rounded">Discussions (read)</code>
          </li>
        </ol>
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
          <strong>🔒 セキュリティ:</strong>{" "}
          トークンはブラウザ内でのみ処理され、外部サーバーには送信されません。
        </div>
      </div>
    </div>
  );
});
