/**
 * Viewport bands for responsive analysis modal layout.
 */

export const VIEWPORT = {
  mobileMax: 767,
  tabletPortraitMin: 768,
  tabletPortraitMax: 1023,
  tabletLandscapeMin: 1024,
  tabletLandscapeMax: 1365,
  desktopMin: 1366,
  wideDesktopMin: 1920,
  ultraWideMin: 2560,
} as const;

export const MUI_BREAKPOINT_VALUES = {
  xs: 0,
  sm: VIEWPORT.tabletPortraitMin,
  md: VIEWPORT.tabletLandscapeMin,
  lg: VIEWPORT.desktopMin,
  xl: 1536,
  xxl: VIEWPORT.wideDesktopMin,
  xxxl: VIEWPORT.ultraWideMin,
} as const;
