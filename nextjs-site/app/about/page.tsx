import { fetchNotionPage } from '@/lib/notion'
import { NotionRenderer } from 'react-notion'
import { Metadata } from 'next'
import Link from 'next/link'

// Page ID from your existing code: About-Me-3aec394784ab48dd90fbe44b948a7da9
const ABOUT_PAGE_ID = 'About-Me-3aec394784ab48dd90fbe44b948a7da9'

export const metadata: Metadata = {
  title: 'About Me - Ashish Thapa',
  description: 'Learn more about Ashish Thapa',
}

export const revalidate = 18000 // 5 hours

export default async function AboutPage() {
  const notionData = await fetchNotionPage(ABOUT_PAGE_ID)

  return (
    <>
      <main style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '20px' }}>
          <Link href="/" style={{ color: '#0066cc', fontSize: '16px' }}>
            ← Back to Home
          </Link>
        </nav>

        {/* Simple mode - always rendered for SEO */}
        <article>
          <h1 style={{ marginBottom: '20px' }}>About Me</h1>
          <NotionRenderer blockMap={notionData} />
        </article>
      </main>
    </>
  )
}
