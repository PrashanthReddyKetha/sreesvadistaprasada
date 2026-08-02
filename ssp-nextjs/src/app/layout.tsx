import type { Metadata } from 'next'
import { Playfair_Display, Lato } from 'next/font/google'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import CartDrawer from '@/components/CartDrawer'
import AuthModal from '@/components/AuthModal'
import CartToast from '@/components/CartToast'
import ScrollToTop from '@/components/ScrollToTop'
import BackendWarmup from '@/components/BackendWarmup'
import '@/styles/globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
  display: 'swap',
})

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder'

export const metadata: Metadata = {
  title: {
    default: 'Indian Takeaway Milton Keynes | Authentic South Indian Food Delivery | Sree Svadista Prasada',
    template: '%s | Sree Svadista Prasada',
  },
  description: 'Indian takeaway Milton Keynes — authentic Andhra curries, dosas, biryanis & Dabba Wala tiffin subscriptions. Home-style South Indian food delivery. Order online.',
  keywords: ['Indian takeaway Milton Keynes', 'Indian food delivery Milton Keynes', 'South Indian restaurant Milton Keynes', 'best Indian restaurant MK', 'South Indian food Milton Keynes'],
  metadataBase: new URL('https://sreesvadistaprasada.com'),
  openGraph: {
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${playfair.variable} ${lato.variable}`}>
      <body className="min-h-screen flex flex-col">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <CartProvider>
              <ScrollToTop />
              <BackendWarmup />
              <Header />
              <CartDrawer />
              <AuthModal />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <WhatsAppButton />
              <CartToast />
            </CartProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
