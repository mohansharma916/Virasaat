import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// GCM must always verify a full 128-bit tag; shorter tags make forgery cheap.
const AUTH_TAG_BYTES = 16;
const IV_BYTES = 12;
// Envelopes written with associated data record this marker. Older envelopes
// without it were encrypted before records were bound to their context.
export const AAD_VERSION = 1;

/**
 * Binds a ciphertext to where it is stored, so it cannot be decrypted after
 * being copied into another vault or used for a different purpose.
 */
export function encryptionContext(vaultId: string, purpose: string) {
  return `virasat:${vaultId}:${purpose}`;
}

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';

  /**
   * MVP local master key.
   *
   * Production:
   * Replace this with AWS KMS / GCP KMS /
   * Azure Key Vault / HSM.
   */
  private getMasterKey(version: string): Buffer {
    const currentVersion = process.env.ENCRYPTION_MASTER_KEY_VERSION || 'v1';
    let keys: Record<string, string> = {};
    if (process.env.ENCRYPTION_MASTER_KEYS) {
      try {
        const parsed: unknown = JSON.parse(process.env.ENCRYPTION_MASTER_KEYS);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Invalid keyring');
        }
        keys = parsed as Record<string, string>;
      } catch {
        throw new InternalServerErrorException('Encryption keyring is invalid');
      }
    }
    const key = Object.prototype.hasOwnProperty.call(keys, version)
      ? keys[version]
      : version === currentVersion
        ? process.env.ENCRYPTION_MASTER_KEY
        : undefined;

    if (!key) {
      throw new InternalServerErrorException(
        'The required encryption key version is not configured',
      );
    }

    if (typeof key !== 'string') {
      throw new InternalServerErrorException('Encryption keyring is invalid');
    }
    const buffer = Buffer.from(key, 'base64');

    if (buffer.length !== 32) {
      throw new InternalServerErrorException(
        'Encryption master key must be 32 bytes',
      );
    }

    return buffer;
  }

  /**
   * Encrypt data using a random DEK.
   */
  encrypt(data: Buffer, context?: string) {
    const dataEncryptionKey = randomBytes(32);

    const iv = randomBytes(IV_BYTES);

    const aad = context ? Buffer.from(context, 'utf8') : null;

    const cipher = createCipheriv(this.algorithm, dataEncryptionKey, iv, {
      authTagLength: AUTH_TAG_BYTES,
    });
    if (aad) cipher.setAAD(aad);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    const authTag = cipher.getAuthTag();

    /**
     * MVP envelope encryption:
     *
     * Encrypt the DEK using the master key.
     *
     * In production this operation belongs
     * to KMS.
     */
    const keyVersion = process.env.ENCRYPTION_MASTER_KEY_VERSION || 'v1';
    const masterKey = this.getMasterKey(keyVersion);

    const keyIv = randomBytes(IV_BYTES);

    const keyCipher = createCipheriv(this.algorithm, masterKey, keyIv, {
      authTagLength: AUTH_TAG_BYTES,
    });
    if (aad) keyCipher.setAAD(aad);

    const encryptedKey = Buffer.concat([
      keyCipher.update(dataEncryptionKey),
      keyCipher.final(),
    ]);

    const keyAuthTag = keyCipher.getAuthTag();

    return {
      ciphertext: encrypted,

      encryptedDataKey: encryptedKey.toString('base64'),

      keyIv: keyIv.toString('base64'),

      keyAuthTag: keyAuthTag.toString('base64'),

      iv: iv.toString('base64'),

      authTag: authTag.toString('base64'),

      algorithm: this.algorithm,

      keyVersion,

      ...(aad ? { aad: AAD_VERSION } : {}),
    };
  }

  /**
   * Decrypt data.
   */
  decrypt(
    input: {
      ciphertext: Buffer;
      encryptedDataKey: string;
      keyIv: string;
      keyAuthTag: string;
      iv: string;
      authTag: string;
      keyVersion?: string | null;
      aad?: number;
    },
    context?: string,
  ) {
    const keyIv = this.decode(input.keyIv, IV_BYTES);
    const keyAuthTag = this.decode(input.keyAuthTag, AUTH_TAG_BYTES);
    const iv = this.decode(input.iv, IV_BYTES);
    const authTag = this.decode(input.authTag, AUTH_TAG_BYTES);
    // A bound envelope only opens in the context it was written for. Legacy
    // envelopes (no marker) were written without associated data.
    let aad: Buffer | null = null;
    if (input.aad !== undefined && input.aad !== null) {
      if (input.aad !== AAD_VERSION || !context)
        throw new InternalServerErrorException(
          'Encrypted record context is invalid',
        );
      aad = Buffer.from(context, 'utf8');
    }

    // Records written before key versioning use v1. Never try the current key
    // against a historical version: retain the old key until migration finishes.
    const masterKey = this.getMasterKey(input.keyVersion || 'v1');

    /**
     * Recover DEK.
     */
    const keyDecipher = createDecipheriv(this.algorithm, masterKey, keyIv, {
      authTagLength: AUTH_TAG_BYTES,
    });
    if (aad) keyDecipher.setAAD(aad);

    keyDecipher.setAuthTag(keyAuthTag);

    const dataEncryptionKey = Buffer.concat([
      keyDecipher.update(Buffer.from(input.encryptedDataKey, 'base64')),
      keyDecipher.final(),
    ]);

    /**
     * Decrypt actual data.
     */
    const decipher = createDecipheriv(this.algorithm, dataEncryptionKey, iv, {
      authTagLength: AUTH_TAG_BYTES,
    });
    if (aad) decipher.setAAD(aad);

    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(input.ciphertext), decipher.final()]);
  }

  private decode(value: string, bytes: number): Buffer {
    const buffer =
      typeof value === 'string'
        ? Buffer.from(value, 'base64')
        : Buffer.alloc(0);
    if (buffer.length !== bytes)
      throw new InternalServerErrorException('Encrypted record is malformed');
    return buffer;
  }
}
