import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchSlackMessages,
  fetchSlackPermalink,
  fetchSlackThreadMessages,
  fetchSlackUserName,
} from '../../lib/slackClient'
import type { SlackMessage } from '../../types/slack'

describe('slackClient', () => {
  // fetchモックの準備
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchSlackMessages', () => {
    it('メッセージ検索が成功する場合', async () => {
      const mockResponse = {
        ok: true,
        messages: {
          matches: [
            {
              ts: '1234567890.123456',
              user: 'U123456',
              text: 'テストメッセージ',
              channel: { id: 'C123456', name: 'general' },
              permalink: 'https://slack.com/archives/C123456/p1234567890123456',
            },
          ],
          pagination: {
            page: 1,
            page_count: 1,
            total_count: 1,
            per_page: 20,
          },
        },
      }

      // fetchモックの設定
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchSlackMessages('xoxp-test-token', 'test query')

      // 結果の検証
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.messages).toHaveLength(1)
        expect(result.value.messages[0].text).toBe('テストメッセージ')
        expect(result.value.pagination.totalResults).toBe(1)
      }

      // fetch呼び出しの検証
      expect(global.fetch).toHaveBeenCalledWith(
        'https://slack.com/api/search.messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.stringContaining('token=xoxp-test-token'),
        }),
      )
    })

    it('パラメータが不足している場合はバリデーションエラーを返す', async () => {
      // トークンが空の場合
      const result1 = await fetchSlackMessages('', 'test query')
      expect(result1.isErr()).toBe(true)
      if (result1.isErr()) {
        expect(result1.error.type).toBe('validation')
      }

      // クエリが空の場合
      const result2 = await fetchSlackMessages('xoxp-test-token', '')
      expect(result2.isErr()).toBe(true)
      if (result2.isErr()) {
        expect(result2.error.type).toBe('validation')
      }
    })

    it('401エラーの場合は認証エラーを返す', async () => {
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'invalid_auth' }),
      })

      const result = await fetchSlackMessages('invalid-token', 'test query')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('unauthorized')
      }
    })

    it('レート制限エラーの場合はリトライする', async () => {
      // 最初の2回は429エラー、3回目で成功
      const mockResponse = {
        ok: true,
        messages: {
          matches: [],
          pagination: { page: 1, page_count: 1, total_count: 0, per_page: 20 },
        },
      }
      ;(global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ error: 'rate_limited' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ error: 'rate_limited' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })

      // タイムアウトを短くしてテストを高速化
      const result = await fetchSlackMessages('xoxp-test-token', 'test query', 20, 1, 3, 10)

      expect(result.isOk()).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('Slack APIエラーを適切に処理する', async () => {
      const mockResponse = {
        ok: false,
        error: 'missing_scope',
      }
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchSlackMessages('xoxp-test-token', 'test query')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('missing_scope')
      }
    })

    it('ネットワークエラーの場合はリトライする', async () => {
      const mockResponse = {
        ok: true,
        messages: {
          matches: [],
          pagination: { page: 1, page_count: 1, total_count: 0, per_page: 20 },
        },
      }

      // 最初はネットワークエラー、2回目で成功
      ;(global.fetch as Mock).mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchSlackMessages('xoxp-test-token', 'test query', 20, 1, 3, 10)

      expect(result.isOk()).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('fetchSlackThreadMessages', () => {
    it('スレッドメッセージの取得が成功する場合', async () => {
      const mockResponse = {
        ok: true,
        messages: [
          {
            ts: '1234567890.123456',
            user: 'U123456',
            text: '親メッセージ',
          },
          {
            ts: '1234567890.123457',
            user: 'U789012',
            text: '返信メッセージ',
            thread_ts: '1234567890.123456',
          },
        ],
      }
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchSlackThreadMessages('C123456', '1234567890.123456', 'xoxp-test-token')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.channel).toBe('C123456')
        expect(result.value.parent.text).toBe('親メッセージ')
        expect(result.value.replies).toHaveLength(1)
        expect(result.value.replies[0].text).toBe('返信メッセージ')
      }
    })

    it('スレッドが見つからない場合はエラーを返す', async () => {
      const mockResponse = {
        ok: false,
        error: 'thread_not_found',
      }
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchSlackThreadMessages('C123456', 'invalid-ts', 'xoxp-test-token')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('notFound')
      }
    })

    it('ネットワークエラーを適切に処理する', async () => {
      ;(global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchSlackThreadMessages('C123456', '1234567890.123456', 'xoxp-test-token')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('network')
      }
    })
  })

  describe('fetchSlackPermalink', () => {
    it('パーマリンクの取得が成功する場合', async () => {
      const mockPermalink = 'https://slack.com/archives/C123456/p1234567890123456'
      const mockResponse = {
        ok: true,
        permalink: mockPermalink,
      }
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchSlackPermalink('C123456', '1234567890.123456', 'xoxp-test-token')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(mockPermalink)
      }

      // Authorization headerの検証
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer xoxp-test-token',
          }),
        }),
      )
    })

    it('メッセージが見つからない場合はエラーを返す', async () => {
      const mockResponse = {
        ok: false,
        error: 'message_not_found',
      }
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchSlackPermalink('C123456', 'invalid-ts', 'xoxp-test-token')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('notFound')
      }
    })
  })

  describe('fetchSlackUserName', () => {
    it('ユーザー情報の取得が成功する場合', async () => {
      const mockResponse = {
        ok: true,
        user: {
          id: 'U123456',
          name: 'testuser',
          real_name: 'Test User',
        },
      }
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchSlackUserName('U123456', 'xoxp-test-token')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.id).toBe('U123456')
        expect(result.value.name).toBe('testuser')
        expect(result.value.real_name).toBe('Test User')
      }
    })

    it('ユーザーが見つからない場合はエラーを返す', async () => {
      const mockResponse = {
        ok: false,
        error: 'user_not_found',
      }
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchSlackUserName('invalid-user', 'xoxp-test-token')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('notFound')
      }
    })

    it('認証エラーを適切に処理する', async () => {
      const mockResponse = {
        ok: false,
        error: 'token_revoked',
      }
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchSlackUserName('U123456', 'invalid-token')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('unauthorized')
      }
    })
  })
})
