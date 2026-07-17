import Link from 'next/link';
import Image from 'next/image';

const SITE = 'https://sreesvadistaprasada.com';

export const metadata = {
  title: { absolute: 'South Indian Food Blog | Andhra Cuisine Guides | Sree Svadista Prasada' },
  description: 'Guides to South Indian and Andhra cuisine — what is Dabba Wala, ragi health benefits, South Indian vs North Indian food, gongura, and more from Sree Svadista Prasada.',
  alternates: { canonical: `${SITE}/blog` },
  openGraph: {
    title: 'South Indian Food Blog | Sree Svadista Prasada',
    description: 'Guides to South Indian and Andhra cuisine from the kitchen of Sree Svadista Prasada.',
    type: 'website',
    url: `${SITE}/blog`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1742281257687-092746ad6021?w=1200&q=80', width: 1200, height: 630, alt: 'South Indian food guides' }],
  },
};

const POSTS = [
  {
    slug: 'what-is-dabba-wala',
    title: 'What Is Dabba Wala? The Complete Guide to Indian Tiffin Delivery',
    excerpt: 'The story behind the legendary Mumbai tiffin delivery system, its 99.99% accuracy rate, and how Sree Svadista Prasada brings it to Milton Keynes.',
    category: 'Culture & History',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1652250406978-622a4d19e7e3?w=600&q=80',
  },
  {
    slug: 'south-indian-vs-north-indian-food',
    title: 'South Indian Food vs North Indian Food — The Real Differences',
    excerpt: 'Rice vs wheat. Tamarind vs cream. Guntur chilli vs Kashmiri chilli. A definitive guide to what actually separates these two completely different cuisines.',
    category: 'Food Guide',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1742281257687-092746ad6021?w=600&q=80',
  },
  {
    slug: 'ragi-health-benefits',
    title: 'Ragi: The Ancient South Indian Superfood Nutritionists Are Rediscovering',
    excerpt: 'More calcium than milk. Lower GI than rice. Naturally gluten-free. Finger millet has been a staple of Andhra kitchens for 4,000 years — here\'s why it\'s worth knowing about.',
    category: 'Nutrition & Wellness',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1743615467363-250466982515?w=600&q=80',
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-amber-50">
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-amber-300 text-sm font-semibold uppercase tracking-widest mb-3">From Our Kitchen</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>
            South Indian Food Guides
          </h1>
          <p className="text-xl text-amber-200 max-w-2xl">
            Deep dives into Andhra cuisine, ingredient stories, cultural history, and the food traditions behind everything we cook.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid gap-10">
          {POSTS.map(post => (
            <article key={post.slug} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-100 flex flex-col md:flex-row">
              <div className="md:w-64 flex-shrink-0 bg-amber-100 overflow-hidden relative" style={{ minHeight: '200px' }}>
                <Image fill src={post.image} alt={post.title} className="object-cover" sizes="(max-width:768px) 100vw,256px" />
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">{post.category}</span>
                    <span className="text-xs text-gray-400">{post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2 leading-snug" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                    <Link href={`/blog/${post.slug}`} className="hover:text-amber-700 transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed">{post.excerpt}</p>
                </div>
                <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-amber-700 font-semibold text-sm mt-4 hover:text-amber-900 transition-colors">
                  Read article →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
