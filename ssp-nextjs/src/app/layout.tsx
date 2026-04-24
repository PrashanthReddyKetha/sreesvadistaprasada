import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { BUSINESS } from '@/lib/business'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

/* Site-wide default metadata */
export const metadata: Metadata = {
  metadataBase: new URL(BUSINESS.website),
  title: {
    default: 'Sree Svadista Prasada | South Indian Takeaway Milton Keynes',
    template: '%s | Sree Svadista Prasada',
  },
  description:
    'Authentic South Indian takeaway in Greenleys, Milton Keynes. Order dosas, idlis, biryani & curries online for delivery or collection. Try our Dabba Wala weekly meal subscription. Serving MK12, Wolverton & surrounding areas.',
  keywords: [
    'South Indian takeaway Milton Keynes',
    'Indian food delivery Greenleys',
    'South Indian restaurant Milton Keynes',
    'dosa Milton Keynes',
    'biryani delivery Milton Keynes',
    'Andhra food MK',
    'Telugu food Milton Keynes',
    'Indian meal subscription Milton Keynes',
  ],
  authors: [{ name: BUSINESS.name }],
  creator: BUSINESS.name,
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: BUSINESS.website,
    siteName: BUSINESS.name,
    title: 'Sree Svadista Prasada | Authentic South Indian, Milton Keynes',
    description: 'Soul-warming Andhra & Telugu home cooking delivered across Greenleys, Wolverton & Milton Keynes.',
    images: [{
      url: '/images/og-default.jpg',
      width: 1200,
      height: 630,
      alt: 'Sree Svadista Prasada — South Indian food Milton Keynes',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sree Svadista Prasada | South Indian Takeaway MK',
    description: 'Authentic Andhra & Telugu home cooking delivered in Milton Keynes.',
    images: ['/images/og-default.jpg'],
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
  alternates: { canonical: BUSINESS.website },
}

/* Restaurant JSON-LD — renders on every page */
const restaurantSchema = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: BUSINESS.name,
  description: 'Milton Keynes authentic South Indian kitchen from Andhra and Telugu traditions.',
  url: BUSINESS.website,
  telephone: BUSINESS.phoneIntl,
  servesCuisine: [...BUSINESS.cuisine],
  priceRange: '££',
  hasMenu: `${BUSINESS.website}/menu`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.address.street,
    addressLocality: BUSINESS.address.area,
    addressRegion: BUSINESS.address.city,
    postalCode: BUSINESS.address.postcode,
    addressCountry: BUSINESS.address.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: BUSINESS.geo.lat,
    longitude: BUSINESS.geo.lng,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '07:00',
      closes: '23:00',
    },
  ],
  potentialAction: {
    '@type': 'OrderAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BUSINESS.orderingApp}`,
      inLanguage: 'en-GB',
      actionPlatform: [
        'http://schema.org/DesktopWebPlatform',
        'http://schema.org/MobileWebPlatform',
      ],
    },
    deliveryMethod: [
      'http://purl.org/goodrelations/v1#DeliveryModePickUp',
      'http://purl.org/goodrelations/v1#DeliveryModeOwnFleet',
    ],
  },
  areaServed: BUSINESS.deliveryAreas.map(name => ({ '@type': 'Place', name })),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
