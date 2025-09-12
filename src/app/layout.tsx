import { SharpSportsExtensionScript } from '@/components/sharpsports/extension-script'
import { ExtensionUpdateModal } from '@/components/sharpsports/extension-update-modal'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { SharpSportsExtensionProvider } from '@/lib/contexts/sharpsports-extension'
import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TrueSharp - Verified Sports Betting Platform',
  description:
    'Track your real betting performance with automatic sportsbook sync. Turn your expertise into income by selling picks to subscribers.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <SharpSportsExtensionProvider>
            <SharpSportsExtensionScript />
            {children}
            <ExtensionUpdateModal />
            <Analytics />
          </SharpSportsExtensionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
