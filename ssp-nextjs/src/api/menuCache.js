// Short TTL: this is purely to dedupe rapid duplicate calls (e.g. quick tab
// switches), not a source of truth. Availability changes made in the admin
// panel must show up quickly everywhere, so keep this window small.
const TTL = 30 * 1000; // 30 sec
const PREFIX = 'ssp_menu_';

export function getCached(key) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts < TTL ? data : null;
  } catch { return null; }
}

export function setCached(key, data) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export function clearMenuCache() {
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => sessionStorage.removeItem(k));
  } catch {}
}
