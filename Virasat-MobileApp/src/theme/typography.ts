export const typography = {
  fonts: {
    inter: {
      regular: 'InterRegular',
      medium: 'InterMedium',
      semiBold: 'InterSemiBold',
      bold: 'InterBold',
    },
    playfair: {
      regular: 'PlayfairRegular',
      semiBold: 'PlayfairSemiBold',
      bold: 'PlayfairBold',
    },
  },

  // Nothing in the app may be smaller than `micro` (12).
  sizes: {
    display: 34,
    title1: 28,
    title2: 22,
    title3: 18,
    body: 16,
    callout: 15,
    label: 14,
    caption: 13,
    micro: 12,
  },

  lineHeights: {
    display: 40,
    title1: 34,
    title2: 28,
    title3: 24,
    body: 24,
    callout: 22,
    label: 20,
    caption: 18,
    micro: 16,
  },

  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;
