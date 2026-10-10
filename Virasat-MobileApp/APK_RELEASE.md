# Virasat Android release

This project has two EAS build profiles:

| Command | Artifact | Use |
| --- | --- | --- |
| `npm run build:apk` | Signed release APK | Install directly on Android phones |
| `npm run build:aab` | Signed Android App Bundle | Upload to Google Play Console |

Both profiles bundle JavaScript into the app; users do not need Metro or Expo Go.
The release API is `https://api.status410.com`. Public configuration is in
`eas.json`; `.env` is used for local development and is excluded from EAS uploads.
These public values are included in the binary. Never put database passwords,
AWS credentials, JWT secrets, or Google client secrets in the mobile app.

## One-time manual setup

1. Install Node 22.13 or newer and open a terminal in `Virasat-MobileApp`.
2. Run `npm ci` and `npx eas-cli@latest login` with the Expo account that should own the app.
3. The permanent Android package in `app.json` is configured as
   `com.virasat.app` (matching iOS bundle identifier `com.virasat.app`).
   Ensure your Google Cloud Console Android OAuth client uses this exact package name
   along with your release keystore's SHA-1 fingerprint.
4. Run `npx eas-cli@latest init` to create/link the EAS project. It writes the
   account-specific project ID to the app configuration. Do not invent this ID.
5. Confirm `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the
   production profile in `eas.json`. The Web client ID must match the server's
   `GOOGLE_CLIENT_ID`. Keep local `.env` consistent when checking release settings.
6. Run `npx eas-cli@latest credentials --platform android`. Choose the release
   profile, then generate an Android keystore for a NEW app or supply the EXISTING
   release keystore for an app already distributed. Download and securely back up
   the keystore, alias, and passwords. Reuse that signing identity for every APK
   update; otherwise Android will refuse to update existing installs.
7. In Google Cloud Console, configure an Android OAuth client for the exact
   package name and the release keystore's SHA-1 fingerprint. EAS credentials
   displays the fingerprint. Keep the Web OAuth client ID in the app; the Android
   OAuth client is configured in Google Cloud, not substituted for that Web ID.
   Complete consent-screen/test-user setup as needed. For Google Play builds,
   also register the Play App Signing SHA-1 from Play Console because Play can
   sign distributed builds with a different certificate.

EAS cloud builds do not require Android Studio, a local JDK, or a local Android SDK.
The existing `android/` and `ios/` directories are excluded from the EAS upload,
so EAS generates native projects from app.json and applies its managed signing
credentials. Existing ignored native edits are not part of this cloud workflow.
Do not distribute the existing local `app-debug.apk`, or use raw
`./gradlew assembleRelease` as the final workflow: the currently generated local
Gradle configuration still uses the debug keystore for release. EAS manages the
release signing described above.

## Build the installable APK

```sh
cd /Users/user/Documents/VIRASAAT_IDEA/Virasat-MobileApp
npm ci
npm run typecheck
npm run lint
npm run release:check
npm run build:apk
```

Wait for EAS to finish. Open the build URL printed by the command and download
the `.apk` artifact. Transfer it to your phone and permit installation from that
source when Android prompts. Alternatively, install over USB with
`adb install -r /path/to/virasat.apk`. If an older debug build uses the same
package with a different certificate, use a clean test device or uninstall that
debug build before installing the signed release (uninstalling removes its data).

EAS increments the Android version code using remote version management.
Keep the same package and keystore for subsequent releases; update the visible
`expo.version` in app.json when the user-facing version changes.

## Google Play

Run `npm run build:aab`, download the `.aab`, and upload it to a Play Console
internal testing track first. Google Play needs an App Bundle, not the APK profile.
Complete the store listing, privacy policy, Data safety declarations, content
rating, and any account-specific testing requirements in Play Console before
requesting production release. Play submission is a separate manual action.

## Required device checks before distribution

- Launch without Metro running; close and reopen the app.
- Register, receive an email OTP, verify, log in, log out, and reset a password.
- Google sign-in with the release certificate registered above.
- Secure session persistence, biometric unlock, and permissions denied/allowed.
- Vault document/photo uploads, camera/audio video recording and downloads.
- Recipient setup, check-in, and release-policy screens with a test account.
- Slow/offline networks and unavailable API: verify understandable errors.

## Known limits and verification

TypeScript and lint initially passed (lint had existing unused-variable warnings).
The Android production bundle is checked during preparation; this is not a
native APK compilation or a physical-device test. No Expo project/account or
release signing key has been linked during preparation, so no final signed APK
has been produced yet.

Developer navigator buttons and its direct route are disabled in release.
Paid purchase checkout previously generated simulated tokens instead of using
Google Play Billing. Release checkout now stops with an unavailable message;
Starter remains available. Native billing and authoritative server-side store
verification must be implemented before launching paid subscriptions.

A production API health request from this machine timed out during preparation.
Confirm the deployed HTTPS API is accessible on a phone before building the
final release. A local Docker server or an image in ECR does not by itself deploy
that public API. Earlier Docker verification also found an S3 bucket-access 403;
resolve and test actual uploads on the deployed backend before distribution.

References: [Expo APK builds](https://docs.expo.dev/build-reference/apk/),
[Expo signing credentials](https://docs.expo.dev/app-signing/app-credentials/),
[Expo EAS environments](https://docs.expo.dev/eas/environment-variables/),
[Google Sign-In Android setup](https://react-native-google-signin.github.io/docs/setting-up/android).
