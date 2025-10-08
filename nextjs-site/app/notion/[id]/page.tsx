import { fetchNotionPage } from '@/lib/notion-direct'
import { Metadata } from 'next'
import Link from 'next/link'
import NotionPageClient from './NotionPageClient'
import fs from 'fs'
import path from 'path'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Notion Page - Ashish Thapa`,
    description: 'Content from Notion',
  }
}

export async function generateStaticParams() {
  try {
    const jsonPath = path.join(process.cwd(), 'notion-pages.json')

    if (!fs.existsSync(jsonPath)) {
      console.warn('notion-pages.json not found. Run: node scripts/crawl-notion.js')
      return [{ id: 'placeholder' }]
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const pages = data.pages || []

    console.log(`Generating static params for ${pages.length} Notion pages`)

    if (pages.length === 0) {
      return [{ id: 'placeholder' }]
    }

    return pages.map((id: string) => ({
      id: id,
    }))
  } catch (error) {
    console.error('Error reading notion-pages.json:', error)
    return [{ id: 'placeholder' }]
  }
}

export default async function NotionPage({ params }: Props) {
  const { id } = await params
  let pageData: any = null
  let error: string | null = null

  try {
    pageData = await fetchNotionPage(id)
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load Notion page'
    console.error('Notion page fetch error:', e)
  }

  return (
    <>
      <main style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '20px' }}>
          <Link href="/timeline" style={{ color: '#0066cc', fontSize: '16px' }}>
            ← Back to Timeline
          </Link>
        </nav>

        {error && (
          <div style={{ padding: '20px', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', borderRadius: '5px', marginBottom: '20px' }}>
            <p>⚠️ Unable to load Notion page. The Notion API may be temporarily unavailable.</p>
            <p style={{ fontSize: '0.9em', color: '#888' }}>{error}</p>
          </div>
        )}

        {pageData && <NotionPageClient blocks={pageData.blocks} />}

        {!pageData && !error && <p>Loading...</p>}
      </main>
    </>
  )
}
