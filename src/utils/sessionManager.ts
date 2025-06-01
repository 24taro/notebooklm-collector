/**
 * セッション管理ユーティリティ
 * APIトークンのセッションタイムアウトと自動ログアウトを管理
 * 
 * 仕様:
 * - デフォルトセッションタイムアウト: 24時間
 * - 最終アクセス時刻の追跡
 * - セッション延長機能
 * - 自動ログアウト機能
 */

import { err, ok, type Result } from 'neverthrow';

export type SessionError =
  | { type: 'expired'; message: string }
  | { type: 'invalid'; message: string };

// セッション設定
const DEFAULT_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24時間
const SESSION_CHECK_INTERVAL_MS = 60 * 1000; // 1分ごとにチェック

// セッション情報の型
interface SessionInfo {
  lastAccessTime: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
}

// セッション管理クラス
class SessionManager {
  private checkInterval: number | null = null;
  private onExpireCallbacks: Array<() => void> = [];

  /**
   * セッションを開始
   */
  startSession(sessionKey: string, durationMs: number = DEFAULT_SESSION_DURATION_MS): void {
    const now = Date.now();
    const sessionInfo: SessionInfo = {
      lastAccessTime: now,
      expiresAt: now + durationMs
    };
    
    localStorage.setItem(`session_${sessionKey}`, JSON.stringify(sessionInfo));
    
    // 既存のインターバルをクリア
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // セッションチェックを開始
    this.checkInterval = window.setInterval(() => {
      this.checkSession(sessionKey);
    }, SESSION_CHECK_INTERVAL_MS);
  }

  /**
   * セッションを更新（アクセス時刻を更新）
   */
  updateSession(sessionKey: string): Result<void, SessionError> {
    const sessionResult = this.getSession(sessionKey);
    if (sessionResult.isErr()) {
      return err(sessionResult.error);
    }

    const sessionInfo = sessionResult.value;
    const now = Date.now();

    // セッションが期限切れの場合
    if (now > sessionInfo.expiresAt) {
      return err({
        type: 'expired',
        message: 'セッションの有効期限が切れています'
      });
    }

    // 最終アクセス時刻を更新
    sessionInfo.lastAccessTime = now;
    localStorage.setItem(`session_${sessionKey}`, JSON.stringify(sessionInfo));

    return ok(undefined);
  }

  /**
   * セッションを延長
   */
  extendSession(sessionKey: string, additionalMs: number = DEFAULT_SESSION_DURATION_MS): Result<void, SessionError> {
    const sessionResult = this.getSession(sessionKey);
    if (sessionResult.isErr()) {
      return err(sessionResult.error);
    }

    const sessionInfo = sessionResult.value;
    const now = Date.now();

    // 新しい有効期限を設定
    sessionInfo.lastAccessTime = now;
    sessionInfo.expiresAt = now + additionalMs;
    
    localStorage.setItem(`session_${sessionKey}`, JSON.stringify(sessionInfo));

    return ok(undefined);
  }

  /**
   * セッション情報を取得
   */
  getSession(sessionKey: string): Result<SessionInfo, SessionError> {
    const sessionData = localStorage.getItem(`session_${sessionKey}`);
    
    if (!sessionData) {
      return err({
        type: 'invalid',
        message: 'セッションが存在しません'
      });
    }

    try {
      const sessionInfo = JSON.parse(sessionData) as SessionInfo;
      return ok(sessionInfo);
    } catch {
      return err({
        type: 'invalid',
        message: 'セッション情報が破損しています'
      });
    }
  }

  /**
   * セッションの有効性をチェック
   */
  isSessionValid(sessionKey: string): boolean {
    const sessionResult = this.getSession(sessionKey);
    if (sessionResult.isErr()) {
      return false;
    }

    const now = Date.now();
    return now <= sessionResult.value.expiresAt;
  }

  /**
   * セッションの残り時間を取得（ミリ秒）
   */
  getRemainingTime(sessionKey: string): number {
    const sessionResult = this.getSession(sessionKey);
    if (sessionResult.isErr()) {
      return 0;
    }

    const now = Date.now();
    const remaining = sessionResult.value.expiresAt - now;
    return Math.max(0, remaining);
  }

  /**
   * セッションを終了
   */
  endSession(sessionKey: string): void {
    localStorage.removeItem(`session_${sessionKey}`);
    
    // チェックインターバルをクリア
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * セッション期限切れ時のコールバックを登録
   */
  onSessionExpire(callback: () => void): void {
    this.onExpireCallbacks.push(callback);
  }

  /**
   * セッションの状態をチェック（内部使用）
   */
  private checkSession(sessionKey: string): void {
    if (!this.isSessionValid(sessionKey)) {
      // セッションが期限切れの場合、コールバックを実行
      for (const callback of this.onExpireCallbacks) {
        callback();
      }
      
      // セッションを終了
      this.endSession(sessionKey);
    }
  }

  /**
   * すべてのセッションをクリア
   */
  clearAllSessions(): void {
    // session_で始まるすべてのキーを削除
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('session_')) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    
    // チェックインターバルをクリア
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const sessionManager = new SessionManager();

/**
 * セッション情報を含むトークンデータの型
 */
export interface TokenWithSession<T> {
  value: T;
  session: SessionInfo;
}

/**
 * セッション管理機能付きでトークンを保存
 */
export function saveTokenWithSession<T>(
  key: string,
  value: T,
  sessionDuration?: number
): void {
  const sessionKey = `${key}_session`;
  
  // セッションを開始
  sessionManager.startSession(sessionKey, sessionDuration);
  
  // セッション情報を取得
  const sessionResult = sessionManager.getSession(sessionKey);
  if (sessionResult.isOk()) {
    const tokenData: TokenWithSession<T> = {
      value,
      session: sessionResult.value
    };
    
    localStorage.setItem(key, JSON.stringify(tokenData));
  }
}

/**
 * セッション管理機能付きでトークンを取得
 */
export function getTokenWithSession<T>(key: string): Result<T, SessionError> {
  const sessionKey = `${key}_session`;
  
  // セッションの有効性をチェック
  if (!sessionManager.isSessionValid(sessionKey)) {
    // セッションが無効な場合、トークンも削除
    localStorage.removeItem(key);
    return err({
      type: 'expired',
      message: 'セッションの有効期限が切れています'
    });
  }
  
  // トークンデータを取得
  const tokenDataStr = localStorage.getItem(key);
  if (!tokenDataStr) {
    return err({
      type: 'invalid',
      message: 'トークンが存在しません'
    });
  }
  
  try {
    const tokenData = JSON.parse(tokenDataStr) as TokenWithSession<T>;
    
    // セッションを更新
    sessionManager.updateSession(sessionKey);
    
    return ok(tokenData.value);
  } catch {
    return err({
      type: 'invalid',
      message: 'トークンデータが破損しています'
    });
  }
}