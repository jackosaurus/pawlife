/**
 * Semantic typography tokens — mirrors `theme.extend.fontSize` in
 * `tailwind.config.js`. Use these for the handful of sites that set font
 * sizes inline (i.e. via `style={{ fontSize: ... }}`) instead of NativeWind
 * classes. Anywhere you can use a class, prefer the Tailwind token (e.g.
 * `text-headline`) over importing from this file.
 *
 * Numbers are in pt (== px on iOS at @1x). Keep these in lockstep with
 * `tailwind.config.js`.
 *
 * 10-token semantic scale (Phase 2). See `docs/bemy-design-system.md`
 * Typography section for the role of each token.
 */
export const Typography = {
  display: { fontSize: 36, lineHeight: 40, fontWeight: '700' as const },
  largeTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const },
  title: { fontSize: 22, lineHeight: 28 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 17, lineHeight: 24 },
  callout: { fontSize: 16, lineHeight: 22 },
  footnote: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
  buttonSm: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
  eyebrow: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
} as const;

export type TypographyToken = keyof typeof Typography;
