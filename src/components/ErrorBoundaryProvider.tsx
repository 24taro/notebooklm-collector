/**
 * Error Boundary プロバイダーコンポーネント
 * 
 * アプリケーション全体のエラーハンドリングを提供する
 * Client Componentとして動作し、Server Componentとの橋渡しを行う
 */

'use client'

import type { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface ErrorBoundaryProviderProps {
  children: ReactNode
}

export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // クライアントサイドでのエラーログ
        if (typeof window !== 'undefined') {
          console.error('Application-level error caught:', error, errorInfo)
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}