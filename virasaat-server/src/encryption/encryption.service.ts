import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm =
    'aes-256-gcm';

  /**
   * MVP local master key.
   *
   * Production:
   * Replace this with AWS KMS / GCP KMS /
   * Azure Key Vault / HSM.
   */
  private getMasterKey(): Buffer {
    const key =
      process.env.ENCRYPTION_MASTER_KEY;

    if (!key) {
      throw new InternalServerErrorException(
        'Encryption master key is not configured',
      );
    }

    const buffer = Buffer.from(
      key,
      'base64',
    );

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
  encrypt(data: Buffer) {
    const dataEncryptionKey =
      randomBytes(32);

    const iv = randomBytes(12);

    const cipher = createCipheriv(
      this.algorithm,
      dataEncryptionKey,
      iv,
    );

    const encrypted =
      Buffer.concat([
        cipher.update(data),
        cipher.final(),
      ]);

    const authTag =
      cipher.getAuthTag();

    /**
     * MVP envelope encryption:
     *
     * Encrypt the DEK using the master key.
     *
     * In production this operation belongs
     * to KMS.
     */
    const masterKey =
      this.getMasterKey();

    const keyIv = randomBytes(12);

    const keyCipher =
      createCipheriv(
        this.algorithm,
        masterKey,
        keyIv,
      );

    const encryptedKey =
      Buffer.concat([
        keyCipher.update(
          dataEncryptionKey,
        ),
        keyCipher.final(),
      ]);

    const keyAuthTag =
      keyCipher.getAuthTag();

    return {
      ciphertext: encrypted,

      encryptedDataKey:
        encryptedKey.toString('base64'),

      keyIv:
        keyIv.toString('base64'),

      keyAuthTag:
        keyAuthTag.toString('base64'),

      iv:
        iv.toString('base64'),

      authTag:
        authTag.toString('base64'),

      algorithm: this.algorithm,

      keyVersion: 'v1',
    };
  }

  /**
   * Decrypt data.
   */
  decrypt(input: {
    ciphertext: Buffer;
    encryptedDataKey: string;
    keyIv: string;
    keyAuthTag: string;
    iv: string;
    authTag: string;
  }) {
    const masterKey =
      this.getMasterKey();

    /**
     * Recover DEK.
     */
    const keyDecipher =
      createDecipheriv(
        this.algorithm,
        masterKey,
        Buffer.from(
          input.keyIv,
          'base64',
        ),
      );

    keyDecipher.setAuthTag(
      Buffer.from(
        input.keyAuthTag,
        'base64',
      ),
    );

    const dataEncryptionKey =
      Buffer.concat([
        keyDecipher.update(
          Buffer.from(
            input.encryptedDataKey,
            'base64',
          ),
        ),
        keyDecipher.final(),
      ]);

    /**
     * Decrypt actual data.
     */
    const decipher =
      createDecipheriv(
        this.algorithm,
        dataEncryptionKey,
        Buffer.from(
          input.iv,
          'base64',
        ),
      );

    decipher.setAuthTag(
      Buffer.from(
        input.authTag,
        'base64',
      ),
    );

    return Buffer.concat([
      decipher.update(
        input.ciphertext,
      ),
      decipher.final(),
    ]);
  }
}