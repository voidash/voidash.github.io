import { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import LearningReviewClient from './LearningReviewClient'

export const metadata: Metadata = {
  title: 'Review Learning Items - Ashish Thapa',
  description: 'Review your learning items with spaced repetition',
}

export default function LearningReviewPage() {
  return (
    <>
      <ThemeToggle />
      <LearningReviewClient />
    </>
  )
}
