import SimpleHomePage from '@/components/SimpleHomePage'
import { fetchRecentBlogPosts } from '@/lib/rss-parser'

export default async function Home() {
  const recentPosts = await fetchRecentBlogPosts(5)

  return <SimpleHomePage recentPosts={recentPosts} />
}
