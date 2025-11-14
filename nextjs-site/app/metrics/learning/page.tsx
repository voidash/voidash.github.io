import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Learning - Spaced Repetition',
  description: 'Review your learning items with spaced repetition',
}

export default function LearningPage() {
  redirect('/metrics/learning/review')
}
