import { AuthProvider } from '@/lib/hooks/use-auth'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TrueSharp - Verified Sports Betting Platform',
  description: 'Track your real betting performance with automatic sportsbook sync. Turn your expertise into income by selling picks to subscribers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}