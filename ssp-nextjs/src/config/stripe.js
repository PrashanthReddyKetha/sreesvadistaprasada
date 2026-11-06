/**
 * Stripe publishable key — public by design (it ships in the browser bundle either way).
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY on Vercel wins when set; set it empty to switch card payments off (the CI browser build does).
 */
export const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ?? 'pk_live_51TLj4IAtRi4Q663k0ogureQVvHRpGrIkdCWAkwzDmYCWpEqEDJmI1j7MAhXlCCP0vjWN6aaAIEOMs3GQW4BreeuC00QzdLSfji'
