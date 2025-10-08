import { Client } from '@notionhq/client'
import { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import './books.css'

const BOOKS_PAGE_ID = process.env.BOOKS_DB_ID || 'ce0fa1f0d55b4d1f9e993ca6520455b4'

export const metadata: Metadata = {
  title: 'Books I Read - Ashish Thapa',
  description: 'Books that shaped my thinking',
}

export const revalidate = 18000

type BookEntry = {
  title: string
  id: string
}

async function fetchBookPages() {
  if (!process.env.NOTION_TOKEN) {
    throw new Error('NOTION_TOKEN not configured')
  }

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  })

  const response = await notion.blocks.children.list({
    block_id: BOOKS_PAGE_ID,
    page_size: 100,
  })

  return response.results
    .filter((block: any) => block.type === 'child_page')
    .map((block: any) => ({
      id: block.id,
      title: block.child_page.title,
    }))
}

export default async function BooksPage() {
  let books: BookEntry[] = []
  let error: string | null = null

  try {
    books = await fetchBookPages()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load books data'
    console.error('Books fetch error:', e)
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

        <h1 style={{ marginBottom: '10px' }}>Books I Read</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Books that shaped my thinking</p>

        {error && (
          <div style={{ padding: '20px', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', borderRadius: '5px', marginBottom: '20px' }}>
            <p>⚠️ Unable to load books. The Notion API may be temporarily unavailable.</p>
            <p style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        )}

        {books.length === 0 && !error && (
          <p>Loading books...</p>
        )}

        <div className="books-list">
          {books.map((book) => (
            <div key={book.id} className="book-item">
              <Link href={`/notion/${book.id}`} className="book-link">
                <div className="book-title">{book.title}</div>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
