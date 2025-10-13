import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Finance - Ashish Thapa',
  description: 'Finance tracking dashboard',
}

export default function FinancePage() {
  redirect('/metrics/finance/dashboard')
}
