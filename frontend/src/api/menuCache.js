const TTL = 5 * 60 * 1000; // 5 min

export function getCached(key) {
  try {
    const raw = sessionStorage.getItem('ssp_menu_' + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts < TTL ? data : null;
  } catch { return null; }
}

export function setCached(key, data) {
  try {
    sessionStorage.setItem('ssp_menu_' + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}
