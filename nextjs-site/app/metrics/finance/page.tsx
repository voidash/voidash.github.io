import { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import FinanceLogClient from './FinanceLogClient'

export const metadata: Metadata = {
  title: 'Finance Log - Ashish Thapa',
  description: 'Track daily spending',
}

export default function FinanceLogPage() {
  return (
    <>
      <ThemeToggle />
      <FinanceLogClient />
    </>
  )
}
