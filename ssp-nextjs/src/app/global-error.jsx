'use client';

/* Last resort when even the layout fails: plain HTML, no dependencies. */
export default function GlobalError({ reset }) {
  return (
    <html lang="en-GB">
      <body style={{ fontFamily: 'Georgia, serif', background: '#FFF8F0', color: '#5C4B47', margin: 0 }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div>
            <h1 style={{ color: '#800020' }}>Sree Svadista Prasada</h1>
            <p>Something went wrong loading the site. Please try again in a moment.</p>
            <button onClick={() => reset()} style={{ background: '#800020', color: '#fff', border: 0, padding: '0.7rem 1.4rem', fontWeight: 600, cursor: 'pointer' }}>Try again</button>
            <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>Or message us on WhatsApp: <a href="https://wa.me/447307119962" style={{ color: '#800020' }}>+44 7307 119962</a></p>
          </div>
        </main>
      </body>
    </html>
  );
}
