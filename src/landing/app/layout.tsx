import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TrueSharp - Verified Sports Betting Community',
  description: 'Join the most trusted platform for sports betting analytics and strategy sharing. Seamlessly sync bets, track performance, monetize strategies, and subscribe to proven bettors.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}