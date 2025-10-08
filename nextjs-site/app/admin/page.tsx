import { Metadata } from 'next'
import ModeToggle from '@/components/ModeToggle'
import Link from 'next/link'
import AdminClient from './AdminClient'

export const metadata: Metadata = {
  title: 'Admin - Ashish Thapa',
  description: 'Admin panel for managing AMA questions',
}

export default function AdminPage() {
  return (
    <>
      <ModeToggle />
      <main style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '20px' }}>
          <Link href="/" style={{ color: '#0066cc', fontSize: '16px' }}>
            ← Back to Home
          </Link>
        </nav>

        <h1 style={{ marginBottom: '20px' }}>Admin Panel</h1>
        <AdminClient />
      </main>
    </>
  )
}
