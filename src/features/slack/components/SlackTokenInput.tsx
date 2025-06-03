import type { SlackTokenInputProps, SlackTokenInputRef } from '@/features/slack/types/forms'
import React, { type FC, forwardRef, useImperativeHandle, useRef } from 'react'

export const SlackTokenInput = forwardRef<SlackTokenInputRef, SlackTokenInputProps>(
  ({ token, onTokenChange, error, disabled }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus()
      },
    }))
    return (
      <div className="mb-4">
        <label htmlFor="slack-token" className="block text-base font-medium text-gray-700 mb-1">
          Slack APIトークン
        </label>
        <input
          type="password"
          id="slack-token"
          ref={inputRef}
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="xoxp-..."
          disabled={disabled}
          className={`block w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-400'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-400 focus:border-blue-400'} disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
          aria-describedby={error ? 'slack-token-error' : undefined}
        />
        {error && (
          <p id="slack-token-error" className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  },
)