require('@expo/env').load(__dirname, { silent: true });

// Reject invalid production endpoints before a release bundle is generated.
module.exports = ({ config }) => {
  if (['apk', 'production'].includes(process.env.EAS_BUILD_PROFILE)) {
    let url;
    try {
      url = new URL(process.env.EXPO_PUBLIC_API_URL || '');
    } catch {
      throw new Error('Release builds require a valid EXPO_PUBLIC_API_URL.');
    }
    if (url.protocol !== 'https:' || /^(localhost|127\.|10\.|192\.168\.|0\.0\.0\.0|\[::1\])/.test(url.hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)) {
      throw new Error('Release builds require a public HTTPS EXPO_PUBLIC_API_URL.');
    }
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      throw new Error('Release builds require EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
    }
  }
  return config;
};
