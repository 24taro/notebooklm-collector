// Slack検索統合フック - 一時的に無効化

'use client'

export function useSlackSearchUnified() {
  return {
    state: {
      isLoading: false,
      error: null,
      messages: [],
      slackThreads: [],
      userMaps: {},
      permalinkMaps: {},
      currentPreviewMarkdown: '',
      progressStatus: { phase: 'idle' as const, message: '', current: 0, total: 0 },
    },
    search: async () => {},
    retrySearch: () => {},
    canRetry: false,
  }
}
