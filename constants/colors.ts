export const Colors = {
  // Background
  background: '#FFF8E7',

  // Primary
  primary: '#4A2157',
  primaryPressed: '#341539',

  // Dusty plum — softer purple for large background blocks (welcome / sign-in /
  // sign-up). Keep `primary` reserved for saturated accents (CTAs, icon tints,
  // headlines). See palette expansion in design system doc.
  dustyPlum: '#6B4577',

  // Brand yellow (matches the app icon background `#FDC602`). Used for the
  // primary CTA on the auth screens and the welcome hero placeholder.
  brandYellow: '#FDC602',
  brandYellowPressed: '#E5B202',

  // Accent (brand coral — warm highlights, illustrations, "due soon" warmth)
  accent: '#E8735A',

  // Coral — warm accent for delight moments (success toasts, "good job",
  // celebratory micro-interactions). A touch warmer than `accent`; the two may
  // diverge further as the system grows. Kept distinct so call sites can opt
  // into "delight" without inheriting "due soon" semantics.
  coral: '#E8806A',

  // Sage — health-positive accent for vaccinations on track, weight stability,
  // "all good" confirmations. Verified distinct from `statusGreen` (#5BA67C):
  // sage is dustier and reads as "calm OK" vs. statusGreen's "active green".
  sage: '#8FA68A',

  // Destructive (delete buttons, irreversible modal accents)
  // NOTE: must never share a hex with `accent` or `statusOverdue`. They cover
  // distinct semantic intents: coral = brand warmth + overdue status,
  // destructive red = delete actions and the destructive/irreversible
  // severity tiers of `ConfirmationModal`.
  destructive: '#E5484D',

  // Surfaces
  card: '#FFFFFF',

  // Text
  textPrimary: '#2D2A26',
  textSecondary: '#7A756E',

  // Status
  statusGreen: '#5BA67C',
  statusAmber: '#E5A84B',
  statusOverdue: '#E8735A',
  statusNeutral: '#9CA3AF',

  // Input
  inputFill: '#F5F3F0',

  // Borders
  border: '#EDE8DF',
} as const;
