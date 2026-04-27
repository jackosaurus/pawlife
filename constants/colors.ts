export const Colors = {
  // Background
  background: '#FFF8E7',

  // Primary
  primary: '#4A2157',
  primaryPressed: '#341539',

  // Accent (brand coral — warm highlights, illustrations, "due soon" warmth)
  accent: '#E8735A',

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
