import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import Layout from '@/components/Layout'
import { Providers } from './providers'
import PWAInstall from '@/components/PWAInstall'
import UnloadCleanup from '@/components/UnloadCleanup'
import ProductionConsoleSilencer from '@/components/ProductionConsoleSilencer'
import { ThemeProvider } from '@/components/ThemeProvider'
import FirstTimeNotice from '@/components/FirstTimeNotice'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Payroll Management System',
  description: 'Advanced payroll management system for modern businesses',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="icon" href="/favicon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Payroll System" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-900">
        <ThemeProvider>
          <FirstTimeNotice />
          <ProductionConsoleSilencer />
          <UnloadCleanup />
          <PWAInstall />
          <Toaster position="bottom-center" />
          <Providers>
            <Layout>
              {children}
            </Layout>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}





















