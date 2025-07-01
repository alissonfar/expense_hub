import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/lib/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Personal Expense Hub',
    template: '%s | Personal Expense Hub'
  },
  description: 'Sistema inteligente de gestão financeira pessoal multi-tenant com colaboração em tempo real',
  keywords: [
    'gestão financeira',
    'controle de gastos', 
    'finanças pessoais',
    'multi-tenant',
    'colaborativo',
    'expense tracking',
    'personal finance'
  ],
  authors: [
    {
      name: 'Personal Expense Hub Team',
      url: 'https://expensehub.com',
    },
  ],
  creator: 'Personal Expense Hub',
  metadataBase: new URL('https://expensehub.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://expensehub.com',
    title: 'Personal Expense Hub',
    description: 'Sistema inteligente de gestão financeira pessoal multi-tenant',
    siteName: 'Personal Expense Hub',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Personal Expense Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Personal Expense Hub',
    description: 'Sistema inteligente de gestão financeira pessoal multi-tenant',
    images: ['/og-image.png'],
    creator: '@expensehub',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#2563eb',
      },
    ],
  },
  verification: {
    google: 'google-verification-code',
    yandex: 'yandex-verification-code',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  colorScheme: 'light dark',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="pt-BR" 
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body 
        className={`
          min-h-screen bg-background font-sans antialiased
          selection:bg-primary/20 selection:text-primary-foreground
          scrollbar-thin scrollbar-track-secondary scrollbar-thumb-border
          custom-scrollbar
        `}
      >
        <Providers>
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
            
            <div 
              className="absolute inset-0 opacity-40 dark:opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px'
              }}
            />
            
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl dark:bg-primary/5" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl dark:bg-accent/5" />
          </div>

          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 left-4 z-50 hidden lg:block">
              <div className="rounded-lg bg-muted/80 px-3 py-2 text-xs font-mono text-muted-foreground backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Dev Mode
                </div>
              </div>
            </div>
          )}
        </Providers>
      </body>
    </html>
  )
} 