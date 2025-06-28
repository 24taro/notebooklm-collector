import type {
  SlackTokenInputProps,
  SlackTokenInputRef,
} from "@/features/slack/types/forms";
import React, {
  type FC,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export const SlackTokenInput = forwardRef<
  SlackTokenInputRef,
  SlackTokenInputProps
>(({ token, onTokenChange, error, disabled }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showToken, setShowToken] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  return (
    <div className="mb-4">
      <label
        htmlFor="slack-token"
        className="block text-base font-medium text-gray-700 mb-1"
      >
        Slack APIトークン
      </label>
      <div className="relative">
        <input
          type={showToken ? "text" : "password"}
          id="slack-token"
          ref={inputRef}
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="xoxp-..."
          disabled={disabled}
          className={`block w-full px-4 py-3 pr-12 border ${error ? "border-red-500" : "border-gray-400"} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 ${error ? "focus:ring-red-500 focus:border-red-500" : "focus:ring-docbase-primary focus:border-docbase-primary"} disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
          aria-describedby={error ? "slack-token-error" : undefined}
        />
        <button
          type="button"
          onClick={() => setShowToken(!showToken)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
          tabIndex={-1}
        >
          {showToken ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <title>パスワードを非表示にする</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <title>パスワードを表示する</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p id="slack-token-error" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});
