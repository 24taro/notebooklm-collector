'use client' // 必要に応じて

import React from 'react'

const DocbaseHeader = () => {
  // 名前を DocbaseHeader に変更
  return (
    <header className="w-full py-6 shadow-md">
      <div className="max-w-screen-lg mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          {/* <img src="/docbase-collector-logo.svg" alt="Docbase Collector Logo" className="h-8 w-auto mr-3" /> */}
          <span className="text-2xl font-semibold text-gray-700">Docbase Collector</span>
        </div>
        {/* <a href="#" className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">ログイン(仮)</a> */}
      </div>
    </header>
  )
}

export default DocbaseHeader // export も DocbaseHeader に変更
