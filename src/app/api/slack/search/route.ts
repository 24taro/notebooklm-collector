import { NextResponse } from 'next/server'

const SLACK_API_BASE_URL = 'https://slack.com/api'

/**
 * Slack API search.messagesへのプロキシAPI
 * ブラウザからのCORSを回避するために使用
 */
export async function GET(request: Request) {
  // URLからクエリパラメータを取得
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const query = searchParams.get('query')
  const count = searchParams.get('count') || '20'
  const page = searchParams.get('page') || '1'

  // トークンとクエリが存在するか確認
  if (!token || !query) {
    return NextResponse.json({ error: 'トークンと検索クエリは必須です' }, { status: 400 })
  }

  // Slack APIに必要なパラメータを準備
  const apiParams = new URLSearchParams({
    query,
    count,
    page,
  })

  try {
    // サーバー側からSlack APIにリクエスト
    const response = await fetch(`${SLACK_API_BASE_URL}/search.messages?${apiParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    // Slack APIからのレスポンスを取得
    const data = await response.json()

    // Slack APIからのレスポンスをそのままクライアントに返す
    return NextResponse.json(data)
  } catch (error) {
    console.error('Slack API proxy error:', error)
    return NextResponse.json({ ok: false, error: 'APIリクエスト中にエラーが発生しました' }, { status: 500 })
  }
}
