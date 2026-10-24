// The copy on the server (the website's backend). Signed in with the website's admin account.

const LIVE = "https://svadista-backend.onrender.com";
const LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
export const BASE = (() => {
  try { const o = localStorage.getItem("ssp_exp_api"); if (o && LOCAL) return o; } catch {}
  return LOCAL ? "http://127.0.0.1:8765" : LIVE;
})();

const TOKEN = "ssp_exp_token", WHO = "ssp_exp_who";
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
export const token = () => read(TOKEN);
export const who = () => read(WHO);
export function signOut() { write(TOKEN, null); }

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// The free server sleeps when idle and takes up to a minute to wake, so requests wait that long.
async function call(path, { method = "GET", json, body, type, timeout = 90000 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  const headers = {};
  if (token()) headers.Authorization = "Bearer " + token();
  if (json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
  else if (type) headers["Content-Type"] = type;
  let res;
  try { res = await fetch(BASE + "/api" + path, { method, headers, body, signal: ctl.signal }); }
  catch { throw new ApiError(0, "No connection to the server"); }
  finally { clearTimeout(timer); }
  if (!res.ok) {
    let detail = res.statusText;
    try { const j = await res.json(); detail = typeof j.detail === "string" ? j.detail : detail; } catch {}
    throw new ApiError(res.status, detail);
  }
  return res;
}

export async function signIn(email, password) {
  const res = await call("/auth/login", { method: "POST", json: { email, password } });
  const j = await res.json();
  if (j.user?.role !== "admin") throw new ApiError(403, "This is not the admin account. Use the account you sign in to Admin with.");
  write(TOKEN, j.access_token);
  write(WHO, j.user.email || email);
  return j.user;
}

export const changes = async (after) => (await call(`/expenses/changes?after=${after}`)).json();
export const putExpense = async (id, doc) => (await call(`/expenses/${encodeURIComponent(id)}`, { method: "PUT", json: doc })).json();
export const putReceipt = async (id, blob, type) => (await call(`/expenses/receipts/${encodeURIComponent(id)}`, { method: "PUT", body: blob, type, timeout: 180000 })).json();
export const getReceipt = async (id) => (await call(`/expenses/receipts/${encodeURIComponent(id)}`)).blob();
export const getState = async () => (await call("/expenses/state")).json();
export const putState = async (s) => (await call("/expenses/state", { method: "PUT", json: s })).json();
