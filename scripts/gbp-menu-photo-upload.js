/**
 * Upload dish photos to the Google Business Profile menu editor for
 * Sree Svadista Prasada, cross-referenced against live-menu.md, using
 * local images in menu-images/.
 *
 * THIS SCRIPT REQUIRES A REAL, LOGGED-IN BROWSER SESSION. Claude Code
 * cannot run this itself — no browser/computer-use tool is available
 * in that session. Run it yourself with Node + Playwright, in a
 * browser profile that is already signed in to the Google account
 * that manages this listing.
 *
 * Setup:
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Usage:
 *   node scripts/gbp-menu-photo-upload.js
 *
 * CRITICAL — the only reliable upload method on this site:
 *   1. Find the item's name text node, walk up to .closest('.WOHfi'),
 *      click [aria-label="Click to edit menu item"].
 *   2. Click "Select image" — this triggers a NATIVE OS file-picker.
 *      NEVER use page.setInputFiles() — it silently fails on this site.
 *      You must catch the 'filechooser' event and call .setFiles() on it.
 *   3. Screenshot to visually confirm the thumbnail matches the dish name.
 *   4. Click "Save".
 *   5. Periodically reload the menu list page and read the "X items ·
 *      Y photos" counter to confirm photos are actually persisting —
 *      do not trust the "Upload complete" toast alone.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GBP_MENU_URL =
  'https://www.google.com/local/business/18286869062105835212/editprofile/foodmenu?hl=en-GB';
const IMAGES_DIR = 'C:\\Users\\prash\\OneDrive\\Desktop\\menu-images';
const MAPPING_FILE = path.join(IMAGES_DIR, '_mapping.json'); // [{ name, file }] — 120 of 122 live items
const USER_DATA_DIR = path.join(__dirname, '.gbp-chrome-profile'); // persists your login

// Chicken Momos (6 pcs) and Veg Momos (6 pcs) have no real dish photo yet —
// the live site itself still shows a stock Unsplash placeholder for both.
// They're intentionally absent from _mapping.json; skip them until real
// photos exist rather than uploading a stock/generic image to the listing.

async function main() {
  if (!fs.existsSync(MAPPING_FILE)) {
    console.error(`Missing ${MAPPING_FILE} — need a { name, file } list matching menu-images/.`);
    process.exit(1);
  }
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));

  // Persistent context = your Chrome profile/login carries over between runs.
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false, // must be visible — you complete Google login the first time
    viewport: { width: 1400, height: 900 },
  });
  const page = context.pages()[0] || (await context.newPage());

  await page.goto(GBP_MENU_URL, { waitUntil: 'networkidle' });
  console.log('If prompted, sign in to the Google account for this listing, then press Enter in this terminal.');
  await waitForEnter();

  const results = { done: [], skipped: [], failed: [] };

  for (const item of mapping) {
    const imagePath = path.join(IMAGES_DIR, item.file);
    if (!fs.existsSync(imagePath)) {
      console.log(`SKIP (no local file): ${item.name}`);
      results.skipped.push(item.name);
      continue;
    }

    try {
      // 1. Find the item by its visible name, open its edit dialog.
      const nameNode = page.getByText(item.name, { exact: true }).first();
      await nameNode.waitFor({ timeout: 10000 });
      const card = nameNode.locator('xpath=ancestor::*[contains(@class,"WOHfi")][1]');
      await card.locator('[aria-label="Click to edit menu item"]').click();

      // 2. Click "Select image" and catch the native file-chooser event —
      //    setInputFiles() on a hidden <input> silently fails here.
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.getByRole('button', { name: /select image/i }).click(),
      ]);
      await chooser.setFiles(imagePath);

      // 3. Screenshot to visually confirm before saving.
      await page.waitForTimeout(1500);
      const shot = path.join(IMAGES_DIR, `_verify-${item.file}.png`);
      await page.screenshot({ path: shot, fullPage: false });
      console.log(`Verify thumbnail matches "${item.name}": ${shot}`);

      // 4. Save.
      await page.getByRole('button', { name: /^save$/i }).click();
      await page.waitForTimeout(1500);

      console.log(`OK: ${item.name}`);
      results.done.push(item.name);
    } catch (e) {
      console.error(`FAILED: ${item.name} — ${e.message}`);
      results.failed.push({ name: item.name, error: e.message });
      // Close any stray dialog before moving on.
      await page.keyboard.press('Escape').catch(() => {});
    }

    // 6. Periodically reload and check the "X items · Y photos" counter.
    if (results.done.length % 10 === 0) {
      await page.reload({ waitUntil: 'networkidle' });
      const counter = await page.getByText(/items?\s*·\s*\d+\s*photos?/i).first().textContent().catch(() => null);
      console.log(`--- Progress check: ${counter || 'counter not found'} ---`);
    }
  }

  fs.writeFileSync(
    path.join(IMAGES_DIR, '_upload-results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log(`Done. ${results.done.length} uploaded, ${results.skipped.length} skipped, ${results.failed.length} failed.`);
  console.log('See _upload-results.json for the full list.');

  await context.close();
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.pause();
      resolve();
    });
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
