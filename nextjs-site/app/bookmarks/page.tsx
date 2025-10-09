import { fetchNotionDatabase } from '@/lib/notion-direct'
import { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import BookmarksClient from './BookmarksClient'
import './bookmarks.css'

const BOOKMARKS_DB_ID = process.env.BOOKMARKS_DB_ID || '6fab1aca487d4d8c875e6625c5d01a0a'

export const metadata: Metadata = {
  title: 'Bookmarks - Ashish Thapa',
  description: 'Links that I found really interesting',
}

export const revalidate = 18000

type BookmarkEntry = {
  Title: string
  id: string
  URL: string
  Description: string
  Tags: Array<string>
}

export default async function BookmarksPage() {
  let bookmarks: BookmarkEntry[] = []
  let error: string | null = null

  try {
    bookmarks = await fetchNotionDatabase(BOOKMARKS_DB_ID) as BookmarkEntry[]
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load bookmarks data'
    console.error('Bookmarks fetch error:', e)
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

        <h1 style={{ marginBottom: '10px' }}>Bookmarks</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Links that I found really interesting</p>

        {error && (
          <div style={{ padding: '20px', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', borderRadius: '5px', marginBottom: '20px' }}>
            <p>⚠️ Unable to load bookmarks. The Notion API may be temporarily unavailable.</p>
            <p style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        )}

        {bookmarks.length === 0 && !error && (
          <p>Loading bookmarks...</p>
        )}

        {bookmarks.length > 0 && <BookmarksClient bookmarks={bookmarks} />}
      </main>
    </>
  )
}
