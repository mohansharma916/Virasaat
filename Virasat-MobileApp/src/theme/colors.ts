// Every text/background pair below meets WCAG AA (4.5:1 for text, 3:1 for
// control outlines). Check contrast before adding a new pair.
export const colors = {
  primary: {
    forest: '#0B5D4B',
    deepForest: '#063F34',
    forestDark: '#0A463A',
  },

  brand: {
    sage: '#DCEBE5',
    mint: '#EAF4F0',
    ivory: '#F8F5EA',
  },

  neutral: {
    white: '#FFFFFF',
    black: '#111111',
    textPrimary: '#14231F',
    textSecondary: '#4A5753',
    // Captions, placeholders and helper text (5.1:1 on ivory).
    textMuted: '#5E6B67',
    // Decorative edges only (cards, dividers).
    border: '#D7E1DD',
    // Outlines of inputs, checkboxes and radios (>= 3:1 on white and ivory).
    control: '#788B85',
    sunken: '#F1EEE2',
  },

  state: {
    disabledFill: '#E4E8E6',
    disabledText: '#55625E',
  },

  semantic: {
    success: '#1E7A46',
    successSoft: '#E6F4EC',

    warning: '#8A5300',
    warningSoft: '#FFF3DC',
    warningBorder: '#F2CF8A',

    error: '#B42318',
    errorSoft: '#FDECEA',
    errorBorder: '#F4B4AE',

    info: '#2F56A8',
    infoSoft: '#EAF0FC',
  },
} as const;

// Dark palette with the same roles. The app is locked to light mode
// (app.json userInterfaceStyle) until screens read colours from a theme hook.
export const darkColors = {
  background: '#0E1614',
  card: '#16211E',
  sunken: '#0A100F',
  textPrimary: '#EAF1EE',
  textSecondary: '#B4C2BD',
  textMuted: '#8D9C97',
  primary: '#7FD1B6',
  primaryStrong: '#9EDFC8',
  onPrimaryStrong: '#05302A',
  primaryContainer: '#1F3A33',
  control: '#5C6E68',
} as const;
