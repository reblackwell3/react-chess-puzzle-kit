/**
 * Move-list colors for the analysis board sidebar.
 * Tweak values here when iterating on history row striping.
 */
export const analysisSidebarColors = {
  /** Selected move row */
  activeMove: {
    light: 'rgba(119, 177, 212, 1)', // #77b1d4
    dark: 'rgba(90, 159, 190, 1)', // #5a9fbe
  },
  /** Start row */
  start: {
    light: '#e8e8e8',
    dark: '#262626',
  },
  /** Alternating main-line rows (index 0 = darker, 1 = lighter). */
  mainStripe: [
    { light: '#c9c9c9', dark: '#1c1c1c' },
    { light: '#f2f2f2', dark: '#383838' },
  ],
  /** Alternating user-variation rows (index 0 = slightly tinted, 1 = lighter). */
  variationStripe: [
    { light: '#eef5fb', dark: '#2c3540' },
    { light: '#f7fbfe', dark: '#343f4c' },
  ],
} as const;
