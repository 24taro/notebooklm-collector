"use client";

import React, { forwardRef } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Docbaseアクセストークン入力コンポーネント
 * @param value 入力値
 * @param onChange 入力値変更ハンドラ
 */
const DocbaseTokenInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange }, ref) => {
    return (
      <div>
        <label htmlFor="docbase-token">Docbase Token:</label>
        <input
          id="docbase-token"
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your API Token"
          className="border p-2 rounded"
          ref={ref}
        />
      </div>
    );
  }
);

DocbaseTokenInput.displayName = "DocbaseTokenInput";

export default DocbaseTokenInput;
