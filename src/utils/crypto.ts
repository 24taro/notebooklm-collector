/**
 * 暗号化ユーティリティ
 * Web Crypto APIを使用してAPIトークンを安全に暗号化・復号化する
 * 
 * 仕様:
 * - アルゴリズム: AES-GCM (256ビット)
 * - 鍵導出: PBKDF2 (100,000回の反復)
 * - エンコーディング: Base64
 * - 初期化ベクトル: 12バイトのランダム値
 * - 認証タグ: 128ビット
 */

import { err, ok, Result } from 'neverthrow';

export type CryptoError =
  | { type: 'unsupported'; message: string }
  | { type: 'invalidKey'; message: string }
  | { type: 'encryptionFailed'; message: string }
  | { type: 'decryptionFailed'; message: string }
  | { type: 'invalidData'; message: string };

// 暗号化パラメータ
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96ビット (GCM推奨)
const SALT_LENGTH = 16; // 128ビット
const PBKDF2_ITERATIONS = 100000;
const TAG_LENGTH = 128; // 認証タグの長さ（ビット）

// 暗号化されたデータの構造
interface EncryptedData {
  iv: string; // Base64エンコードされた初期化ベクトル
  salt: string; // Base64エンコードされたソルト
  data: string; // Base64エンコードされた暗号化データ
}

/**
 * Web Crypto APIがサポートされているかチェック
 */
export function isCryptoSupported(): boolean {
  return typeof globalThis !== 'undefined' && 
         globalThis.crypto !== undefined &&
         globalThis.crypto.subtle !== undefined;
}

/**
 * パスワードから暗号化キーを導出
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<Result<CryptoKey, CryptoError>> {
  try {
    // パスワードをCryptoKeyに変換
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // PBKDF2で鍵を導出
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );

    return ok(derivedKey);
  } catch (error) {
    return err({
      type: 'invalidKey',
      message: error instanceof Error ? error.message : '鍵の導出に失敗しました'
    });
  }
}

/**
 * ランダムなバイト列を生成
 */
function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Uint8ArrayをBase64文字列に変換
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer));
}

/**
 * Base64文字列をUint8Arrayに変換
 */
function base64ToArrayBuffer(base64: string): Result<Uint8Array, CryptoError> {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return ok(bytes);
  } catch (error) {
    return err({
      type: 'invalidData',
      message: '無効なBase64データです'
    });
  }
}

/**
 * 文字列データを暗号化
 * @param data 暗号化するデータ
 * @param password 暗号化に使用するパスワード
 * @returns 暗号化されたデータ（Base64形式）
 */
export async function encrypt(
  data: string,
  password: string
): Promise<Result<string, CryptoError>> {
  if (!isCryptoSupported()) {
    return err({
      type: 'unsupported',
      message: 'Web Crypto APIがサポートされていません'
    });
  }

  try {
    // ランダムなソルトとIVを生成
    const salt = generateRandomBytes(SALT_LENGTH);
    const iv = generateRandomBytes(IV_LENGTH);

    // パスワードから鍵を導出
    const keyResult = await deriveKey(password, salt);
    if (keyResult.isErr()) {
      return err(keyResult.error);
    }

    // データを暗号化
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH
      },
      keyResult.value,
      encodedData
    );

    // 暗号化されたデータをJSONとしてエンコード
    const encryptedObject: EncryptedData = {
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt),
      data: arrayBufferToBase64(new Uint8Array(encryptedData))
    };

    return ok(JSON.stringify(encryptedObject));
  } catch (error) {
    return err({
      type: 'encryptionFailed',
      message: error instanceof Error ? error.message : '暗号化に失敗しました'
    });
  }
}

/**
 * 暗号化されたデータを復号化
 * @param encryptedData 暗号化されたデータ（Base64形式）
 * @param password 復号化に使用するパスワード
 * @returns 復号化されたデータ
 */
export async function decrypt(
  encryptedData: string,
  password: string
): Promise<Result<string, CryptoError>> {
  if (!isCryptoSupported()) {
    return err({
      type: 'unsupported',
      message: 'Web Crypto APIがサポートされていません'
    });
  }

  try {
    // 暗号化されたデータをパース
    let encryptedObject: EncryptedData;
    try {
      encryptedObject = JSON.parse(encryptedData);
    } catch {
      return err({
        type: 'invalidData',
        message: '暗号化データの形式が無効です'
      });
    }

    // Base64からバイト列に変換
    const ivResult = base64ToArrayBuffer(encryptedObject.iv);
    const saltResult = base64ToArrayBuffer(encryptedObject.salt);
    const dataResult = base64ToArrayBuffer(encryptedObject.data);

    if (ivResult.isErr()) return err(ivResult.error);
    if (saltResult.isErr()) return err(saltResult.error);
    if (dataResult.isErr()) return err(dataResult.error);

    // パスワードから鍵を導出
    const keyResult = await deriveKey(password, saltResult.value);
    if (keyResult.isErr()) {
      return err(keyResult.error);
    }

    // データを復号化
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: ivResult.value,
        tagLength: TAG_LENGTH
      },
      keyResult.value,
      dataResult.value
    );

    const decodedData = new TextDecoder().decode(decryptedData);
    return ok(decodedData);
  } catch (error) {
    return err({
      type: 'decryptionFailed',
      message: '復号化に失敗しました。パスワードが正しくないか、データが破損している可能性があります'
    });
  }
}

/**
 * ユーザー固有の暗号化パスワードを生成
 * ブラウザのフィンガープリントとユーザー提供のソルトを組み合わせる
 */
export function generateUserPassword(userSalt?: string): string {
  // ブラウザフィンガープリント要素を収集
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    // オプションのユーザーソルト
    userSalt || 'default-salt'
  ].join('|');

  // 簡易的なハッシュ（実際の実装ではより強力なハッシュ関数を使用）
  return btoa(fingerprint);
}