import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the download link points at the Virasat Play Store listing', () => {
  assert.match(read('src/lib/links.ts'), /'https:\/\/play\.google\.com\/store\/apps\/details\?id=in\.virasat\.app'/);
});

test('no page or component still offers the removed waitlist', () => {
  const dir = new URL('../src/components/', import.meta.url);
  for (const file of readdirSync(dir)) {
    const source = readFileSync(new URL(file, dir), 'utf8');
    assert.doesNotMatch(source, /waitlist/i, `${file} still mentions the waitlist`);
  }
  assert.doesNotMatch(read('src/app/layout.tsx'), /waitlist/i);
});

test('download links open the store safely in a new tab', () => {
  const dir = new URL('../src/components/', import.meta.url);
  for (const file of readdirSync(dir)) {
    const source = readFileSync(new URL(file, dir), 'utf8');
    for (const match of source.matchAll(/href=\{PLAY_STORE_URL\}([\s\S]*?)>/g)) {
      assert.match(match[1], /rel="noopener noreferrer"/, `${file} link is missing rel`);
    }
  }
});
