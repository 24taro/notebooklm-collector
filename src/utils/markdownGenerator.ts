import type { DocbasePostListItem } from '../types/docbase'

/**
 * Docbaseの投稿リストからLLM最適化Markdown文字列を生成する関数
 * NotebookLM等のLLMによる構造理解を最適化した形式で出力
 * @param posts DocbasePostListItemの配列
 * @param searchKeyword 検索キーワード（メタデータとして記録）
 * @returns LLM最適化Markdown文字列
 */
export const generateMarkdown = (posts: DocbasePostListItem[], searchKeyword?: string): string => {
  if (!posts || posts.length === 0) {
    return '' // 投稿がない場合は空文字列を返す
  }

  // 全体のメタデータ作成
  const dates = posts.map(post => new Date(post.created_at))
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
  
  // YAML Front Matter形式で全体メタデータ
  let markdown = '---\n'
  markdown += `source: "docbase"\n`
  markdown += `total_articles: ${posts.length}\n`
  if (searchKeyword) {
    markdown += `search_keyword: "${searchKeyword}"\n`
  }
  markdown += `date_range: "${minDate.toISOString().split('T')[0]} - ${maxDate.toISOString().split('T')[0]}"\n`
  markdown += `generated_at: "${new Date().toISOString()}"\n`
  markdown += '---\n\n'

  // LLM理解しやすいタイトル
  const dateRange = minDate.toLocaleDateString('ja-JP') === maxDate.toLocaleDateString('ja-JP')
    ? minDate.toLocaleDateString('ja-JP')
    : `${minDate.toLocaleDateString('ja-JP')} - ${maxDate.toLocaleDateString('ja-JP')}`
  
  markdown += '# Docbase Articles Collection\n\n'
  
  markdown += '## Collection Overview\n'
  markdown += `- **Total Articles**: ${posts.length}\n`
  if (searchKeyword) {
    markdown += `- **Search Keyword**: "${searchKeyword}"\n`
  }
  markdown += `- **Date Range**: ${dateRange}\n`
  markdown += '- **Source**: Docbase Knowledge Base\n\n'

  // 目次
  markdown += '## Articles Index\n\n'
  posts.forEach((post, index) => {
    const date = new Date(post.created_at)
    const formattedDate = date.toLocaleDateString('ja-JP')
    markdown += `${index + 1}. [${post.title}](#article-${index + 1}) - ${formattedDate}\n`
  })
  markdown += '\n---\n\n'

  // 各記事の詳細
  markdown += '## Articles Content\n\n'
  
  return markdown + posts
    .map((post, index) => {
      // 日付フォーマット
      const date = new Date(post.created_at)
      const isoDate = date.toISOString()
      const displayDate = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      })

      // 記事のYAML Front Matter
      let articleMd = `### Article ${index + 1}\n\n`
      articleMd += '```yaml\n'
      articleMd += `docbase_id: ${post.id}\n`
      articleMd += `title: "${post.title}"\n`
      articleMd += `created_at: "${isoDate}"\n`
      articleMd += `url: "${post.url}"\n`
      articleMd += '```\n\n'

      // LLM理解しやすい構造
      articleMd += `# ${post.title}\n\n`
      
      articleMd += '## Document Information\n'
      articleMd += `- **Created**: ${displayDate}\n`
      articleMd += `- **Source**: [Docbase Article](${post.url})\n`
      articleMd += `- **Document ID**: ${post.id}\n\n`

      articleMd += '## Content\n\n'
      
      // 本文をそのまま記載（二重エンコード回避）
      articleMd += `${post.body}\n\n`

      return articleMd
    })
    .join('---\n\n') // 各記事の間を水平線で区切る
}
