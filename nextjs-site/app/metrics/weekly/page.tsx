import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Weekly Log - Ashish Thapa',
  description: 'Set up weekly parameters and targets',
}

export default function WeeklyLogPage() {
  redirect('/metrics/weekly/add')
}
