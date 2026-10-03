import Link from 'next/link';

/**
 * A short block of plain, readable copy with descriptive internal links.
 * Server-rendered, so the words are in the HTML search engines read. The copy
 * itself lives in src/lib/seo/pages.js and src/lib/categorySeo.js.
 */
export default function SeoSection({ heading, paragraphs = [], links = [], as: Heading = 'h2' }) {
  if (!paragraphs.length && !links.length) return null;
  return (
    <section className="px-4 md:px-8 py-10 md:py-14" style={{ backgroundColor: '#FDFBF7', borderTop: '1px solid rgba(128,0,32,0.08)' }}>
      <div className="max-w-3xl mx-auto">
        {heading && (
          <Heading className="text-xl md:text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            {heading}
          </Heading>
        )}
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm md:text-base leading-relaxed mb-3" style={{ color: '#5C4B47' }}>{p}</p>
        ))}
        {links.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-4">
            {links.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="inline-block px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-colors hover:bg-white"
                  style={{ color: '#800020', border: '1px solid rgba(128,0,32,0.25)' }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
