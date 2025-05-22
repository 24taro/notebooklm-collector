import type { FC } from "react";

type DocbaseTokenInputProps = {
  token: string;
  onTokenChange: (token: string) => void;
  error?: string;
  disabled?: boolean;
};

/**
 * Docbaseアクセストークン入力コンポーネント
 * @param token 入力値
 * @param onTokenChange 入力値変更ハンドラ
 * @param error エラーメッセージ
 * @param disabled 非活性状態にするかどうか
 */
export const DocbaseTokenInput: FC<DocbaseTokenInputProps> = ({
  token,
  onTokenChange,
  error,
  disabled,
}) => {
  return (
    <div className="mb-4">
      <label
        htmlFor="docbase-token"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Docbase APIトークン
      </label>
      <input
        type="password"
        id="docbase-token"
        value={token}
        onChange={(e) => onTokenChange(e.target.value)}
        placeholder="APIトークンを入力"
        disabled={disabled}
        className={`w-full px-3 py-2 border ${
          error ? "border-red-500" : "border-gray-300"
        } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-150 ease-in-out bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed`}
        aria-describedby={error ? "docbase-token-error" : undefined}
      />
      {error && (
        <p id="docbase-token-error" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
