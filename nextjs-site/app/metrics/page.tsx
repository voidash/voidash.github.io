import { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import MetricsPageClient from './MetricsPageClient'
import './metrics.css'

export const metadata: Metadata = {
  title: 'Life Metrics - Ashish Thapa',
  description: 'Weekly life metrics tracking across 6 key dimensions',
}

export default function MetricsPage() {
  return (
    <>
      <ThemeToggle />
      <MetricsPageClient />
    </>
  )
}
