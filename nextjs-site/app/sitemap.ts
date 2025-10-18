import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ash9.dev'

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/timeline',
    '/bookmarks',
    '/books',
    '/ask',
    '/metrics',
    '/spa',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic Notion pages
  let notionPages: MetadataRoute.Sitemap = []
  try {
    const notionPagesPath = path.join(process.cwd(), 'notion-pages.json')
    if (fs.existsSync(notionPagesPath)) {
      const data = JSON.parse(fs.readFileSync(notionPagesPath, 'utf-8'))
      const pages = data.pages || data // Handle both { pages: [] } and [] formats
      notionPages = pages.map((pageId: string) => ({
        url: `${baseUrl}/notion/${pageId}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Error reading notion-pages.json for sitemap:', error)
  }

  return [...staticRoutes, ...notionPages]
}
