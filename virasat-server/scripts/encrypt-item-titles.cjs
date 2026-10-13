const { resolve } = require('node:path');
const { Client } = require('pg');

require('dotenv').config({ path: resolve(__dirname, '../.env'), quiet: true });

// Encrypts vault item titles saved before titles were sealed. Uses the built
// EncryptionService (run after `npm run build`) so the envelope matches the API.
// Safe to re-run: sealed titles are skipped. updatedAt is left unchanged.
const SEALED_TITLE_PREFIX = 'enc1:';

async function main() {
  for (const key of ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE']) {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
  }
  const { EncryptionService, encryptionContext } = require('../dist/encryption/encryption.service');
  const encryption = new EncryptionService();
  const seal = (title, vaultId) => {
    const encrypted = encryption.encrypt(Buffer.from(title, 'utf8'), encryptionContext(vaultId, 'title'));
    const envelope = { ...encrypted, ciphertext: encrypted.ciphertext.toString('base64') };
    return SEALED_TITLE_PREFIX + Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64');
  };
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    lock_timeout: 5000,
  });
  try {
    await client.connect();
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT id, "vaultId", title FROM legacy_items WHERE title NOT LIKE '${SEALED_TITLE_PREFIX}%' FOR UPDATE`,
    );
    for (const row of rows) {
      await client.query('UPDATE legacy_items SET title = $1 WHERE id = $2', [seal(row.title, row.vaultId), row.id]);
    }
    await client.query('COMMIT');
    console.log(`Encrypted ${rows.length} vault item title(s).`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Title encryption failed${error.code ? ` (${error.code})` : ''}: ${error.message}`);
  process.exitCode = 1;
});
