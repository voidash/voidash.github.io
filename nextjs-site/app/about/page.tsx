import { NotionRenderer } from 'react-notion'
import { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import fs from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'About Me - Ashish Thapa',
  description: 'Learn more about Ashish Thapa',
}

function loadAboutData() {
  const filePath = path.join(process.cwd(), 'data', 'about-notion.json')
  if (!fs.existsSync(filePath)) {
    throw new Error('about-notion.json not found. Run: node scripts/prefetch-about.js')
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  if (Object.keys(data).length === 0) {
    throw new Error('about-notion.json is empty')
  }
  return data
}

export default async function AboutPage() {
  let notionData: Record<string, any> | null = null
  let error: string | null = null

  try {
    notionData = loadAboutData()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load About page data'
    console.error('About page data error:', e)
  }

  return (
    <>
      <ThemeToggle />
      <main style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '20px' }}>
          <Link href="/" style={{ color: '#0066cc', fontSize: '16px' }}>
            ← Back to Home
          </Link>
        </nav>

        <article>
          <h1 style={{ marginBottom: '20px' }}>About Me</h1>
          {error && (
            <p style={{ color: 'red' }}>Failed to load content: {error}</p>
          )}
          {notionData && <NotionRenderer blockMap={notionData} />}
        </article>
      </main>
    </>
  )
}
