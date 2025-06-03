import type { FC } from 'react'
import type { SlackChannelInputProps } from '../types/forms'

export const SlackChannelInput: FC<SlackChannelInputProps> = ({ channel, onChannelChange, error, disabled }) => {
  return (
    <div className="mb-4">
      <label htmlFor="slack-channel" className="block text-base font-medium text-gray-700 mb-1">
        チャンネル (例: #general)
      </label>
      <input
        type="text"
        id="slack-channel"
        value={channel}
        onChange={(e) => onChannelChange(e.target.value)}
        placeholder="#general"
        disabled={disabled}
        className={`block w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-400'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-400 focus:border-blue-400'} disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
        aria-describedby={error ? 'slack-channel-error' : undefined}
      />
      {error && (
        <p id="slack-channel-error" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
