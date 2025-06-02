/**
 * Slackページのヒーロー・説明セクションコンポーネント
 * - ヒーローセクション（タイトル・説明）
 * - 使い方説明（3ステップ）
 * - セキュリティ説明
 */

'use client'

export function SlackHeroSection() {
  return (
    <>
      {/* ヒーローセクション */}
      <section className="w-full text-center my-32">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-800 leading-tight">
            Slackの会話を、
            <br />
            NotebookLMへ簡単連携
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
            キーワードや期間でSlackメッセージを検索し、NotebookLM用のMarkdownファイルをすぐに生成できます。
          </p>
        </div>
      </section>

      {/* 使い方説明セクション */}
      <section className="w-full mt-12">
        <div className="max-w-screen-lg mx-auto px-6 sm:px-10 lg:px-24 py-16 rounded-xl border border-gray-200 bg-background-light">
          <h2 className="text-3xl md:text-4xl font-bold mb-20 text-center text-gray-800">利用はかんたん3ステップ</h2>
          <div className="grid md:grid-cols-3 gap-x-8 gap-y-10 relative">
            {[
              {
                step: '1',
                title: '情報を入力',
                description: 'Slackトークン、検索キーワード、期間などを入力します。トークンは保存可能です。',
                icon: '⌨️',
              },
              {
                step: '2',
                title: '検索して生成',
                description:
                  '「検索実行」ボタンでSlackからメッセージを取得し、NotebookLM用Markdownをプレビューします。',
                icon: '🔍',
              },
              {
                step: '3',
                title: 'ダウンロード',
                description: '生成されたMarkdownを「ダウンロード」ボタンで保存。すぐにAIに学習させられます。',
                icon: '💾',
              },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-4">
                  <span className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white text-xl font-bold rounded-full mr-4">
                    {item.step}
                  </span>
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* セキュリティ説明セクション */}
      <section className="w-full mt-12">
        <div className="max-w-screen-lg mx-auto px-6 sm:px-10 lg:px-24 py-16 rounded-xl border border-gray-200 bg-background-light">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">🔒 セキュリティについて</h2>
            <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
              入力されたSlack APIトークンや取得したメッセージ内容は、お使いのブラウザ内でのみ処理されます。
              これらの情報が外部サーバーに送信されたり、保存されたりすることは一切ありませんので、安心してご利用いただけます。
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
