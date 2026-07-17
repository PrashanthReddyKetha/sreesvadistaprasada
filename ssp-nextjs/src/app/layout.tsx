import type { Metadata } from 'next'
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
    <html lang="en-GB">
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
