import { Metadata } from 'next'
import { Suspense } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import DailyLogAddClient from './DailyLogAddClient'

export const metadata: Metadata = {
  title: 'Add Daily Log - Ashish Thapa',
  description: 'Log daily progress across all life dimensions',
}

export default function DailyLogAddPage() {
  return (
    <>
      <ThemeToggle />
      <Suspense fallback={<div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>Loading...</div>}>
        <DailyLogAddClient />
      </Suspense>
    </>
  )
}
