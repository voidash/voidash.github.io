import { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import DailyLogClient from './DailyLogClient'

export const metadata: Metadata = {
  title: 'Daily Log - Ashish Thapa',
  description: 'Log daily progress across all life dimensions',
}

export default function DailyLogPage() {
  return (
    <>
      <ThemeToggle />
      <DailyLogClient />
    </>
  )
}
