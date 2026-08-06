'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

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
    // Skip the very first render — GTM fires page_view on initial hard load itself
    if (isFirst.current) { isFirst.current = false; return; }
    trackPageView(pathname, document.title);
  }, [pathname]);

  return null;
}
