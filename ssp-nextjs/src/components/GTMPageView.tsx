'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * Fires a GTM page_view event on every client-side route change.
 * Without this, Next.js App Router never triggers GTM's "All Pages"
 * for subsequent navigation — only the first hard load fires.
 */
export default function GTMPageView() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const isFirst      = useRef(true);

  useEffect(() => {
    // Skip the very first render — GTM fires page_view on initial hard load itself
    if (isFirst.current) { isFirst.current = false; return; }
    trackPageView(pathname, document.title);
  }, [pathname, searchParams]);

  return null;
}
