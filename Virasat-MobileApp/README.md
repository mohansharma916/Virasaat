# Virasat mobile app

Expo SDK 57 Android/iOS application.

For the signed Android APK and Google Play build process, see [APK_RELEASE.md](./APK_RELEASE.md).

```sh
npm ci
npm start
```

Release checks and builds:

```sh
npm run typecheck
npm run lint
npm run release:check
npm run build:apk
# Google Play artifact:
npm run build:aab
```

The build commands require an Expo account, a linked EAS project, and release signing credentials. Native Google sign-in requires a development/native build; Expo Go does not include that native module.
