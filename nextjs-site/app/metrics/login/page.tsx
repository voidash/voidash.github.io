import { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Login - Metrics',
  description: 'Login to access metrics tracking',
}

export default function LoginPage() {
  return <LoginClient />
}
