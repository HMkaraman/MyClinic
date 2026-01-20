import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

const scryptAsync = promisify(scrypt);

export class EncryptionUtil {
  private static getEncryptionKey(): string {
    const key = process.env.INTEGRATION_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('INTEGRATION_ENCRYPTION_KEY environment variable is not set');
    }
    if (key.length < 32) {
      throw new Error('INTEGRATION_ENCRYPTION_KEY must be at least 32 characters');
    }
    return key;
  }

  static async encrypt(plaintext: string): Promise<string> {
    const masterKey = this.getEncryptionKey();
    const salt = randomBytes(SALT_LENGTH);
    const key = (await scryptAsync(masterKey, salt, KEY_LENGTH)) as Buffer;
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Combine salt + iv + authTag + encrypted
    const result = Buffer.concat([salt, iv, authTag, encrypted]);
    return result.toString('base64');
  }

  static async decrypt(encryptedText: string): Promise<string> {
    const masterKey = this.getEncryptionKey();
    const buffer = Buffer.from(encryptedText, 'base64');

    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
    );
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    const key = (await scryptAsync(masterKey, salt, KEY_LENGTH)) as Buffer;

    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  static async encryptCredentials(credentials: Record<string, any>): Promise<string> {
    const json = JSON.stringify(credentials);
    return this.encrypt(json);
  }

  static async decryptCredentials(encryptedCredentials: string): Promise<Record<string, any>> {
    const json = await this.decrypt(encryptedCredentials);
    return JSON.parse(json);
  }
}
