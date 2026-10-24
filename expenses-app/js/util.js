// Shared constants and small helpers. No DOM, so the receipt rules can be tested in Node.

export const CATEGORIES = [
  ["ingredients", "Ingredients & groceries"],
  ["packaging", "Packaging & containers"],
  ["equipment", "Kitchen equipment & utensils"],
  ["utilities", "Gas, electricity & water"],
  ["cleaning", "Cleaning & hygiene supplies"],
  ["licences", "Training, licences & inspections"],
  ["insurance", "Insurance"],
  ["software", "Website, apps & software"],
  ["fees", "Payment & bank fees"],
  ["marketing", "Marketing & printing"],
  ["transport", "Fuel, parking & delivery"],
  ["phone", "Phone & internet"],
  ["professional", "Accountant & professional fees"],
  ["other", "Other"],
];
export const CAT = Object.fromEntries(CATEGORIES);
export const ITEMISED = new Set(["ingredients", "packaging", "cleaning"]);
export const METHODS = [["card", "Business card"], ["bank", "Bank transfer"], ["cash", "Cash"], ["personal", "Personal card (claim back)"]];
export const METHOD = Object.fromEntries(METHODS);
// Each unit converts to a base so different pack sizes compare fairly.
export const UNITS = { kg: [1, "kg"], g: [0.001, "kg"], L: [1, "L"], ml: [0.001, "L"], each: [1, "each"], dozen: [12, "each"], pack: [1, "pack"], bunch: [1, "bunch"] };
export const PER = { kg: "per kg", L: "per litre", each: "each", pack: "per pack", bunch: "per bunch" };
export const SUPPLIERS = ["Asda", "Tesco", "Sainsbury's", "Lidl", "Aldi", "Sujas"];

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
export const money = (p) => gbp.format((p || 0) / 100);
export const pad = (n) => String(n).padStart(2, "0");
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => iso(new Date());
export const dayDate = (s) => new Date(s + "T12:00:00");
export const shortDate = (s) => dayDate(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const key = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
export const newId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12));

export function parseAmount(s, allowZero) {
  const t = String(s ?? "").replace(/[£,\s]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(t)) return null;
  const p = Math.round(parseFloat(t) * 100);
  return p > 0 || (allowZero && p >= 0) ? p : null;
}
export const parseQty = (s) => { const n = parseFloat(String(s ?? "").replace(",", ".")); return isFinite(n) && n > 0 ? n : null; };

// UK tax year: 6 April to 5 April. Returns the starting year.
export function taxYearOf(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return (m > 4 || (m === 4 && d >= 6)) ? y : y - 1;
}
export const tyLabel = (y) => `${y}/${String(y + 1).slice(2)}`;

export const unitPriceText = (pence, base) => {
  const v = pence / 100;
  return (v < 1 ? (v * 100).toFixed(1) + "p" : gbp.format(v)) + " " + PER[base];
};
