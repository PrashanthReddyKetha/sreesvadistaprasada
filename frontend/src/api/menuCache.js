// Short TTL: this is purely to dedupe rapid duplicate calls (e.g. quick tab
// switches), not a source of truth. Availability changes made in the admin
// panel must show up quickly everywhere, so keep this window small.
const TTL = 30 * 1000; // 30 sec

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
