import { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import TodoViewClient from './TodoViewClient'

export const metadata: Metadata = {
  title: 'Todo Backlog - Ashish Thapa',
  description: 'View todos from daily logs',
}

export default function TodoPage() {
  return (
    <>
      <ThemeToggle />
      <TodoViewClient />
    </>
  )
}
