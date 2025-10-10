import { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import WeeklyLogClient from './WeeklyLogClient'

export const metadata: Metadata = {
  title: 'Weekly Log - Ashish Thapa',
  description: 'Set up weekly parameters and targets',
}

export default function WeeklyLogPage() {
  return (
    <>
      <ThemeToggle />
      <WeeklyLogClient />
    </>
  )
}
