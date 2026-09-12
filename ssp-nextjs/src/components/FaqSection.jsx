import Link from 'next/link';

/**
 * Server-rendered FAQ accordion + optional section-link nav.
 * Exists so every page carrying FAQPage JSON-LD also shows the same Q&A
 * visibly (Google requires FAQ rich-result content to be on the page), and so
 * subsection routes get real crawlable <a> links instead of hash-only tabs.
 *
 * faqs:  [{ q, a }]
 * links: [{ href, label }] — optional "browse by section" chips
 */
export default function FaqSection({ title = 'Frequently asked questions', faqs = [], links = [], linksTitle = 'Browse by section' }) {
  if (!faqs.length && !links.length) return null;
  return (
    <section className="py-12 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
      <div className="max-w-3xl mx-auto">
        {faqs.length > 0 && (
          <>
            <div className="w-10 h-0.5 mb-3" style={{ backgroundColor: '#F4C430' }} />
            <h2 className="text-2xl font-bold mb-6 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              {title}
            </h2>
            <div className="space-y-2">
              {faqs.map(({ q, a }) => (
                <details key={q} className="group bg-white rounded-lg border" style={{ borderColor: 'rgba(128,0,32,0.12)' }}>
                  <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-bold flex items-center justify-between gap-3" style={{ color: '#2D2422' }}>
                    {q}
                    <span className="shrink-0 transition-transform group-open:rotate-45 text-lg leading-none" style={{ color: '#800020' }} aria-hidden>+</span>
                  </summary>
                  <p className="px-4 pb-4 text-sm leading-relaxed" style={{ color: '#5C4B47' }}>{a}</p>
                </details>
              ))}
            </div>
          </>
        )}
        {links.length > 0 && (
          <nav aria-label={linksTitle} className={faqs.length ? 'mt-8' : ''}>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#B8860B' }}>{linksTitle}</h2>
            <div className="flex flex-wrap gap-2">
              {links.map(({ href, label }) => (
                <Link key={href} href={href}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full bg-white border transition-colors hover:border-[#800020]"
                  style={{ borderColor: 'rgba(128,0,32,0.15)', color: '#800020' }}>
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </section>
  );
}

/** Build FAQPage JSON-LD from the same array the page renders visibly. */
export const faqSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});
