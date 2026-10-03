import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import HomeClient from './HomeClient';
import { getOpeningHoursSpec, getFeaturedItems, getChefSpecialItem, getDishPhotos } from '@/lib/siteStatus';

// Re-read the opening hours set in admin every 10 minutes
export const revalidate = 600;

export const metadata = pageMeta('/', { image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80' });

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Restaurant',
      '@id': 'https://sreesvadistaprasada.com/#restaurant',
      name: 'Sree Svadista Prasada',
      description: 'Authentic South Indian home-style cooking — grandmother\'s recipes, slow tadkas, and the patient kind of love that fills a house with aroma.',
      url: 'https://sreesvadistaprasada.com',
      telephone: '+447307119962',
      email: 'info@sreesvadistaprasada.com',
      image: 'https://sreesvadistaprasada.com/logo.png',
      logo: 'https://sreesvadistaprasada.com/logo.png',
      priceRange: '££',
      servesCuisine: ['South Indian', 'Andhra', 'Telugu', 'Indian', 'Vegetarian'],
      knowsAbout: ['Gongura', 'Andhra cuisine', 'Telugu food', 'Dabba Wala', 'Ragi', 'Pulihora', 'Avakaya', 'Chicken 65', 'Gutti Vankaya'],
      hasMap: 'https://maps.google.com/?q=24+Oxman+Ln,+Greenleys,+Milton+Keynes+MK12+6LF',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '24 Oxman Ln',
        addressLocality: 'Greenleys, Milton Keynes',
        addressRegion: 'Buckinghamshire',
        postalCode: 'MK12 6LF',
        addressCountry: 'GB',
      },
      // MK12 6LF postcode centroid (ONS via postcodes.io) — swap for the GBP
      // pin coordinates once the Business Profile goes live
      geo: { '@type': 'GeoCoordinates', latitude: 52.05313, longitude: -0.828507 },
      areaServed: [
        { '@type': 'City', name: 'Milton Keynes' },
      ],
      sameAs: [
        'https://www.instagram.com/sreesvadistaprasada/',
        'https://www.facebook.com/sreesvadistaprasada',
      ],
      hasMenu: 'https://sreesvadistaprasada.com/menu',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'South Indian Menu',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Menu', name: 'Prasada — Pure Vegetarian Menu', url: 'https://sreesvadistaprasada.com/prasada' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Menu', name: 'Svadista — Non-Vegetarian Menu', url: 'https://sreesvadistaprasada.com/svadista' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Dabba Wala Weekly Subscription', url: 'https://sreesvadistaprasada.com/subscriptions' } },
        ],
      },
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '11:00', closes: '22:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday', 'Sunday'], opens: '10:00', closes: '23:00' },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://sreesvadistaprasada.com/#website',
      url: 'https://sreesvadistaprasada.com',
      name: 'Sree Svadista Prasada',
      publisher: { '@id': 'https://sreesvadistaprasada.com/#restaurant' },
      // No SearchAction: the site has no dedicated search-results route, and
      // sitelinks-searchbox markup pointing at a category page gets ignored.
    },
  ],
};

export default async function HomePage() {
  const [hours, featured, special, photos] = await Promise.all([getOpeningHoursSpec(), getFeaturedItems(), getChefSpecialItem(), getDishPhotos()]);
  // The kitchen's own dish photos for the banner, the two menu cards, the time-of-day
  // circles and the photo grid. A missing photo falls back to the picture already in place.
  const pic = (slug) => photos[slug]?.image;
  const art = {
    hero: [pic('veg-thali'), pic('chicken-fry-piece-biryani'), pic('pappu-pappadam-roti-pachadi-rice-yogurt')],
    svadista: pic('chicken-dum-biryani'),
    prasada: pic('pulihora'),
    moments: { 1: pic('masala-dosa'), 2: pic('gutti-vankaya-masala'), 3: pic('spicy-andhra-chicken-curry'), 4: pic('punugulu') },
    gallery: ['masala-dosa', 'chicken-dum-biryani', 'gutti-vankaya-masala', 'idli-3-pcs', 'gongura-chicken-curry', 'pulihora', 'punugulu', 'chicken-65']
      .filter(s => photos[s]).map(s => ({ id: s, src: photos[s].image, alt: photos[s].name })),
  };
  // Opening hours come from the Collection Times set in admin; if they can't be
  // read, say nothing rather than publish hours that might be wrong.
  const graph = jsonLd['@graph'].map(node => {
    if (node['@type'] !== 'Restaurant') return node;
    const { openingHoursSpecification, ...rest } = node;
    return hours && hours.length ? { ...rest, openingHoursSpecification: hours } : rest;
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...jsonLd, '@graph': graph }) }}
      />
      <HomeClient intro={{ h1: PAGE_SEO['/'].h1, ...PAGE_SEO['/'].content }} initialFeatured={featured} initialSpecial={special} art={art} />
    </>
  );
}
