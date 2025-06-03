// Slack フォーム管理フック - 一時的に無効化

'use client'

import { useState } from 'react'
import type { UseSlackFormResult } from '../types/forms'

export function useSlackForm(): UseSlackFormResult {
  const [searchQuery, setSearchQuery] = useState('')
  const [token, setToken] = useState('')
  const [channel, setChannel] = useState('')
  const [author, setAuthor] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  return {
    searchQuery,
    onSearchQueryChange: setSearchQuery,
    token,
    onTokenChange: setToken,
    channel,
    onChannelChange: setChannel,
    author,
    onAuthorChange: setAuthor,
    showAdvanced,
    onToggleAdvanced: () => setShowAdvanced(!showAdvanced),
    onSearch: () => console.log('Search clicked'),
    onFullDownload: () => console.log('Download clicked'),
    isLoading: false,
    isValid: true,
    tokenError: null,
    queryError: null,
  }
}
