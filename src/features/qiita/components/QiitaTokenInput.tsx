import { useState } from "react";
import useLocalStorage from "../../../hooks/useLocalStorage";

interface QiitaTokenInputProps {
  token: string;
  onTokenChange: (token: string) => void;
  className?: string;
}

/**
 * Qiitaアクセストークン入力コンポーネント
 * LocalStorageとの連携機能を含む
 */
export const QiitaTokenInput: React.FC<QiitaTokenInputProps> = ({
  token,
  onTokenChange,
  className = "",
}) => {
  const [savedToken, setSavedToken] = useLocalStorage<string>(
    "qiitaApiToken",
    ""
  );
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isTokenVisible, setIsTokenVisible] = useState(false);

  // 入力値の変更ハンドラー
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value;
    onTokenChange(newToken);
    // 保存済みトークンと異なる場合は保存ボタンを表示
    setShowSaveButton(newToken !== savedToken && newToken.length > 0);
  };

  // トークン保存ハンドラー
  const handleSaveToken = () => {
    setSavedToken(token);
    setShowSaveButton(false);
  };

  // 保存済みトークンの読み込み
  const handleLoadToken = () => {
    if (savedToken) {
      onTokenChange(savedToken);
      setShowSaveButton(false);
    }
  };

  // トークンの表示/非表示切り替え
  const toggleTokenVisibility = () => {
    setIsTokenVisible(!isTokenVisible);
  };

  // トークン形式のバリデーション（40文字の16進数）
  const isValidTokenFormat = (token: string): boolean => {
    return /^[0-9a-f]{40}$/i.test(token);
  };

  const hasValidFormat = token.length === 0 || isValidTokenFormat(token);

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor="qiita-token"
        className="block text-sm font-medium text-gray-700"
      >
        Qiitaアクセストークン
        <span className="text-red-500 ml-1">*</span>
      </label>

      <div className="flex flex-col space-y-2">
        <div className="relative">
          <input
            type={isTokenVisible ? "text" : "password"}
            id="qiita-token"
            value={token}
            onChange={handleInputChange}
            placeholder="40文字の16進数トークンを入力してください"
            className={`w-full px-3 py-2 pr-24 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
              !hasValidFormat ? "border-red-500 bg-red-50" : ""
            }`}
            maxLength={40}
          />

          {/* 表示/非表示切り替えボタン */}
          <button
            type="button"
            onClick={toggleTokenVisibility}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            title={isTokenVisible ? "トークンを隠す" : "トークンを表示"}
          >
            {isTokenVisible ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

        {/* バリデーションエラー表示 */}
        {!hasValidFormat && (
          <p className="text-sm text-red-600">
            トークンは40文字の16進数である必要があります。
          </p>
        )}

        {/* 文字数カウンター */}
        <div className="text-xs text-gray-500 text-right">
          {token.length}/40文字
        </div>

        {/* ボタン群 */}
        <div className="flex space-x-2">
          {showSaveButton && hasValidFormat && (
            <button
              type="button"
              onClick={handleSaveToken}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              保存
            </button>
          )}

          {savedToken && savedToken !== token && (
            <button
              type="button"
              onClick={handleLoadToken}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              保存済みを読込
            </button>
          )}
        </div>
      </div>

      {/* ヘルプテキスト */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          📝 トークンは{" "}
          <a
            href="https://qiita.com/settings/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700 underline"
          >
            Qiita設定ページ
          </a>
          で発行できます
        </p>
        <p>🔒 トークンはブラウザ内でのみ保存され、外部に送信されません</p>
        <p>✅ スコープ「read_qiita」が必要です</p>
      </div>
    </div>
  );
};
