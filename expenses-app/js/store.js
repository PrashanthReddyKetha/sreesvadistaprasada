// Everything is kept on the phone first (IndexedDB), so the app works with no signal.
// Stores: expenses (one per expense, deletions kept until synced), files (receipt files), kv (settings and sync state).

let dbp = null;
function open() {
  dbp ||= new Promise((resolve, reject) => {
    const req = indexedDB.open("ssp-expenses", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore("expenses", { keyPath: "id" });
      db.createObjectStore("files", { keyPath: "id" });
      db.createObjectStore("kv", { keyPath: "k" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const out = fn(s);
    t.oncomplete = () => resolve(out && "result" in out ? out.result : out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const all = (store) => tx(store, "readonly", (s) => s.getAll());
export const get = (store, id) => tx(store, "readonly", (s) => s.get(id));
export const put = (store, value) => tx(store, "readwrite", (s) => s.put(value));
export const del = (store, id) => tx(store, "readwrite", (s) => s.delete(id));
export const kvGet = async (k) => (await get("kv", k))?.v;
export const kvSet = (k, v) => put("kv", { k, v });

// Ask the browser not to clear the data when the phone is low on space.
export async function persist() {
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch {}
}
