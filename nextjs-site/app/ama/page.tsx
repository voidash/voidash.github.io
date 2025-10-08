import { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import AMAClient from './AMAClient'

export const metadata: Metadata = {
  title: 'AMA - Ashish Thapa',
  description: 'Ask Me Anything',
}

export default function AMAPage() {
  return (
    <>
      <ThemeToggle />
      <main style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '20px' }}>
          <Link href="/" style={{ color: '#0066cc', fontSize: '16px' }}>
            ← Back to Home
          </Link>
        </nav>

        <h1 style={{ marginBottom: '20px' }}>Ask Me Anything</h1>
        <AMAClient />
      </main>
    </>
  )
}
