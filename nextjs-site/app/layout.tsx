import type { Metadata } from 'next'
import './globals.css'
import { ModeProvider } from '@/components/ModeProvider'

export const metadata: Metadata = {
  title: 'Ashish Thapa',
  description: 'Personal portfolio showcasing work, thoughts, and projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ModeProvider>
          {children}
        </ModeProvider>
      </body>
    </html>
  )
}
