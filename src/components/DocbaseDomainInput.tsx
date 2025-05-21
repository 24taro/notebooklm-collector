"use client";

import React from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Docbaseドメイン入力コンポーネント
 * @param value 入力値
 * @param onChange 入力値変更ハンドラ
 */
// React.FC<Props> を削除し、propsに直接型注釈
const DocbaseDomainInput = ({ value, onChange }: Props) => {
  return (
    <div>
      <label htmlFor="docbase-domain">Docbase Domain:</label>
      <input
        id="docbase-domain"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="example"
        className="border p-2 rounded"
      />
    </div>
  );
};

export default DocbaseDomainInput;
