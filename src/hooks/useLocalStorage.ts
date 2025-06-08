import { useEffect, useState } from "react";

/**
 * localStorageと値を同期するためのカスタムフック
 * @param key localStorageのキー
 * @param initialValue 初期値
 * @returns [storedValue, setValue] storedValueは現在の値、setValueは値を更新する関数
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // localStorageから初期値を取得、なければinitialValueを使用
  const [storedValue, setStoredValue] = useState<T>(() => {
    // windowオブジェクトが存在するか確認 (SSR対策)
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        try {
          return JSON.parse(item) as T;
        } catch (parseError) {
          // パースに失敗した場合は警告を出し、初期値を返す
          console.warn(
            `Error parsing localStorage key "${key}" (value: "${item}"), falling back to initialValue:`,
            parseError
          );
          return initialValue;
        }
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // storedValueが変更されたらlocalStorageに保存
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      // windowオブジェクトが存在するか確認 (SSR対策)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // マウント時にlocalStorageの値でstateを更新する (別のタブでの変更に対応するため)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch (error) {
          console.warn(
            `Error parsing localStorage key "${key}" on storage event (newValue: "${event.newValue}"), falling back to current value or initialValue if parsing fails elsewhere:`,
            error
          );
          // ここでエラーが起きても、storedValueは以前の値のまま or 初期化時の値のまま
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // initialValueが変更された場合も考慮して、localStorageの値を再確認・初期化
    const currentLocalItem = window.localStorage.getItem(key);
    if (currentLocalItem === null) {
      // 文字列としての initialValue ではなく、JSON.stringifyされたものが保存されるべき
      window.localStorage.setItem(key, JSON.stringify(initialValue));
    } else {
      try {
        JSON.parse(currentLocalItem); // 既存の値が有効なJSONかチェック
      } catch (e) {
        // 既存の値が不正なJSONなら、initialValueで上書きする
        console.warn(
          `Invalid JSON in localStorage for key "${key}" (value: "${currentLocalItem}"), overwriting with initialValue.`
        );
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        setStoredValue(initialValue); // stateも更新
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue]); // initialValueを依存配列に追加

  return [storedValue, setValue];
}

export default useLocalStorage;
