"use client";

import React from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Docbaseアクセストークン入力コンポーネント
 * @param value 入力値
 * @param onChange 入力値変更ハンドラ
 */
const DocbaseTokenInput: React.FC<Props> = ({ value, onChange }) => {
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
      />
    </div>
  );
};

export default DocbaseTokenInput;
