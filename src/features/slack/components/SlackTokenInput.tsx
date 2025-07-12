import type {
  SlackTokenInputProps,
  SlackTokenInputRef,
} from "@/features/slack/types/forms";
import type React from "react";
import {
  type FC,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import useLocalStorage from "../../../hooks/useLocalStorage";

export const SlackTokenInput = forwardRef<
  SlackTokenInputRef,
  SlackTokenInputProps
>(({ token, onTokenChange, error, disabled, className = "" }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // 親コンポーネントから呼び出せるメソッドを定義
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  const [savedToken, setSavedToken] = useLocalStorage<string>(
    "slackApiToken",
    ""
  );
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Slackトークンのバリデーション
  const isValidTokenFormat = (token: string): boolean => {
    // Slack User Token: xoxp-で始まる
    // Slack Bot Token: xoxb-で始まる
    const slackTokenPattern = /^xox[pb]-[\w-]+$/;
    return slackTokenPattern.test(token) && token.length >= 20;
  };

  const hasValidFormat = token.length === 0 || isValidTokenFormat(token);

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor="slack-token"
        className="block text-sm font-medium text-gray-700"
      >
        Slack APIトークン
        <span className="text-red-500 ml-1">*</span>
      </label>

      <div className="flex flex-col space-y-2">
        <div className="relative">
          <input
            type={isTokenVisible ? "text" : "password"}
            id="slack-token"
            ref={inputRef}
            value={token}
            onChange={handleInputChange}
            placeholder="xoxp-... または xoxb-..."
            disabled={disabled}
            className={`w-full px-3 py-2 pr-24 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slack-primary focus:border-slack-primary transition-colors ${
              !hasValidFormat || error ? "border-red-500 bg-red-50" : ""
            } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
            aria-describedby={
              error || !hasValidFormat ? "slack-token-error" : undefined
            }
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

        {/* バリデーションエラー表示 */}
        {!hasValidFormat && (
          <p className="text-sm text-red-600">
            トークンの形式が正しくありません。xoxp-またはxoxb-で始まる必要があります。
          </p>
        )}

        {/* 文字数カウンター */}
        <div className="text-xs text-gray-500 text-right">
          {isMounted ? `${token.length}文字` : "0文字"}
        </div>

        {/* ボタン群 */}
        <div className="flex space-x-2">
          {isMounted && showSaveButton && hasValidFormat && (
            <button
              type="button"
              onClick={handleSaveToken}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-slack-primary hover:bg-slack-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slack-primary transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>保存</title>
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

          {isMounted && savedToken && savedToken !== token && (
            <button
              type="button"
              onClick={handleLoadToken}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slack-primary transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>読み込み</title>
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

      {/* エラーメッセージ */}
      {(error || !hasValidFormat) && (
        <p id="slack-token-error" className="text-sm text-red-600" role="alert">
          {error || "トークンの形式が正しくありません"}
        </p>
      )}

      {/* ヘルプテキスト */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          📝 トークンは{" "}
          <a
            href="https://api.slack.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slack-primary hover:text-slack-primary-dark underline"
          >
            Slack Apps設定ページ
          </a>
          で発行できます
        </p>
        <p>🔒 トークンはブラウザ内でのみ保存され、外部に送信されません</p>
        <p>✅ User Token (xoxp-) または Bot Token (xoxb-) が利用可能です</p>
        <p>📋 search:read権限が必要です</p>
      </div>
    </div>
  );
});
