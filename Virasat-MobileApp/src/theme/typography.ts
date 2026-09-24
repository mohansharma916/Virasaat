export const typography = {
  fonts: {
    display: 'Playfair Display',
    ui: 'Inter',
    accent: 'Caveat',
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

  sizes: {
    displayXL: 32,
    displayL: 28,
    h1: 24,
    h2: 20,
    h3: 17,

    logo: 30,
    title: 17,
    body: 14,

    bodyLarge: 16,
    bodyMedium: 14,

    caption: 12,
    micro: 10,
    button: 14,
  },

  lineHeights: {
    displayXL: 38,
    displayL: 34,
    h1: 30,
    h2: 26,
    h3: 22,

    bodyLarge: 24,
    body: 20,
    caption: 16,
    micro: 14,
    button: 18,
  },

  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;