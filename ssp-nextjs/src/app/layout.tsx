import type { Metadata } from 'next'
import { Playfair_Display, Lato } from 'next/font/google'
import dynamic from 'next/dynamic'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { NotifyMeProvider } from '@/context/NotifyMeContext'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import CartToast from '@/components/CartToast'
import ScrollToTop from '@/components/ScrollToTop'
import BackendWarmup from '@/components/BackendWarmup'
import TakeawayNudge from '@/components/TakeawayNudge'
import AuthModalLoader from '@/components/AuthModalLoader'
import '@/styles/globals.css'

// Lazy-load cart drawer — only loads its JS when first rendered
const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false })

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
      <head>
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-KQ89WB49');` }} />
        {/* End Google Tag Manager */}
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KQ89WB49" height="0" width="0" style={{ display:'none', visibility:'hidden' }} /></noscript>
        {/* End Google Tag Manager (noscript) */}
          <AuthProvider>
            <CartProvider>
              <NotifyMeProvider>
              <ScrollToTop />
              <BackendWarmup />
              <TakeawayNudge />
              <Header />
              <CartDrawer />
              <AuthModalLoader />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <WhatsAppButton />
              <CartToast />
              </NotifyMeProvider>
            </CartProvider>
          </AuthProvider>
      </body>
    </html>
  )
}
