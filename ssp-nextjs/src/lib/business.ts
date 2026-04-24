/**
 * lib/business.ts
 * Single source of truth for all business data.
 * Import from here — never hardcode business info in components.
 */
export const BUSINESS = {
  name: 'Sree Svadista Prasada',
  tagline: 'Authentic South Indian Kitchen, Milton Keynes',
  phone: '07307 119962',
  phoneIntl: '+447307119962',
  email: 'hello@sreesvadistaprasada.com',
  website: 'https://sreesvadistaprasada.com',
  orderingApp: 'https://sreesvadistaprasada.vercel.app',
  address: {
    street: '24 Oxman Ln',
    area: 'Greenleys',
    city: 'Milton Keynes',
    postcode: 'MK12 6LF',
    country: 'GB',
    full: '24 Oxman Ln, Greenleys, Milton Keynes, MK12 6LF',
  },
  geo: {
    lat: 52.0663,
    lng: -0.7820,
  },
  hours: [
    { day: 'Monday', open: '07:00', close: '23:00', closed: false },
    { day: 'Tuesday', open: '07:00', close: '23:00', closed: false },
    { day: 'Wednesday', open: '07:00', close: '23:00', closed: false },
    { day: 'Thursday', open: '07:00', close: '23:00', closed: false },
    { day: 'Friday', open: '07:00', close: '23:00', closed: false },
    { day: 'Saturday', open: '', close: '', closed: true },
    { day: 'Sunday', open: '', close: '', closed: true },
  ],
  deliveryAreas: [
    'Greenleys',
    'Wolverton',
    'Stony Stratford',
    'New Bradwell',
    'Bradwell',
    'Old Stratford',
    'Milton Keynes',
  ],
  social: {
    instagram: '',
    facebook: '',
    whatsapp: '+447307119962',
  },
  cuisine: ['South Indian', 'Andhra', 'Telugu', 'Vegetarian', 'Non-Vegetarian'],
  services: ['Online Ordering', 'Takeaway', 'Home Delivery', 'Dabba Wala', 'Catering'],
} as const
