import type { SlackAuthorInputProps } from "@/features/slack/types/forms";
import type { FC } from "react";

export const SlackAuthorInput: FC<SlackAuthorInputProps> = ({
  author,
  onAuthorChange,
  error,
  disabled,
}) => {
  return (
    <div className="mb-4">
      <label
        htmlFor="slack-author"
        className="block text-base font-medium text-gray-700 mb-1"
      >
        投稿者 (例: @user)
      </label>
      <input
        type="text"
        id="slack-author"
        value={author}
        onChange={(e) => onAuthorChange(e.target.value)}
        placeholder="@user"
        disabled={disabled}
        className={`block w-full px-4 py-3 border ${error ? "border-red-500" : "border-gray-400"} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 ${error ? "focus:ring-red-500 focus:border-red-500" : "focus:ring-blue-400 focus:border-blue-400"} disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
        aria-describedby={error ? "slack-author-error" : undefined}
      />
      {error && (
        <p id="slack-author-error" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
