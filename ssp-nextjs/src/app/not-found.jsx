import Link from 'next/link';

export const metadata = {
  title: { absolute: 'Page Not Found | Sree Svadista Prasada' },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 pt-[calc(32px+4rem)]" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="text-center max-w-md py-16">
        <p className="text-6xl mb-4">🪷</p>
        <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          This page has wandered off
        </h1>
        <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>
          The dish you&rsquo;re looking for may have moved or come off the menu.
          The kitchen, though, is very much open.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/menu" className="px-6 py-3 text-sm font-semibold rounded-sm text-white" style={{ backgroundColor: '#800020' }}>
            Browse the Menu
          </Link>
          <Link href="/order" className="px-6 py-3 text-sm font-semibold rounded-sm border" style={{ borderColor: '#800020', color: '#800020' }}>
            Order Now
          </Link>
        </div>
      </div>
    </main>
  );
}
