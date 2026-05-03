# Bemy — App Store Screenshot Generator

A single-page Next.js app that renders the six locked App Store screenshots for Bemy (iPhone, English) and exports them at every required Apple resolution.

The visual spec is in `docs/bemy-app-store-screenshots.md` (project root). This tool implements it. If anything here disagrees with the spec, the spec wins.

## Run the dev server

```bash
cd marketing/app-store-screenshots
npm install --legacy-peer-deps
npm run dev
```

Then open `http://localhost:3000`. You'll see the six frames stacked. Frames 2–5 will show "Drop: 02-meet.png" placeholders until the captures land.

## Drop your captures

Save the four real-app captures into `public/screenshots/en/` with these exact filenames:

- `02-meet.png` — About page top: cat+dog illustration, Bemy wordmark, tagline, "Hi, I'm Jack" intro visible
- `03-dashboard.png` — Dashboard with Beau + Remy + 1 "needs attention" item
- `04-pet-detail.png` — Beau's pet detail Profile tab (about + allergies + insurance)
- `05-medications.png` — Remy's medications list with Heartworm "Due today" + Log Dose pill

Capture at the iOS simulator's iPhone 16 Pro Max device target (1290×2796 native resolution). They must be flattened RGB PNGs (Apple rejects RGBA). If a capture has transparency, run it through Preview → Export → PNG (uncheck "Alpha"), or:

```bash
sips -s format png --setProperty hasAlpha no path/to/capture.png --out path/to/capture.png
```

The generator overlays a white status bar (top) and home indicator (bottom) inside the device screen automatically — capture the full screen, including those regions, and the overlay handles the blanking.

## Export

In the toolbar at the top of the page:

1. Pick an export size from the dropdown (6.9" is the default — design size).
2. Click **Export All**.

Six PNGs land in your Downloads folder, named `01-hero-en-1320x2868.png`, `02-meet-en-1320x2868.png`, etc. Repeat for each export size you need (Apple requires 6.9", 6.5", 6.3", 6.1").

## Notes

- The page uses `html-to-image` with the double-call trick from `.claude/skills/app-store-screenshots/SKILL.md`.
- All images are preloaded as base64 data URIs at page load — fixes the html-to-image race-condition issue where some images render blank in the export.
- Frames 1 and 6 are custom in-device composites (no real screenshot). Frames 2–5 wrap a real PNG capture in the iPhone bezel.
