'use client'
import Link from 'next/link'
import { useState } from 'react'
import { BUSINESS } from '@/lib/business'

const navLinks = [
  { href: '/menu', label: 'Menu' },
  { href: '/dabba-wala', label: 'Dabba Wala' },
  { href: '/catering', label: 'Catering' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-amber-100 shadow-sm">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-brand text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
          <span aria-hidden="true" className="text-accent">✦</span>
          <span>{BUSINESS.name}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-700 hover:text-brand transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <a
            href={BUSINESS.orderingApp}
            className="btn-primary text-sm py-2 px-5"
          >
            Order now
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-700"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {open
              ? <path d="M6 18L18 6M6 6l12 12" />
              : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-amber-100 bg-white px-4 pb-4">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-3 text-sm font-medium text-gray-700 border-b border-gray-50"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <a href={BUSINESS.orderingApp} className="btn-primary block text-center mt-4 text-sm">
            Order now
          </a>
        </div>
      )}
    </header>
  )
}
