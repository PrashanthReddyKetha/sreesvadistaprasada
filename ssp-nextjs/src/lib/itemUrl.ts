const CATEGORY_TO_MENU: Record<string, string> = {
  nonVeg: 'svadista',
  veg: 'prasada',
  breakfast: 'breakfast',
  pickles: 'snacks',
  podis: 'snacks',
  drinks: 'drinks',
  streetFood: 'street-food',
  ragiSpecials: 'ragi-specials',
}

const CATEGORY_DEFAULT_SUBSECTION: Record<string, string> = {
  pickles: 'pickles',
  podis: 'podis',
  drinks: 'beverages',
  streetFood: 'street-bites',
  ragiSpecials: 'specials',
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildItemUrl(item: {
  category: string
  subcategory?: string | null
  slug?: string | null
  name: string
}): string {
  const menu = CATEGORY_TO_MENU[item.category] || item.category
  const subsection = item.subcategory
    ? slugify(item.subcategory)
    : CATEGORY_DEFAULT_SUBSECTION[item.category] || 'general'
  const itemSlug = item.slug || slugify(item.name)
  return `/${menu}/${subsection}/${itemSlug}`
}
