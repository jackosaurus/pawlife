/**
 * Semantic typography tokens — mirrors `theme.extend.fontSize` in
 * `tailwind.config.js`. Use these for the handful of sites that set font
 * sizes inline (i.e. via `style={{ fontSize: ... }}`) instead of NativeWind
 * classes. Anywhere you can use a class, prefer the Tailwind token (e.g.
 * `text-headline`) over importing from this file.
 *
 * Numbers are in pt (== px on iOS at @1x). Keep these in lockstep with
 * `tailwind.config.js`.
 */
export const Typography = {
  display: { fontSize: 30, lineHeight: 36 },
  title: { fontSize: 22, lineHeight: 28 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 17, lineHeight: 24 },
  callout: { fontSize: 16, lineHeight: 22 },
  footnote: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
  buttonSm: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
} as const;

export type TypographyToken = keyof typeof Typography;
