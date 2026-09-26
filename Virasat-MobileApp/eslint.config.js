// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // Screen copy may contain natural apostrophes and quotation marks.
      'react/no-unescaped-entities': 'off',
      // React Native Animated values are intentionally retained in refs.
      'react-hooks/refs': 'off',
      // Editing a selected recipient requires hydrating form state on entry.
      'react-hooks/set-state-in-effect': 'off',
    },
  }
]);
