'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { hrefOf, tabsOf } from '@/lib/menuSections';

/* The tab bar on a menu section page. Each tab is a link to that subsection's own page (src/lib/menuSections.js),
   switched by Next without a reload. The tapped tab shows at once while the page arrives, and the view stays at the
   tab bar instead of jumping to the top. The address is the memory of which tab is open: nothing is stored. */

let tapped = false;   // a tab was tapped: the page that arrives keeps the tab bar in view

/** [the tab to show, pick(tab)] — the tab is the page's own (`initialTab`), or the one just tapped until that page arrives. */
export function useSectionTab(initialTab) {
  const [picked, setPicked] = useState(null);                 // { tab, over: the page's tab when it was tapped }
  const activeTab = picked && picked.over === initialTab ? picked.tab : initialTab;
  const first = useRef(true);
  const shown = useRef(initialTab);
  useEffect(() => {
    const toTabs = () => {
      const el = document.getElementById('section-tabs-anchor');
      if (!el) return;
      const headerH = document.querySelector('header')?.offsetHeight ?? 96;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headerH, behavior: 'instant' });
    };
    if (first.current) {
      first.current = false;
      if (tapped) { tapped = false; toTabs(); return; }     // a tab on the page before brought us here
      if (performance.getEntriesByType('navigation')[0]?.type !== 'back_forward') window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    toTabs();
  }, [activeTab]);
  // the tapped page has arrived (same page, new tab): the flag is spent, so the next page opened at the top
  useEffect(() => { if (shown.current !== initialTab) { shown.current = initialTab; tapped = false; } }, [initialTab]);
  return [activeTab, (tab) => { tapped = true; setPicked({ tab, over: initialTab }); }];
}

export default function SectionTabs({ section, active, onPick, color }) {
  const row = useRef(null);
  const first = useRef(true);
  useEffect(() => {
    const el = row.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ behavior: first.current ? 'instant' : 'smooth', block: 'nearest', inline: 'nearest' });
    first.current = false;
  }, [active]);
  return (
    <nav ref={row} aria-label="Sections" className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {tabsOf(section).map(tab => (
        <Link key={tab} href={hrefOf(section, tab)} scroll={false}
          onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) onPick(tab); }}
          data-active={active === tab ? 'true' : 'false'} aria-current={active === tab ? 'page' : undefined}
          className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
          style={{ backgroundColor: active === tab ? color : 'transparent', color: active === tab ? 'white' : '#374151' }}>
          {tab}
        </Link>
      ))}
    </nav>
  );
}
