const { load } = require('@expo/env');
const { getConfig } = require('@expo/config');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

load(process.cwd(), { silent: true });
const profiles = require('../eas.json').build;
const profile = process.env.EAS_BUILD_PROFILE || 'apk';
const selected = profiles[profile];
if (!selected) throw new Error(`Unknown EAS profile: ${profile}`);
const profileEnv = { ...profiles[selected.extends]?.env, ...selected.env };
const value = key => process.env[key] || profileEnv[key];
const errors = [];
for (const key of ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID']) {
  const local = process.env[key]?.replace(/\/$/, '');
  const cloud = profileEnv[key]?.replace(/\/$/, '');
  if (local && cloud && local !== cloud) errors.push(`${key} differs between the local environment and eas.json. Confirm which value to release and update both.`);
}
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) errors.push('Expo SDK 57 requires Node 22.13 or newer.');
let apiUrl;
try {
  apiUrl = new URL(value('EXPO_PUBLIC_API_URL'));
  if (apiUrl.protocol !== 'https:') errors.push('Release API URL must use HTTPS.');
  if (/^(localhost|127\.|10\.|192\.168\.|0\.0\.0\.0|\[::1\])/.test(apiUrl.hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(apiUrl.hostname)) errors.push('Release API URL must be reachable from user phones, not a local network address.');
  if (apiUrl.username || apiUrl.password) errors.push('Do not embed credentials in the public API URL.');
} catch { errors.push('Set a valid EXPO_PUBLIC_API_URL.'); }
if (!/^\d+-[\w-]+\.apps\.googleusercontent\.com$/.test(value('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID') || '')) errors.push('Set the Google Web OAuth client ID.');
const { exp } = getConfig(process.cwd(), { skipSDKVersionRequirement: true });
if (!exp.android?.package) errors.push('Set expo.android.package in app.json.');
for (const file of [exp.icon, exp.android?.adaptiveIcon?.foregroundImage]) {
  if (file) { try { readFileSync(resolve(file)); } catch { errors.push(`Missing release image: ${file}`); } }
}
if (errors.length) {
  errors.forEach(error => console.error(`FAIL: ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Release configuration checked: ${exp.name} ${exp.version}, ${exp.android.package}, profile ${profile}`);
  console.log(`API: ${apiUrl.origin}`);
  console.log('Cloud builds use eas.json env; local .env overrides must match before building.');
  console.log('Manual: link EAS project, manage release signing key, register its SHA-1 with Google OAuth, and test on a physical device.');
  console.log('Paid checkout is disabled in release until native billing is implemented.');
}
