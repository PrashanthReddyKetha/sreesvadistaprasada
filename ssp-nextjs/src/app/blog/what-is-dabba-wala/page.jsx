import Link from 'next/link';

const SITE = 'https://sreesvadistaprasada.com';

export const metadata = {
  title: { absolute: 'What Is Dabba Wala? The Complete Guide to Indian Tiffin Delivery | Sree Svadista Prasada' },
  description: 'Dabba Wala (Dabbawala) — the legendary Mumbai tiffin delivery system with a 99.99% accuracy rate, studied by Harvard Business School. Discover the history, how it works, and how Sree Svadista Prasada brings this tradition to Milton Keynes.',
  keywords: ['what is Dabba Wala', 'Dabbawala', 'Indian tiffin delivery', 'tiffin subscription UK', 'dabba wala Milton Keynes', 'Indian meal delivery subscription', 'South Indian tiffin UK'],
  openGraph: {
    title: 'What Is Dabba Wala? The Complete Guide to Indian Tiffin Delivery',
    description: 'The story behind the legendary Mumbai tiffin delivery system and how Sree Svadista Prasada brings it to Milton Keynes.',
    type: 'article',
    url: `${SITE}/blog/what-is-dabba-wala`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1652250406978-622a4d19e7e3?w=1200&q=80', width: 1200, height: 630, alt: 'Dabba Wala tiffin boxes — Indian meal delivery' }],
  },
  twitter: { card: 'summary_large_image', title: 'What Is Dabba Wala? The Complete Guide', images: ['https://images.unsplash.com/photo-1652250406978-622a4d19e7e3?w=1200&q=80'] },
  alternates: { canonical: `${SITE}/blog/what-is-dabba-wala` },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'What Is Dabba Wala? The Complete Guide to Indian Tiffin Delivery',
    description: 'The Dabba Wala (Dabbawala) is the legendary Mumbai tiffin delivery system delivering 200,000 home-cooked lunches daily with a 99.99% accuracy rate. Sree Svadista Prasada brings this tradition to Milton Keynes.',
    author: { '@type': 'Organization', name: 'Sree Svadista Prasada', url: SITE },
    publisher: { '@type': 'Organization', name: 'Sree Svadista Prasada', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } },
    datePublished: '2025-01-15',
    dateModified: '2026-07-01',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/what-is-dabba-wala` },
    image: 'https://images.unsplash.com/photo-1652250406978-622a4d19e7e3?w=1200&q=80',
    articleSection: 'Culture & History',
    keywords: ['Dabba Wala', 'Dabbawala', 'tiffin delivery', 'Indian meal subscription', 'Mumbai lunch delivery'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: 'What Is Dabba Wala?', item: `${SITE}/blog/what-is-dabba-wala` },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What is a Dabba Wala?', acceptedAnswer: { '@type': 'Answer', text: 'A Dabba Wala (also spelled Dabbawala) is a delivery worker who collects home-cooked food in a tiffin box (dabba) and delivers it to offices or homes. The system originated in Mumbai, India, and is famous for its extraordinary accuracy — handling 200,000 lunches daily with only one error per every 6 million deliveries.' } },
      { '@type': 'Question', name: 'How does the Dabba Wala subscription work at Sree Svadista Prasada?', acceptedAnswer: { '@type': 'Answer', text: 'Choose a Weekly or Monthly plan (Prasada vegetarian, Svadista non-veg, or Mixed), select your start date, and freshly cooked South Indian meals are delivered to your door in Milton Keynes on your chosen days. Plans start from £12.50 per meal.' } },
      { '@type': 'Question', name: 'Can I pause or cancel my Dabba Wala subscription?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — you can pause, resume, or cancel anytime with 24 hours notice. No cancellation penalty.' } },
    ],
  },
];

export default function DabbaWalaArticle() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen bg-amber-50">
        <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 text-white py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <nav className="text-amber-300 text-sm mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <span className="mx-2">/</span>
              <span className="text-white">What Is Dabba Wala?</span>
            </nav>
            <span className="text-xs font-semibold text-amber-300 bg-amber-900/50 px-3 py-1 rounded-full uppercase tracking-wider">Culture &amp; History</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-4 leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
              What Is Dabba Wala? The Complete Guide to Indian Tiffin Delivery
            </h1>
            <p className="text-amber-200 text-lg">6 min read &middot; Sree Svadista Prasada</p>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-6 py-12 prose prose-lg prose-amber">

          <h2>The System That Defied Logic</h2>
          <p>
            Every morning in Mumbai, roughly 5,000 workers fan out across the city carrying wooden crates stacked with metal tiffin boxes. By midday, 200,000 home-cooked lunches have been collected from homes, sorted, routed across 60 kilometres of rail and road, and delivered to offices — hot, and almost always to the right person.
          </p>
          <p>
            The error rate? One mistake per every six million deliveries. No GPS. No computers. A coding system of colours, numbers, and symbols scratched onto the lids with chalk.
          </p>
          <p>
            Harvard Business School studied it. Forbes wrote about it. Prince Charles visited the dabbawalas during his 2003 trip to India. It has been described as one of the most efficient supply chains in human history.
          </p>
          <p>
            This is the tradition our Dabba Wala subscription honours.
          </p>

          <h2>What Does &ldquo;Dabba Wala&rdquo; Mean?</h2>
          <p>
            In Hindi and Marathi, <em>dabba</em> means box or container — specifically the stacked metal tiffin box that is the iconic vessel of Indian home cooking. <em>Wala</em> means &ldquo;person who deals in&rdquo; or &ldquo;one who carries.&rdquo; So dabba wala literally means &ldquo;the person who carries tiffin boxes.&rdquo;
          </p>
          <p>
            A tiffin (also called a tiffin box or lunch box) is the layered metal container used to transport separate portions of a meal — rice in one layer, dal in another, sabzi (vegetable dish) in a third. The word &ldquo;tiffin&rdquo; itself is a Victorian-era British term for a light meal, absorbed into Indian English during the colonial period.
          </p>

          <h2>A Brief History</h2>
          <p>
            The Mumbai dabbawala system began in 1890 when a Parsi banker wanted home-cooked food delivered to his office. He hired a young man from the Varkari community — a group of pilgrims from Maharashtra — to collect his wife&apos;s cooking and bring it to him daily.
          </p>
          <p>
            Other Bombay workers noticed and requested the same service. Within a decade, it had grown into a guild. By independence in 1947, the Nutan Mumbai Tiffin Box Suppliers Trust had been formally established.
          </p>
          <p>
            Today, the Mumbai dabbawalas handle approximately 200,000–400,000 tiffins per day, employing around 5,000 workers, most of whom are semi-literate and from small towns in Maharashtra. Their illiteracy did not limit their system — it drove them to create a physical coding system so robust that modern Six Sigma analysis awards it a &ldquo;Six Sigma&rdquo; quality rating (99.9999% accuracy).
          </p>

          <h2>Why Home-Cooked Food Matters</h2>
          <p>
            The reason the dabbawala system exists at all is rooted in something simple: Indians do not trust restaurant food the way Westerners do. Many are vegetarian for religious reasons, many have specific dietary restrictions, many simply prefer the precise spicing of their own kitchen. Factory canteen food does not meet these needs.
          </p>
          <p>
            Home-cooked food also carries social meaning. A wife or mother cooking for her husband or child who works far from home is an act of care. The dabba is not just food — it is connection, continuity, the smell of a specific kitchen that no restaurant can replicate.
          </p>

          <h2>The Sree Svadista Prasada Dabba Wala</h2>
          <p>
            Our Dabba Wala subscription translates this spirit to Milton Keynes. We cannot pretend our delivery system matches the legendary Mumbai network&apos;s scale — but the principle is identical: fresh, home-style South Indian food delivered regularly to your door, removing the daily question of &ldquo;what&apos;s for dinner.&rdquo;
          </p>
          <p>
            Each dabba includes rice, a main curry, dal or sambar, a side dish, pickle or chutney, and papad — a complete South Indian home meal, cooked on the day of delivery with no reheating, no preservatives, and no shortcuts.
          </p>
          <ul>
            <li><strong>Prasada box</strong> — pure vegetarian, same-day cooked, temple-kitchen standards</li>
            <li><strong>Svadista box</strong> — halal non-vegetarian, Andhra-style curries and rice dishes</li>
            <li><strong>Mixed box</strong> — alternating veg and non-veg across your subscription period</li>
          </ul>
          <p>
            Plans start from <strong>£12.50 per meal</strong> on a weekly or monthly subscription. You can pause or cancel anytime with 24 hours&apos; notice.
          </p>

          <div className="not-prose bg-amber-800 text-white rounded-2xl p-8 text-center my-8">
            <h3 className="text-2xl font-bold mb-2">Start Your Dabba Wala Subscription</h3>
            <p className="text-amber-200 mb-6">Fresh South Indian home meals delivered to Milton Keynes. From £12.50 per meal.</p>
            <Link href="/subscriptions" className="inline-block bg-amber-400 text-gray-900 font-bold px-8 py-3 rounded-full hover:bg-amber-300 transition-colors">
              View Subscription Plans
            </Link>
          </div>

          <h2>FAQ</h2>
          <details><summary><strong>What is the difference between Dabba Wala and a meal kit service like HelloFresh?</strong></summary>
            <p>Meal kit services send raw ingredients for you to cook yourself. The Dabba Wala sends <em>fully cooked, ready-to-eat meals</em> prepared on the day of delivery. No cooking required on your end. The food is also authentically Indian — not a fusion or simplified version — made with the same techniques used in South Indian homes.</p>
          </details>
          <details><summary><strong>Can I customise my Dabba Wala box?</strong></summary>
            <p>Yes. You can note dietary preferences (low spice, no onion/garlic, specific allergens to avoid) when setting up your subscription. We will accommodate these within the constraints of our menu.</p>
          </details>
          <details><summary><strong>Is Dabba Wala available outside Milton Keynes?</strong></summary>
            <p>Hot meal delivery is currently available in Milton Keynes only. UK-wide shipping is available for our snack boxes, pickle jars, and podis. Edinburgh and Glasgow delivery is planned — register your interest via WhatsApp.</p>
          </details>

        </article>
      </main>
    </>
  );
}
