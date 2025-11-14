import { Metadata } from 'next'
import { Suspense } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import WeeklyLogAddClient from './WeeklyLogAddClient'

export const metadata: Metadata = {
  title: 'Add Weekly Log - Ashish Thapa',
  description: 'Set up weekly parameters and targets',
}

export default function WeeklyLogAddPage() {
  return (
    <>
      <ThemeToggle />
      <Suspense fallback={<div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>Loading...</div>}>
        <WeeklyLogAddClient />
      </Suspense>
    </>
  )
}
