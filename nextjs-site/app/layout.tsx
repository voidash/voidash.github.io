import type { Metadata } from 'next'
import './globals.css'

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
        {children}
      </body>
    </html>
  )
}
