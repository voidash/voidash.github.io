import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Daily Log - Ashish Thapa',
  description: 'Log daily progress across all life dimensions',
}

export default function DailyLogPage() {
  redirect('/metrics/daily/add')
}
