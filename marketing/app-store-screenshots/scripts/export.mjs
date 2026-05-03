import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const URL = process.env.URL ?? "http://localhost:3000";
const OUT = resolve(process.cwd(), "exports");
const SIZES = [
  { label: '6.9"', w: 1320, h: 2868 },
  { label: '6.5"', w: 1284, h: 2778 },
  { label: '6.3"', w: 1206, h: 2622 },
  { label: '6.1"', w: 1125, h: 2436 },
];
const FRAMES_PER_SIZE = 6;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1600, height: 1200 },
  acceptDownloads: true,
});
const page = await context.newPage();

console.log(`-> opening ${URL}`);
await page.goto(URL, { waitUntil: "networkidle" });

await page.waitForFunction(
  () => !document.body.innerText.includes("Loading images"),
  { timeout: 60_000 },
);
console.log("-> page ready");

await page.evaluate(async () => {
  await document.fonts.ready;
});
console.log("-> fonts ready");

for (let i = 0; i < SIZES.length; i++) {
  const size = SIZES[i];
  console.log(`\n=== size ${size.label} (${size.w}×${size.h}) ===`);

  await page.selectOption('select[value], select', { index: i });
  await page.waitForTimeout(250);

  const downloads = [];
  const onDownload = (dl) => downloads.push(dl);
  page.on("download", onDownload);

  await page.getByRole("button", { name: /export all/i }).click();
  console.log("   clicked Export All");

  const deadline = Date.now() + 240_000;
  while (downloads.length < FRAMES_PER_SIZE) {
    if (Date.now() > deadline) {
      throw new Error(
        `timed out waiting for downloads (got ${downloads.length}/${FRAMES_PER_SIZE})`,
      );
    }
    await page.waitForTimeout(250);
  }
  page.off("download", onDownload);

  for (const dl of downloads) {
    const filename = dl.suggestedFilename();
    const dest = resolve(OUT, filename);
    await dl.saveAs(dest);
    console.log(`   saved ${filename}`);
  }

  await page.waitForFunction(
    () => !document.body.innerText.match(/Exporting…/),
    { timeout: 60_000 },
  );
}

await browser.close();
console.log(`\nAll exports written to ${OUT}`);
