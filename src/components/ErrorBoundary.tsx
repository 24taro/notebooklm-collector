/**
 * Error Boundary コンポーネント
 *
 * Reactアプリケーション内で発生した予期しないエラーをキャッチし、
 * ユーザーフレンドリーなエラー画面を表示する。
 * アプリ全体のクラッシュを防ぎ、適切なエラーハンドリングを提供する。
 */

"use client";

import type React from "react";
import { Component, type ReactNode } from "react";
import type { ErrorInfo } from "react";
import { logError } from "../utils/errorStorage";
import { ErrorFallback } from "./ErrorFallback";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{
    error: Error | null;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // エラーが発生したことを示すために state を更新
    return {
      hasError: true,
      error,
      errorId:
        Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラー情報を state に保存
    this.setState({
      errorInfo,
    });

    // エラーログを記録
    const errorLog = logError(error, errorInfo, {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    // 開発環境でのデバッグ情報
    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Error Boundary Caught Error");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Component Stack:", errorInfo.componentStack);
      console.error("Error Log ID:", errorLog.id);
      console.groupEnd();
    }

    // プロップスで渡されたエラーハンドラを実行
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックコンポーネントがある場合はそれを使用
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      // デフォルトのエラーフォールバックを表示
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}
