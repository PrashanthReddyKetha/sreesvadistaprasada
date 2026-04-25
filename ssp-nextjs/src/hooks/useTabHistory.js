import { useEffect } from 'react';

const slugify = (t) =>
  t.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');

// Syncs a tab state with the URL hash so browser back/forward navigates
// between tabs instead of leaving the page.
// tabs: full list of tab names — used to reverse-map slug → original name
export default function useTabHistory(activeTab, setActiveTab, defaultTab = 'All', tabs = []) {
  const fromSlug = (slug) => {
    if (!slug) return defaultTab;
    const match = tabs.find(t => slugify(t) === slug || t === slug);
    return match || defaultTab;
  };

  useEffect(() => {
    const applyFromHash = () => {
      const raw = decodeURIComponent(window.location.hash.slice(1));
      setActiveTab(raw ? fromSlug(raw) : defaultTab);
    };
    applyFromHash();
    window.addEventListener('popstate', applyFromHash);
    window.addEventListener('hashchange', applyFromHash);
    return () => {
      window.removeEventListener('popstate', applyFromHash);
      window.removeEventListener('hashchange', applyFromHash);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (tab) => {
    if (tab === activeTab) return;
    const url = `${window.location.pathname}${window.location.search}#${slugify(tab)}`;
    window.history.pushState({ tab }, '', url);
    setActiveTab(tab);
  };
}
