/**
 * エラー情報保存・管理ユーティリティ
 * 
 * Error Boundaryでキャッチされたエラー情報を
 * LocalStorageに保存し、デバッグやサポートに活用する。
 */

import type { ErrorInfo } from 'react'

interface ErrorLog {
  id: string
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
  }
  errorInfo: {
    componentStack: string
  }
  context: {
    url: string
    userAgent: string
    viewport: {
      width: number
      height: number
    }
    userId?: string // 匿名ID
  }
}

interface ErrorStorageMetadata {
  version: string
  maxLogs: number
  lastCleanup: string
}

const ERROR_STORAGE_KEY = 'notebooklm_error_logs'
const ERROR_METADATA_KEY = 'notebooklm_error_metadata'
const MAX_ERROR_LOGS = 50
const STORAGE_VERSION = '1.0'

/**
 * エラーログをLocalStorageに保存
 */
export function logError(
  error: Error,
  errorInfo: ErrorInfo,
  additionalContext: {
    url: string
    userAgent: string
    timestamp: string
    userId?: string
  }
): ErrorLog {
  try {
    const errorLog: ErrorLog = {
      id: generateErrorId(),
      timestamp: additionalContext.timestamp,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      context: {
        url: additionalContext.url,
        userAgent: additionalContext.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        userId: additionalContext.userId || getOrCreateUserId(),
      },
    }

    // 既存のログを取得
    const existingLogs = getErrorLogs()
    
    // 新しいログを先頭に追加
    const updatedLogs = [errorLog, ...existingLogs]
    
    // 最大件数を超えた場合は古いログを削除
    const trimmedLogs = updatedLogs.slice(0, MAX_ERROR_LOGS)
    
    // LocalStorageに保存
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(trimmedLogs))
    
    // メタデータを更新
    updateMetadata()
    
    return errorLog
  } catch (storageError) {
    // LocalStorageの保存に失敗した場合はコンソールにログ出力
    console.error('Failed to save error log to localStorage:', storageError)
    console.error('Original error:', error)
    
    // 最低限のログオブジェクトを返す
    return {
      id: generateErrorId(),
      timestamp: additionalContext.timestamp,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      context: {
        url: additionalContext.url,
        userAgent: additionalContext.userAgent,
        viewport: {
          width: window.innerWidth || 0,
          height: window.innerHeight || 0,
        },
      },
    }
  }
}

/**
 * 保存されたエラーログを取得
 */
export function getErrorLogs(): ErrorLog[] {
  try {
    const stored = localStorage.getItem(ERROR_STORAGE_KEY)
    if (!stored) return []
    
    const logs = JSON.parse(stored)
    return Array.isArray(logs) ? logs : []
  } catch (error) {
    console.error('Failed to retrieve error logs:', error)
    return []
  }
}

/**
 * 特定のエラーログを取得
 */
export function getErrorLog(id: string): ErrorLog | null {
  const logs = getErrorLogs()
  return logs.find(log => log.id === id) || null
}

/**
 * エラーログを削除
 */
export function clearErrorLogs(): boolean {
  try {
    localStorage.removeItem(ERROR_STORAGE_KEY)
    localStorage.removeItem(ERROR_METADATA_KEY)
    return true
  } catch (error) {
    console.error('Failed to clear error logs:', error)
    return false
  }
}

/**
 * 古いエラーログをクリーンアップ（7日以上前のログを削除）
 */
export function cleanupOldErrorLogs(): number {
  try {
    const logs = getErrorLogs()
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    const recentLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime()
      return logTime > sevenDaysAgo
    })
    
    const removedCount = logs.length - recentLogs.length
    
    if (removedCount > 0) {
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(recentLogs))
      updateMetadata()
    }
    
    return removedCount
  } catch (error) {
    console.error('Failed to cleanup error logs:', error)
    return 0
  }
}

/**
 * エラーログの統計情報を取得
 */
export function getErrorLogStats(): {
  totalLogs: number
  lastError: string | null
  errorTypes: Record<string, number>
  timeRange: {
    oldest: string | null
    newest: string | null
  }
} {
  const logs = getErrorLogs()
  
  const errorTypes: Record<string, number> = {}
  let oldest: string | null = null
  let newest: string | null = null
  
  for (const log of logs) {
    // エラータイプをカウント
    errorTypes[log.error.name] = (errorTypes[log.error.name] || 0) + 1
    
    // 時間範囲を更新
    if (!oldest || log.timestamp < oldest) {
      oldest = log.timestamp
    }
    if (!newest || log.timestamp > newest) {
      newest = log.timestamp
    }
  }
  
  return {
    totalLogs: logs.length,
    lastError: logs.length > 0 ? logs[0].timestamp : null,
    errorTypes,
    timeRange: {
      oldest,
      newest,
    },
  }
}

/**
 * エラーログをCSV形式でエクスポート（デバッグ用）
 */
export function exportErrorLogsAsCSV(): string {
  const logs = getErrorLogs()
  
  const headers = [
    'ID',
    'Timestamp',
    'Error Name',
    'Error Message',
    'URL',
    'User Agent',
    'Viewport Width',
    'Viewport Height',
  ]
  
  const rows = logs.map(log => [
    log.id,
    log.timestamp,
    log.error.name,
    log.error.message.replace(/"/g, '""'), // CSV用にエスケープ
    log.context.url,
    log.context.userAgent.replace(/"/g, '""'),
    log.context.viewport.width.toString(),
    log.context.viewport.height.toString(),
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')
  
  return csvContent
}

/**
 * ユニークなエラーIDを生成
 */
function generateErrorId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

/**
 * 匿名ユーザーIDを取得または作成
 */
function getOrCreateUserId(): string {
  const USER_ID_KEY = 'notebooklm_user_id'
  
  try {
    let userId = localStorage.getItem(USER_ID_KEY)
    if (!userId) {
      userId = `user_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(USER_ID_KEY, userId)
    }
    return userId
  } catch {
    // LocalStorageにアクセスできない場合は一時的なIDを生成
    return `temp_${Date.now().toString(36)}`
  }
}

/**
 * メタデータを更新
 */
function updateMetadata(): void {
  try {
    const metadata: ErrorStorageMetadata = {
      version: STORAGE_VERSION,
      maxLogs: MAX_ERROR_LOGS,
      lastCleanup: new Date().toISOString(),
    }
    
    localStorage.setItem(ERROR_METADATA_KEY, JSON.stringify(metadata))
  } catch (error) {
    console.error('Failed to update error storage metadata:', error)
  }
}

/**
 * 開発環境用: エラーログの詳細表示
 */
export function debugErrorLogs(): void {
  if (process.env.NODE_ENV !== 'development') return
  
  const logs = getErrorLogs()
  const stats = getErrorLogStats()
  
  console.group('🐛 Error Logs Debug Info')
  console.log('Stats:', stats)
  console.log('All Logs:', logs)
  console.log('CSV Export:', exportErrorLogsAsCSV())
  console.groupEnd()
}