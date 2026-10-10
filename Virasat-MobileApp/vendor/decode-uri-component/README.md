This is the published MIT-licensed decode-uri-component 0.5.0 source. Only its `export default` is changed to `module.exports` so Expo Router 57's query-string 7 can call it as a CommonJS function.

The upstream 0.5.0 fixes GHSA-vcc3-ghjq-m6fr using bounded UTF-8 decoding. The original license is included. The npm override resolves to this directory, so clean installs use the patched code too.

Remove this compatibility copy when a supported Expo Router release accepts upstream 0.5.0 directly. Update it from the published package when upstream releases a newer fix; do not edit its decoder algorithm locally.
