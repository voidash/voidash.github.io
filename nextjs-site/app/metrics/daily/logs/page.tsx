import { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import DailyLogsViewClient from './DailyLogsViewClient'

export const metadata: Metadata = {
  title: 'Daily Logs - Ashish Thapa',
  description: 'View all daily log entries',
}

export default function DailyLogsPage() {
  return (
    <>
      <ThemeToggle />
      <DailyLogsViewClient />
    </>
  )
}
