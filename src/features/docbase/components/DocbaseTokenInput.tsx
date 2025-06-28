import React, {
  type FC,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type DocbaseTokenInputProps = {
  token: string;
  onTokenChange: (token: string) => void;
  error?: string;
  disabled?: boolean;
};

// focusメソッドを持つRefの型を定義
export type DocbaseTokenInputRef = {
  focus: () => void;
};

/**
 * Docbaseアクセストークン入力コンポーネント
 * @param token 入力値
 * @param onTokenChange 入力値変更ハンドラ
 * @param error エラーメッセージ
 * @param disabled 非活性状態にするかどうか
 */
export const DocbaseTokenInput = forwardRef<
  DocbaseTokenInputRef,
  DocbaseTokenInputProps
>(({ token, onTokenChange, error, disabled }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null); // input要素への参照を作成
  const [showToken, setShowToken] = useState(false); // トークン表示/非表示の状態

  // 親コンポーネントから呼び出せるメソッドを定義
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  return (
    <div className="mb-4">
      <label
        htmlFor="docbase-token"
        className="block text-base font-medium text-docbase-text mb-1"
      >
        Docbase APIトークン
      </label>
      <div className="relative">
        <input
          type={showToken ? "text" : "password"}
          id="docbase-token"
          ref={inputRef} // input要素にrefを渡す
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="APIトークンを入力"
          disabled={disabled}
          className={`block w-full px-4 py-3 pr-12 border ${error ? "border-red-500" : "border-gray-400"} rounded-md shadow-sm placeholder-docbase-text-sub focus:outline-none focus:ring-1 ${error ? "focus:ring-red-500 focus:border-red-500" : "focus:ring-docbase-primary focus:border-docbase-primary"} disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
          aria-describedby={error ? "docbase-token-error" : undefined}
        />
        <button
          type="button"
          onClick={() => setShowToken(!showToken)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
          aria-label={showToken ? "トークンを隠す" : "トークンを表示"}
        >
          {showToken ? (
            // 非表示アイコン
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>トークンを隠す</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          ) : (
            // 表示アイコン
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>トークンを表示</title>
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
      {error && (
        <p id="docbase-token-error" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});
