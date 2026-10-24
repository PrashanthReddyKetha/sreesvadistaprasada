// Reading receipts on the phone: a PDF's own text (pdf.js), or text recognition on a photo or a scanned PDF
// (Tesseract). Both libraries are served from this app and kept for offline use after the first time.

import { linesFromPieces } from "./parse.js";

const V = new URL("../vendor/", import.meta.url).href;
const scripts = {};
function loadScript(src) {
  scripts[src] ||= new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res;
    s.onerror = () => { delete scripts[src]; rej(new Error("Could not load " + src)); };
    document.head.append(s);
  });
  return scripts[src];
}

async function pdfjs() {
  await loadScript(V + "pdfjs/pdf.min.js");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = V + "pdfjs/pdf.worker.min.js";
  return window.pdfjsLib;
}

export async function readPdf(blob, onStep) {
  const lib = await pdfjs();
  const pdf = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  const pieces = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const tc = await (await pdf.getPage(n)).getTextContent();
    for (const it of tc.items) pieces.push({ page: n, x: it.transform[4], y: it.transform[5], str: it.str });
  }
  const lines = linesFromPieces(pieces);
  if (lines.join("").replace(/\s/g, "").length > 40) return lines;
  // A scanned PDF has no text of its own: read its pages as pictures.
  const out = [];
  for (let n = 1; n <= Math.min(pdf.numPages, 4); n++) {
    onStep?.(`Reading page ${n} of ${Math.min(pdf.numPages, 4)}…`);
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: Math.min(4, 2200 / Math.max(base.width, base.height)) });
    const c = document.createElement("canvas"); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    out.push(...await recognise(c, onStep));
  }
  return out;
}

let worker = null, idle = null;
async function tesseract(onProgress) {
  await loadScript(V + "tesseract/tesseract.min.js");
  if (!worker) {
    worker = await window.Tesseract.createWorker("eng", 1, {
      workerPath: V + "tesseract/worker.min.js",
      corePath: V + "tesseract/core",
      langPath: V + "tesseract/lang",
      gzip: false,
      workerBlobURL: false,           // a worker from this site's own file stays inside the offline cache
      logger: (m) => { if (m.status === "recognizing text") onProgress?.(m.progress); },
    });
    // One uniform block: keeps each product and its price on the same line instead of splitting price columns off.
    await worker.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
  }
  clearTimeout(idle);
  idle = setTimeout(() => { worker?.terminate(); worker = null; }, 120000);
  return worker;
}

// Greyscale and stretch the contrast: faded till receipts read much better.
function prepare(source) {
  const w0 = source.width, h0 = source.height;
  let scale = Math.min(w0, h0) < 1400 ? Math.min(2, 1400 / Math.min(w0, h0)) : 1;
  if (Math.max(w0, h0) * scale > 2600) scale = 2600 / Math.max(w0, h0);
  const c = document.createElement("canvas");
  c.width = Math.round(w0 * scale); c.height = Math.round(h0 * scale);
  const ctx = c.getContext("2d");
  ctx.drawImage(source, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
  let lo = 255, hi = 0;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) { const g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0; d[i] = g; hist[g]++; }
  const n = d.length / 4; let acc = 0;
  for (let g = 0; g < 256; g++) { acc += hist[g]; if (acc > n * 0.02) { lo = g; break; } }
  acc = 0;
  for (let g = 255; g >= 0; g--) { acc += hist[g]; if (acc > n * 0.02) { hi = g; break; } }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) { const v = Math.max(0, Math.min(255, ((d[i] - lo) * 255) / span)); d[i] = d[i + 1] = d[i + 2] = v; }
  ctx.putImageData(img, 0, 0);
  return c;
}

async function recognise(canvasOrBitmap, onStep) {
  const w = await tesseract((p) => onStep?.(`Reading the receipt… ${Math.round(p * 100)}%`));
  const { data } = await w.recognize(prepare(canvasOrBitmap), {}, { text: true, blocks: true });
  const words = (data.words || []).filter((x) => x.text.trim() && x.confidence > 20);
  if (!words.length) return data.text.split("\n").map((l) => l.trim()).filter(Boolean);
  // Rebuild lines from where each word sits, so a price far to the right stays with its product.
  const hs = words.map((x) => x.bbox.y1 - x.bbox.y0).sort((a, b) => a - b);
  const tol = Math.max(4, hs[hs.length >> 1] * 0.6);
  return linesFromPieces(words.map((x) => ({ page: 1, x: x.bbox.x0, y: -(x.bbox.y0 + x.bbox.y1) / 2, str: x.text })), tol, " ");
}

export async function readImage(blob, onStep) {
  onStep?.("Preparing the reader…");
  const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
  return recognise(bmp, onStep);
}

// A smaller copy of a photo for keeping: plenty to read, a fraction of the size.
export async function shrinkPhoto(file) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.8));
    return blob && blob.size < file.size ? blob : file;
  } catch { return file; }
}

// Fetch the reading tools now, so receipts can be read later with no signal.
export async function warmUp() {
  const simd = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));
  const files = ["pdfjs/pdf.min.js", "pdfjs/pdf.worker.min.js", "tesseract/tesseract.min.js", "tesseract/worker.min.js",
    `tesseract/core/tesseract-core-${simd ? "simd-" : ""}lstm.wasm.js`, "tesseract/lang/eng.traineddata"];
  for (const f of files) { const r = await fetch(V + f); if (!r.ok) throw new Error(f); await r.arrayBuffer(); }
}
