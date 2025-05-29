/**
 * 検索フォーム用Error Boundaryラッパー
 * 
 * 各検索フォームコンポーネントを個別のError Boundaryで保護する
 */

'use client'

import type { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface SearchFormWithErrorBoundaryProps {
  children: ReactNode
  formType: 'slack' | 'docbase'
}

export function SearchFormWithErrorBoundary({ 
  children, 
  formType 
}: SearchFormWithErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`${formType} search form error:`, error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}