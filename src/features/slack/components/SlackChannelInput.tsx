import type { SlackChannelInputProps } from "@/features/slack/types/forms";
import type { FC } from "react";

export const SlackChannelInput: FC<SlackChannelInputProps> = ({
  channel,
  onChannelChange,
  error,
  disabled,
}) => {
  return (
    <div>
      <label
        htmlFor="slack-channel"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        チャンネル (例: #general)
      </label>
      <input
        type="text"
        id="slack-channel"
        value={channel}
        onChange={(e) => onChannelChange(e.target.value)}
        placeholder="#general"
        disabled={disabled}
        className={`block w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-400"} rounded-md shadow-sm placeholder-docbase-text-sub focus:outline-none focus:ring-1 ${error ? "focus:ring-red-500 focus:border-red-500" : "focus:ring-docbase-primary focus:border-docbase-primary"} disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
        aria-describedby={error ? "slack-channel-error" : undefined}
      />
      {error && (
        <p id="slack-channel-error" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
