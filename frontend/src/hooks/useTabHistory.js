import { useEffect } from 'react';

// Syncs a tab state with the URL hash so browser back/forward navigates
// between tabs instead of leaving the page.
export default function useTabHistory(activeTab, setActiveTab, defaultTab = 'All') {
  useEffect(() => {
    const applyFromHash = () => {
      const raw = window.location.hash.slice(1);
      const decoded = raw ? decodeURIComponent(raw) : defaultTab;
      setActiveTab(decoded);
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
    const encoded = encodeURIComponent(tab);
    const url = `${window.location.pathname}${window.location.search}#${encoded}`;
    window.history.pushState({ tab }, '', url);
    setActiveTab(tab);
  };
}
