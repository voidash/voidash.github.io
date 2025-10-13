import { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import FinanceDashboardClient from './FinanceDashboardClient'

export const metadata: Metadata = {
  title: 'Finance Dashboard - Ashish Thapa',
  description: 'Track and manage finances with tables and charts',
}

export default function FinanceDashboardPage() {
  return (
    <>
      <ThemeToggle />
      <FinanceDashboardClient />
    </>
  )
}
