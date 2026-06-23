import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'TicketFlow — Book seats for the events you love',
  description:
    'Fast, secure, real-time event ticket booking. Reserve your seats with TicketFlow.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${geistMono.variable}`}
    >
      <body className="bg-background font-sans antialiased">
        <TooltipProvider delay={150}>{children}</TooltipProvider>
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  )
}
