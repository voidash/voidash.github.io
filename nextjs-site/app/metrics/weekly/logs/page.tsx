import { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import WeeklyLogsViewClient from './WeeklyLogsViewClient'

export const metadata: Metadata = {
  title: 'Weekly Logs - Ashish Thapa',
  description: 'View all weekly log entries',
}

export default function WeeklyLogsPage() {
  return (
    <>
      <ThemeToggle />
      <WeeklyLogsViewClient />
    </>
  )
}
