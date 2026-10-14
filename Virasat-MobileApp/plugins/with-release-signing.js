const { withAppBuildGradle } = require('expo/config-plugins');

// Signs local release builds (bundleRelease / assembleRelease) with the Play
// upload key. Credentials live outside the repository, in a properties file
// named by VIRASAT_UPLOAD_KEYSTORE_PROPERTIES, or by default in the git-ignored
// play-store-release/keystore folder next to this project:
//
//   storeFile=/absolute/path/to/virasat-upload.jks
//   storePassword=...
//   keyAlias=virasat-upload
//   keyPassword=...
//
// Without that file, release builds keep Expo's debug signing, which Google
// Play rejects, so an unsigned bundle can never be uploaded by mistake.
const MARKER = '// virasat-release-signing';

const SIGNING_BLOCK = `
${MARKER}
def virasatSigningFile = file(System.getenv("VIRASAT_UPLOAD_KEYSTORE_PROPERTIES") ?: "\${rootDir}/../../play-store-release/keystore/keystore.properties")
def virasatSigning = new Properties()
if (virasatSigningFile.exists()) {
    virasatSigningFile.withInputStream { virasatSigning.load(it) }
}
`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;
    if (gradle.includes(MARKER)) return mod;

    gradle = gradle.replace(/^android \{/m, `${SIGNING_BLOCK}\nandroid {`);
    gradle = gradle.replace(
      /signingConfigs \{\n(\s*)debug \{/,
      (match, indent) =>
        `signingConfigs {\n${indent}if (virasatSigning['storeFile']) {\n${indent}    release {\n${indent}        storeFile file(virasatSigning['storeFile'])\n${indent}        storePassword virasatSigning['storePassword']\n${indent}        keyAlias virasatSigning['keyAlias']\n${indent}        keyPassword virasatSigning['keyPassword']\n${indent}    }\n${indent}}\n${indent}debug {`,
    );
    gradle = gradle.replace(
      /(release \{[^{}]*?)signingConfig signingConfigs\.debug/,
      `$1signingConfig virasatSigning['storeFile'] ? signingConfigs.release : signingConfigs.debug`,
    );
    if (!gradle.includes("signingConfigs.release : signingConfigs.debug"))
      throw new Error('with-release-signing: could not find the release buildType in app/build.gradle');
    mod.modResults.contents = gradle;
    return mod;
  });
};
