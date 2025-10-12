import SimpleHomePage from '@/components/SimpleHomePage'
import { fetchRecentBlogPosts } from '@/lib/rss-parser'
import { fetchNotionDatabase } from '@/lib/notion-direct'

const BOOKMARKS_DB_ID = process.env.BOOKMARKS_DB_ID || '6fab1aca487d4d8c875e6625c5d01a0a'

type BookmarkEntry = {
  Title: string
  id: string
  URL: string
  Description: string
  Tags: Array<string>
}

export default async function Home() {
  const recentPosts = await fetchRecentBlogPosts(5)

  let recentBookmarks: BookmarkEntry[] = []
  try {
    const allBookmarks = await fetchNotionDatabase(BOOKMARKS_DB_ID) as BookmarkEntry[]
    recentBookmarks = allBookmarks.slice(0, 5)
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error)
  }

  return <SimpleHomePage recentPosts={recentPosts} recentBookmarks={recentBookmarks} />
}
