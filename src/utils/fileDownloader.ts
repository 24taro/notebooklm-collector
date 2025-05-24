/**
 * Markdown文字列をファイルとしてダウンロードする関数
 *
 * @param markdownContent ダウンロードするMarkdown文字列
 * @param keyword ファイル名に使用するキーワード
 * @param_posts 投稿があったかどうか
 */
export const downloadMarkdownFile = (
  markdownContent: string,
  keyword: string,
  postsExist: boolean, // 投稿が存在するかどうかを示すフラグを追加
): { success: boolean; message?: string } => {
  // 投稿が存在しない、またはMarkdownコンテントが空の場合はダウンロードしない
  if (!postsExist || !markdownContent.trim()) {
    // ユーザーに通知するかどうかは呼び出し側で判断するため、ここでは特別なメッセージは返さない
    return {
      success: false,
      message: 'ダウンロードするコンテンツがありません。',
    }
  }

  try {
    const blob = new Blob([markdownContent], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    // 日本のタイムゾーンでYYYYMMDDHHmmss形式のタイムスタンプを生成
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`

    // キーワードが空の場合はデフォルトのファイル名の一部とする
    const keywordPart = keyword.trim() || 'docbase'

    a.download = `notebooklm_${keywordPart}_${timestamp}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return { success: true }
  } catch (error) {
    console.error('Markdown file download error:', error)
    return {
      success: false,
      message: 'ファイルのダウンロード中にエラーが発生しました。',
    }
  }
}
