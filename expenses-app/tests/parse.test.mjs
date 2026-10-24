// Receipt rules and names: node --test expenses-app/tests
import test from "node:test";
import assert from "node:assert/strict";
import { parseReceipt, linesFromPieces, sizeOf } from "../js/parse.js";
import { standardize, cleanName } from "../js/names.js";

// An Asda online order as pdf.js gives it: full price first, the voucher-spread price second, offers underneath.
const ASDA = [
  "Order: 70000080459923", "Sat 24 Oct 2026 06:00 PM to", "£32.12 (estimated)", "Indian & Asian Food (3 items)",
  "10 x KTC Chick Peas in Salted Water 400g  £6.50", "0.4kg  £2.02", "Any 5 for £2",
  "3 x KTC Pure Sunflower Oil 5 Litres  £19.50", "5lt  £9.85",
  "2 x ASDA Cashews 200g  £3.96", "0.2kg  £1.77", "Any 2 for £3.50",
  "3 x ASDA British Extra Mature Cheddar 400g  £9.60", "0.4kg  £4.13", "Any 2 for £5",
  "Shopping total  £64.98", "Delivery cost  £1.50", "Multibuy savings− £4.36", "eVouchers  − £30.00", "Total  £32.12",
  "You saved  £4.36  today at Asda",
];

test("online order: shelf prices after multibuy, sizes multiplied out, total paid", () => {
  const r = parseReceipt(ASDA);
  assert.equal(r.layout, "online order");
  assert.equal(r.supplier, "Asda");
  assert.equal(r.date, "2026-10-24");
  assert.equal(r.total, 3212);
  assert.deepEqual(r.items.map((i) => [i.pricePence, i.qty, i.unit]), [[400, 4, "kg"], [1950, 15, "L"], [350, 0.4, "kg"], [820, 1.2, "kg"]]);
});

test("till receipt: quantity, weight and discount lines land on the right product", () => {
  const r = parseReceipt(["SUJAS", "24/10/26 14:32", "TRS TOOR DAL 2KG  5.99", "2 x 1.29", "CURRY LEAVES  2.58", "ONIONS LOOSE",
    "0.850 kg @ £1.20/kg  1.02", "CORIANDER BUNCH  0.79", "OFFER SAVING  -0.20", "SUBTOTAL  10.38", "TOTAL  £10.18", "VISA CONTACTLESS  10.18"]);
  assert.equal(r.supplier, "Sujas");
  assert.equal(r.date, "2026-10-24");
  assert.equal(r.total, 1018);
  assert.deepEqual(r.items.map((i) => [i.name, i.qty, i.unit, i.pricePence]), [
    ["TRS TOOR DAL 2KG", 2, "kg", 599], ["2 x CURRY LEAVES", 2, "each", 258], ["ONIONS LOOSE", 0.85, "kg", 102], ["CORIANDER BUNCH", 1, "each", 59]]);
});

test("text recognition slips: £ read as €, a letter O in a price", () => {
  const r = parseReceipt(["LIDL", "Sunflower Oil 1L  €1.8O A", "TOTAL  1.80"]);
  assert.equal(r.items[0].pricePence, 180);
  assert.equal(r.supplier, "Lidl");
});

test("lines are rebuilt from positions", () => {
  const lines = linesFromPieces([{ page: 1, x: 500, y: 100, str: "£5.99" }, { page: 1, x: 10, y: 101, str: "Toor dal 2kg" }, { page: 1, x: 10, y: 80, str: "Total" }]);
  assert.deepEqual(lines, ["Toor dal 2kg  £5.99", "Total"]);
});

test("pack sizes", () => {
  assert.deepEqual(sizeOf("KTC Coconut Milk 400ml"), { qty: 0.4, unit: "L" });
  assert.deepEqual(sizeOf("Heera Chana Dal 4 x 500g"), { qty: 2, unit: "kg" });
  assert.deepEqual(sizeOf("Sunflower Oil 5 Litres"), { qty: 5, unit: "L" });
  assert.equal(sizeOf("Curry leaves"), null);
});

test("names: Telugu, Hindi and English names meet; her own names win", () => {
  assert.equal(standardize("TRS Kandi Pappu 2kg").standard, "Toor dal");
  assert.equal(standardize("Arhar Dal 1kg").standard, "Toor dal");
  assert.equal(standardize("Coconut Milk 400ml").standard, "Coconut milk");
  assert.equal(standardize("Chick Peas in Salted Water 400g").standard, "Chickpeas (tinned)");
  assert.equal(standardize("British Salted Butter 250g").standard, "Butter");
  assert.equal(standardize("Frozen Okra 1kg").standard, "Okra (frozen)");
  assert.equal(standardize("Mystery Spice Mix 100g").source, "guess");
  const learned = { [cleanName("Surya Whole Baby Okra 300g")]: "Baby okra" };
  assert.equal(standardize("3 x Surya Whole Baby Okra 300g", learned).standard, "Baby okra");
});
