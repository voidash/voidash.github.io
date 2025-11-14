import { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import LearningDashboardClient from './LearningDashboardClient'

export const metadata: Metadata = {
  title: 'Learning Dashboard - Ashish Thapa',
  description: 'View all learning items and statistics',
}

export default function LearningDashboardPage() {
  return (
    <>
      <ThemeToggle />
      <LearningDashboardClient />
    </>
  )
}
