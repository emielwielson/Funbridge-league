import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from '@/lib/contexts/UserContext'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'Online Bridge League Scoring Tool',
  description: 'Manage your bridge league scores and rankings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <Navbar />
          <main>{children}</main>
        </UserProvider>
      </body>
    </html>
  )
}

