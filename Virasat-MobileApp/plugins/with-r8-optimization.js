const { withAppBuildGradle } = require('expo/config-plugins');

// Expo's template feeds R8 the default "proguard-android.txt", which contains
// -dontoptimize: with minify on, R8 only shrinks and obfuscates. Google Play
// vitals flags that as "R8 optimization disabled". The "-optimize" variant is
// identical minus that flag, so release builds get full R8 optimization.
// https://developer.android.com/google/play/vitals/code-optimization
const FROM = 'getDefaultProguardFile("proguard-android.txt")';
const TO = 'getDefaultProguardFile("proguard-android-optimize.txt")';

module.exports = function withR8Optimization(config) {
  return withAppBuildGradle(config, (mod) => {
    const gradle = mod.modResults.contents;
    if (gradle.includes(TO)) return mod;
    if (!gradle.includes(FROM))
      throw new Error('with-r8-optimization: could not find the default proguard file in app/build.gradle');
    mod.modResults.contents = gradle.replace(FROM, TO);
    return mod;
  });
};
