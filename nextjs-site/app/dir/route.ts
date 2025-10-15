import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { fetchRecentBlogPosts } from '@/lib/rss-parser'
import { fetchNotionDatabase } from '@/lib/notion-direct'

export const dynamic = 'force-static'
export const revalidate = 3600 // 1 hour

const BOOKMARKS_DB_ID = process.env.BOOKMARKS_DB_ID || '6fab1aca487d4d8c875e6625c5d01a0a'

type BookmarkEntry = {
  Title: string
  id: string
  URL: string
  Description: string
  Tags: Array<string>
}

export async function GET(request: NextRequest) {
  try {
    // Fetch recent blog posts
    const recentPosts = await fetchRecentBlogPosts(3)

    // Fetch recent bookmarks
    let recentBookmarks: BookmarkEntry[] = []
    try {
      const allBookmarks = await fetchNotionDatabase(BOOKMARKS_DB_ID) as BookmarkEntry[]
      recentBookmarks = allBookmarks.slice(0, 3)
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
    }

    const data = {
      name: 'Ashish Thapa',
      email: 'ashish.thapa477@gmail.com',
      socials: {
        github: 'https://github.com/voidash',
        x: 'https://x.com/rifeash',
        digitalGarden: 'https://voidash.github.io/digitalgarden/'
      },
      recentBlogPosts: recentPosts.map(post => ({
        title: post.title,
        link: post.link,
        date: post.pubDate,
        description: post.description
      })),
      recentBookmarks: recentBookmarks.map(bookmark => ({
        title: bookmark.Title,
        url: bookmark.URL,
        description: bookmark.Description,
        tags: bookmark.Tags
      }))
    }

    // Check if JSON format is requested
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')

    // Return plain text format that's curl-friendly
    const plainText = `
Ashish Thapa
============

Email: ashish.thapa477@gmail.com

Socials:
  GitHub: https://github.com/voidash
  X/Twitter: https://x.com/rifeash
  Digital Garden: https://voidash.github.io/digitalgarden/

Recent Blog Posts:
${recentPosts.map((post, i) => `  ${i + 1}. ${post.title}
     ${post.link}`).join('\n\n')}

Recent Bookmarks:
${recentBookmarks.map((bookmark, i) => `  ${i + 1}. ${bookmark.Title}
     ${bookmark.URL}`).join('\n\n')}

---
For JSON format, add ?format=json
`.trim()

    if (format === 'json') {
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      })
    }

    return new NextResponse(plainText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    console.error('Error in /dir route:', error)
    return new NextResponse('Error fetching directory information', { status: 500 })
  }
}
