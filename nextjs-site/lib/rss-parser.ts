/**
 * RSS Feed Parser for Blog Posts
 * Fetches and parses RSS feed from blog
 */

export type BlogPost = {
  title: string
  link: string
  pubDate: string
  description: string
}

/**
 * Parse RSS XML feed to extract blog posts
 */
export async function fetchRecentBlogPosts(limit: number = 5): Promise<BlogPost[]> {
  try {
    const response = await fetch('https://thapa-ashish.com.np/blog/index.xml', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`)
    }

    const xmlText = await response.text()

    // Parse XML manually (simple parsing without external libs)
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || []

    const posts: BlogPost[] = items.slice(0, limit).map((item) => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                   item.match(/<title>(.*?)<\/title>/)?.[1] ||
                   'Untitled'

      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '#'

      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

      const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                         item.match(/<description>(.*?)<\/description>/)?.[1] ||
                         ''

      return {
        title: title.trim(),
        link: link.trim(),
        pubDate: pubDate.trim(),
        description: stripHtml(description.trim()),
      }
    })

    return posts
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

/**
 * Strip HTML tags and decode entities from string
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&[a-z]+;/gi, '') // Remove any remaining unknown entities
    .trim()
}

/**
 * Format date string to readable format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}
