'use client';
import { useEffect, useRef } from 'react';

/* What every pop-up owes a keyboard or screen-reader user (audit A-0003, A11Y-001/010): focus moves into it when it
   opens, Tab stays inside it, Escape closes it, and focus goes back where it was when it closes. Attach the
   returned ref to the dialog's box and give the box role="dialog" aria-modal="true" and a label. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function useDialog(open, onClose, { initialFocus } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const box = ref.current;
    const opener = document.activeElement;
    const first = (initialFocus && box?.querySelector(initialFocus)) || box?.querySelector(FOCUSABLE) || box;
    if (box && !box.hasAttribute('tabindex')) box.setAttribute('tabindex', '-1');
    const t = setTimeout(() => first?.focus?.(), 0);
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
      if (e.key !== 'Tab' || !box) return;
      const items = Array.from(box.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
      if (!items.length) { e.preventDefault(); box.focus(); return; }
      const firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === box)) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    };
  }, [open, onClose, initialFocus]);
  return ref;
}
