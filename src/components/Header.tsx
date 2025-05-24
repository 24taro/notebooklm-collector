'use client' // 必要に応じて

// Reactの明示的なインポートは不要になる場合があるが、JSXを使うためにはスコープにReactが必要。
// ただし、Next.js 13以降のApp Routerや新しいJSX Transformでは不要なことも。
// 一旦残しておくが、もし不要ならリンターが教えてくれるはず。
import type React from 'react' // 'import type' に変更

interface HeaderProps {
  // インターフェース名を HeaderProps に
  title: string
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  // 型を HeaderProps に
  return (
    <header className="w-full py-6 shadow-md">
      {' '}
      {/* DocbaseHeader から shadow-md を持ってきたのだ */}
      <div className="max-w-screen-lg mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          {/* <img src="/docbase-collector-logo.svg" alt="Docbase Collector Logo" className="h-8 w-auto mr-3" /> */}
          <span className="text-2xl font-semibold text-gray-700">{title}</span>
        </div>
        {/* <a href="#" className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">ログイン(仮)</a> */}
      </div>
    </header>
  )
}

export default Header
