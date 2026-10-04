'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';
import { record } from '@/lib/track';

/**
 * Fires a GTM page_view event on every client-side route change.
 * Without this, Next.js App Router never triggers GTM's "All Pages"
 * for subsequent navigation — only the first hard load fires.
 *
 * NOTE: intentionally depends on pathname only, not searchParams.
 * searchParams can update independently after navigation causing
 * a spurious second page_view on the same page.
 */
export default function GTMPageView() {
  const pathname = usePathname();
  const isFirst  = useRef(true);

  useEffect(() => {
    // First render: GTM fires its own page_view on a hard load, so only our own record is told
    if (isFirst.current) { isFirst.current = false; record('page_view'); return; }
    trackPageView(pathname, document.title);
  }, [pathname]);

  return null;
}
