// テスト用ユーティリティ関数群
// 型安全なモックデータ生成とヘルパー関数を提供

import { type RenderHookResult, renderHook } from '@testing-library/react'
import { act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { type MockedFunction, vi } from 'vitest'
import type { HttpClient } from '../../adapters/types'
import type { DocbasePostListItem } from '../../types/docbase'
import type { ApiError } from '../../types/error'
import type { SlackMessage, SlackThread, SlackUser } from '../../types/slack'

/**
 * テスト用型定義
 */
export type MockedFetch = MockedFunction<typeof fetch>
export type MockedLocalStorage = {
  getItem: MockedFunction<(key: string) => string | null>
  setItem: MockedFunction<(key: string, value: string) => void>
  removeItem: MockedFunction<(key: string) => void>
  clear: MockedFunction<() => void>
}

/**
 * fetchのモック作成ヘルパー
 */
export function createMockFetch(): MockedFetch {
  return vi.fn() as MockedFetch
}

/**
 * HttpClientのモック作成ヘルパー
 */
export function createMockHttpClient(): {
  fetch: MockedFunction<HttpClient['fetch']>
} {
  return {
    fetch: vi.fn(),
  }
}

/**
 * LocalStorageのモック作成ヘルパー
 */
export function createMockLocalStorage(): MockedLocalStorage {
  const storage: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(storage)) {
        delete storage[key]
      }
    }),
  }
}

/**
 * テスト用Slackメッセージ生成ヘルパー
 */
export function createMockSlackMessage(overrides: Partial<SlackMessage> = {}): SlackMessage {
  const defaults: SlackMessage = {
    ts: '1234567890.123456',
    user: 'U1234567890',
    text: 'テストメッセージ',
    channel: { id: 'C1234567890', name: 'general' },
    permalink: 'https://test.slack.com/archives/C1234567890/p1234567890123456',
  }

  return { ...defaults, ...overrides }
}

/**
 * テスト用Slackスレッド生成ヘルパー
 */
export function createMockSlackThread(overrides: Partial<SlackThread> = {}): SlackThread {
  const defaults: SlackThread = {
    channel: 'C1234567890',
    parent: createMockSlackMessage({ ts: '1234567890.123456' }),
    replies: [
      createMockSlackMessage({
        ts: '1234567890.123457',
        thread_ts: '1234567890.123456',
        text: 'リプライメッセージ1',
      }),
      createMockSlackMessage({
        ts: '1234567890.123458',
        thread_ts: '1234567890.123456',
        text: 'リプライメッセージ2',
      }),
    ],
  }

  return { ...defaults, ...overrides }
}

/**
 * テスト用Slackユーザー生成ヘルパー
 */
export function createMockSlackUser(overrides: Partial<SlackUser> = {}): SlackUser {
  const defaults: SlackUser = {
    id: 'U1234567890',
    name: 'testuser',
    real_name: 'テストユーザー',
  }

  return { ...defaults, ...overrides }
}

/**
 * テスト用Docbase記事生成ヘルパー
 */
export function createMockDocbasePost(overrides: Partial<DocbasePostListItem> = {}): DocbasePostListItem {
  const defaults: DocbasePostListItem = {
    id: 12345,
    title: 'テスト記事',
    body: 'テスト記事の本文です。',
    created_at: '2023-01-01T00:00:00Z',
    url: 'https://test.docbase.io/posts/12345',
  }

  return { ...defaults, ...overrides }
}

/**
 * テスト用ApiError生成ヘルパー
 */
export function createMockApiError(overrides: Partial<ApiError> = {}): ApiError {
  const defaults: ApiError = {
    type: 'network',
    message: 'テスト用エラーメッセージ',
  }

  return { ...defaults, ...overrides }
}

/**
 * HTTP レスポンスモック作成ヘルパー
 */
export function createMockResponse<T>(
  data: T,
  options: {
    status?: number
    statusText?: string
    headers?: Record<string, string>
  } = {},
): Response {
  const { status = 200, statusText = 'OK', headers = {} } = options

  return new Response(JSON.stringify(data), {
    status,
    statusText,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

/**
 * エラーレスポンスモック作成ヘルパー
 */
export function createMockErrorResponse(status: number, statusText = 'Error'): Response {
  return new Response(null, { status, statusText })
}

/**
 * ネットワークエラーモック作成ヘルパー
 */
export function createMockNetworkError(message = 'Network Error'): Error {
  return new Error(message)
}

/**
 * React Hook テスト用ヘルパー
 */
export function renderHookWithAct<T, P>(
  hook: (props: P) => T,
  options?: {
    initialProps?: P
    wrapper?: ({ children }: { children: ReactNode }) => ReactNode
  },
): RenderHookResult<T, P> {
  return renderHook(hook, options)
}

/**
 * act() ヘルパー - 非同期処理用
 */
export async function actAsync(fn: () => Promise<void>): Promise<void> {
  await act(async () => {
    await fn()
  })
}

/**
 * 遅延実行ヘルパー
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 複数回実行されるまで待機するヘルパー
 */
export async function waitForCalls(
  mockFn: MockedFunction<(...args: unknown[]) => unknown>,
  expectedCallCount: number,
  timeout = 5000,
): Promise<void> {
  const startTime = Date.now()

  while (mockFn.mock.calls.length < expectedCallCount) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout: Expected ${expectedCallCount} calls, but got ${mockFn.mock.calls.length}`)
    }
    await delay(10)
  }
}

/**
 * コンソール出力をキャプチャするヘルパー
 */
export function captureConsole(): {
  log: string[]
  error: string[]
  warn: string[]
  restore: () => void
} {
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  const logs: string[] = []
  const errors: string[] = []
  const warns: string[] = []

  console.log = (...args: unknown[]) => {
    logs.push(args.map((arg) => String(arg)).join(' '))
  }

  console.error = (...args: unknown[]) => {
    errors.push(args.map((arg) => String(arg)).join(' '))
  }

  console.warn = (...args: unknown[]) => {
    warns.push(args.map((arg) => String(arg)).join(' '))
  }

  return {
    log: logs,
    error: errors,
    warn: warns,
    restore: () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    },
  }
}
