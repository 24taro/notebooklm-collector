// fetchHttpClient の包括的テスト
// 全機能のテストカバレッジとエラーケースを網羅

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFetchHttpClient } from '../../adapters/fetchHttpClient'
import type { RetryConfig } from '../../adapters/types'
import {
  createMockResponse,
  createMockErrorResponse,
  createMockNetworkError,
  delay,
} from '../utils/testHelpers'

// グローバル fetch のモック
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('fetchHttpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('正常レスポンス', () => {
    it('成功レスポンスを正しく処理する', async () => {
      const testData = { message: 'success', id: 123 }
      const mockResponse = createMockResponse(testData)
      mockFetch.mockResolvedValueOnce(mockResponse)

      const client = createFetchHttpClient()
      const result = await client.fetch<typeof testData>('https://api.test.com/data')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(testData)
      }
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/data', undefined)
    })

    it('カスタムオプションでリクエストを送信する', async () => {
      const testData = { result: 'created' }
      const mockResponse = createMockResponse(testData, { status: 201 })
      mockFetch.mockResolvedValueOnce(mockResponse)

      const client = createFetchHttpClient()
      const options: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
      }

      const result = await client.fetch<typeof testData>('https://api.test.com/create', options)

      expect(result.isOk()).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/create', options)
    })
  })

  describe('HTTPエラーレスポンス', () => {
    it('401 Unauthorizedエラーを正しく処理する', async () => {
      const mockResponse = createMockErrorResponse(401, 'Unauthorized')
      mockFetch.mockResolvedValueOnce(mockResponse)

      const client = createFetchHttpClient()
      const result = await client.fetch('https://api.test.com/protected')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('unauthorized')
        expect(result.error.message).toBe('Unauthorized - Please check your API token')
      }
    })

    it('403 Forbiddenエラーを正しく処理する', async () => {
      const mockResponse = createMockErrorResponse(403, 'Forbidden')
      mockFetch.mockResolvedValueOnce(mockResponse)

      const client = createFetchHttpClient()
      const result = await client.fetch('https://api.test.com/forbidden')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('missing_scope')
        expect(result.error.message).toBe('Forbidden - Missing required permissions')
      }
    })

    it('404 Not Foundエラーを正しく処理する', async () => {
      const mockResponse = createMockErrorResponse(404, 'Not Found')
      mockFetch.mockResolvedValueOnce(mockResponse)

      const client = createFetchHttpClient()
      const result = await client.fetch('https://api.test.com/nonexistent')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('notFound')
        expect(result.error.message).toBe('Resource not found')
      }
    })

    it('429 Rate Limitエラーを正しく処理する', async () => {
      const mockResponse = createMockErrorResponse(429, 'Too Many Requests')
      mockFetch.mockResolvedValueOnce(mockResponse)

      // リトライしない設定でテスト
      const client = createFetchHttpClient({ maxRetries: 0, initialBackoffMs: 10, retryableErrors: [] })
      const result = await client.fetch('https://api.test.com/limited')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('rate_limit')
        expect(result.error.message).toBe('Rate limit exceeded - Please try again later')
      }
    })

    it('400 Bad Requestエラーを正しく処理する', async () => {
      const mockResponse = createMockErrorResponse(400, 'Bad Request')
      mockFetch.mockResolvedValueOnce(mockResponse)

      const client = createFetchHttpClient()
      const result = await client.fetch('https://api.test.com/invalid')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('validation')
        expect(result.error.message).toBe('Bad request - Please check your parameters')
      }
    })

    it('500 Internal Server Errorを正しく処理する', async () => {
      const mockResponse = createMockErrorResponse(500, 'Internal Server Error')
      mockFetch.mockResolvedValueOnce(mockResponse)

      // リトライしない設定でテスト
      const client = createFetchHttpClient({ maxRetries: 0, initialBackoffMs: 10, retryableErrors: [] })
      const result = await client.fetch('https://api.test.com/error')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('network')
        expect(result.error.message).toBe('HTTP error: 500 Internal Server Error')
      }
    })
  })

  describe('ネットワークエラー', () => {
    it('ネットワークエラーを正しく処理する', async () => {
      const networkError = createMockNetworkError('Failed to fetch')
      mockFetch.mockRejectedValueOnce(networkError)

      // リトライしない設定でテスト
      const client = createFetchHttpClient({ maxRetries: 0, initialBackoffMs: 10, retryableErrors: [] })
      const result = await client.fetch('https://api.test.com/unreachable')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('network')
        expect(result.error.message).toBe('Failed to fetch')
        expect(result.error.cause).toBe(networkError)
      }
    })

    it('非Errorオブジェクトの例外を正しく処理する', async () => {
      mockFetch.mockRejectedValueOnce('String error')

      // リトライしない設定でテスト
      const client = createFetchHttpClient({ maxRetries: 0, initialBackoffMs: 10, retryableErrors: [] })
      const result = await client.fetch('https://api.test.com/weird-error')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('network')
        expect(result.error.message).toBe('Unknown network error')
      }
    })
  })

  describe('リトライ機能', () => {
    it('レート制限エラーで正しくリトライする', async () => {
      const rateLimitResponse = createMockErrorResponse(429, 'Too Many Requests')
      const successResponse = createMockResponse({ data: 'success after retry' })

      mockFetch
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(successResponse)

      const retryConfig: RetryConfig = {
        maxRetries: 3,
        initialBackoffMs: 10, // テスト用に短時間に設定
        retryableErrors: ['rate_limit'],
      }

      const client = createFetchHttpClient(retryConfig)
      const result = await client.fetch('https://api.test.com/retry-test')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({ data: 'success after retry' })
      }
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('ネットワークエラーで正しくリトライする', async () => {
      const networkError = createMockNetworkError('Connection failed')
      const successResponse = createMockResponse({ data: 'success after network retry' })

      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse)

      const retryConfig: RetryConfig = {
        maxRetries: 3,
        initialBackoffMs: 10,
        retryableErrors: ['network'],
      }

      const client = createFetchHttpClient(retryConfig)
      const result = await client.fetch('https://api.test.com/network-retry')

      expect(result.isOk()).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('最大リトライ回数に達した場合は失敗する', async () => {
      const rateLimitResponse = createMockErrorResponse(429, 'Too Many Requests')
      mockFetch.mockResolvedValue(rateLimitResponse)

      const retryConfig: RetryConfig = {
        maxRetries: 2,
        initialBackoffMs: 10,
        retryableErrors: ['rate_limit'],
      }

      const client = createFetchHttpClient(retryConfig)
      const result = await client.fetch('https://api.test.com/always-fail')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('rate_limit')
      }
      expect(mockFetch).toHaveBeenCalledTimes(3) // 初回 + 2回のリトライ
    })

    it('リトライ対象外のエラーではリトライしない', async () => {
      const unauthorizedResponse = createMockErrorResponse(401, 'Unauthorized')
      mockFetch.mockResolvedValueOnce(unauthorizedResponse)

      const retryConfig: RetryConfig = {
        maxRetries: 3,
        initialBackoffMs: 10,
        retryableErrors: ['rate_limit'], // 401はリトライ対象外
      }

      const client = createFetchHttpClient(retryConfig)
      const result = await client.fetch('https://api.test.com/unauthorized')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('unauthorized')
      }
      expect(mockFetch).toHaveBeenCalledTimes(1) // リトライしない
    })

    it('指数バックオフが正しく動作する', async () => {
      const startTime = Date.now()
      const rateLimitResponse = createMockErrorResponse(429, 'Too Many Requests')
      const successResponse = createMockResponse({ data: 'success' })

      mockFetch
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(successResponse)

      const retryConfig: RetryConfig = {
        maxRetries: 3,
        initialBackoffMs: 50,
        retryableErrors: ['rate_limit'],
      }

      const client = createFetchHttpClient(retryConfig)
      await client.fetch('https://api.test.com/backoff-test')

      const endTime = Date.now()
      const duration = endTime - startTime

      // 1回目のリトライ: 50ms待機
      // 2回目のリトライ: 100ms待機  
      // 合計最低150ms待機するはず
      expect(duration).toBeGreaterThan(100) // バックオフによる遅延を確認
    })
  })

  describe('カスタムリトライ設定', () => {
    it('カスタムリトライ設定を正しく適用する', async () => {
      const networkError = createMockNetworkError('Custom network error')
      mockFetch.mockRejectedValue(networkError)

      const customRetryConfig: RetryConfig = {
        maxRetries: 1,
        initialBackoffMs: 5,
        retryableErrors: ['network'],
      }

      const client = createFetchHttpClient(customRetryConfig)
      const result = await client.fetch('https://api.test.com/custom-retry')

      expect(result.isErr()).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2) // 初回 + 1回のリトライ
    })

    it('リトライなしの設定が正しく動作する', async () => {
      const rateLimitResponse = createMockErrorResponse(429, 'Too Many Requests')
      mockFetch.mockResolvedValueOnce(rateLimitResponse)

      const noRetryConfig: RetryConfig = {
        maxRetries: 0,
        initialBackoffMs: 1000,
        retryableErrors: ['rate_limit'],
      }

      const client = createFetchHttpClient(noRetryConfig)
      const result = await client.fetch('https://api.test.com/no-retry')

      expect(result.isErr()).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1) // リトライなし
    })

    it('空のリトライ対象エラー配列では何もリトライしない', async () => {
      const rateLimitResponse = createMockErrorResponse(429, 'Too Many Requests')
      mockFetch.mockResolvedValueOnce(rateLimitResponse)

      const emptyRetryConfig: RetryConfig = {
        maxRetries: 3,
        initialBackoffMs: 10,
        retryableErrors: [], // 何もリトライしない
      }

      const client = createFetchHttpClient(emptyRetryConfig)
      const result = await client.fetch('https://api.test.com/empty-retry-config')

      expect(result.isErr()).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('デフォルト設定', () => {
    it('引数なしでデフォルト設定が適用される', async () => {
      const unauthorizedResponse = createMockErrorResponse(401, 'Unauthorized')
      mockFetch.mockResolvedValueOnce(unauthorizedResponse)

      const client = createFetchHttpClient() // デフォルト設定
      const result = await client.fetch('https://api.test.com/default-config')

      expect(result.isErr()).toBe(true)
      // 401 はリトライ対象外なので、1回のみ呼ばれる
      expect(mockFetch).toHaveBeenCalledTimes(1)
      if (result.isErr()) {
        expect(result.error.type).toBe('unauthorized')
      }
    })
  })

  describe('エッジケース', () => {
    it('空のJSONレスポンスを正しく処理する', async () => {
      const emptyResponse = new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
      mockFetch.mockResolvedValueOnce(emptyResponse)

      const client = createFetchHttpClient()
      const result = await client.fetch<Record<string, never>>('https://api.test.com/empty')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({})
      }
    })

    it('不正なJSONレスポンスでエラーになる', async () => {
      const invalidJsonResponse = new Response('invalid json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
      mockFetch.mockResolvedValueOnce(invalidJsonResponse)

      // リトライしない設定でテスト
      const client = createFetchHttpClient({ maxRetries: 0, initialBackoffMs: 10, retryableErrors: [] })
      const result = await client.fetch('https://api.test.com/invalid-json')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('network')
        expect(result.error.message).toContain('Unexpected token')
      }
    })

    it('すべてのリトライが異なるエラーで失敗した場合、最後のエラーを返す', async () => {
      const networkError = createMockNetworkError('Network error')
      const timeoutError = createMockNetworkError('Timeout error')

      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(timeoutError)

      const retryConfig: RetryConfig = {
        maxRetries: 1,
        initialBackoffMs: 10,
        retryableErrors: ['network'],
      }

      const client = createFetchHttpClient(retryConfig)
      const result = await client.fetch('https://api.test.com/different-errors')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Timeout error') // 最後のエラー
      }
    })
  })
})