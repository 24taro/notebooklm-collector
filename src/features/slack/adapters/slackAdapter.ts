// Slack APIアダプター実装 - 一時的にスタブ化

import type { HttpClient } from '@/adapters/types'
import type { ApiError } from '@/types/error'
import { type Result, err, ok } from 'neverthrow'
import type { SlackMessage, SlackThread, SlackUser } from '../types/slack'

export interface SlackSearchParams {
  token: string
  query: string
  count?: number
  page?: number
}

export interface SlackSearchResponse {
  messages: SlackMessage[]
  pagination: {
    currentPage: number
    totalPages: number
    totalResults: number
    perPage: number
  }
}

export interface SlackAdapter {
  searchMessages(params: SlackSearchParams): Promise<Result<SlackSearchResponse, ApiError>>
  generateMarkdown(
    threads: SlackThread[],
    userMaps: Record<string, SlackUser>,
    permalinkMaps: Record<string, string>,
    searchQuery: string,
  ): Promise<Result<string, ApiError>>
}

export function createSlackAdapter(httpClient: HttpClient): SlackAdapter {
  return {
    async searchMessages(): Promise<Result<SlackSearchResponse, ApiError>> {
      return ok({
        messages: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalResults: 0,
          perPage: 20,
        },
      })
    },

    async generateMarkdown(): Promise<Result<string, ApiError>> {
      return ok('# Slack検索結果\n\n現在は実装中です。')
    },
  }
}
