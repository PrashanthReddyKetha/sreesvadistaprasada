'use client'

import dynamic from 'next/dynamic'

// Lazy-load cart drawer — only loads its JS when first rendered
const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false })

export default function CartDrawerLoader() {
  return <CartDrawer />
}
