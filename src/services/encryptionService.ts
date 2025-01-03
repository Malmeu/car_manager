import { Buffer } from 'buffer';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

export interface EncryptedData {
  encrypted: string;  // Base64 encoded encrypted data
  iv: string;        // Base64 encoded initialization vector
  salt: string;      // Base64 encoded salt
}

// Type pour les données avec champs chiffrés
export type EncryptedField<T> = T | EncryptedData;
export type EncryptedObject<T> = {
  [K in keyof T]: EncryptedField<T[K]>;
};

export class EncryptionService {
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Dériver une clé à partir du mot de passe
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Générer la clé finale
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: ALGORITHM,
        length: KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private static generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  }

  private static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  }

  /**
   * Chiffre des données avec un mot de passe
   * @param data Les données à chiffrer
   * @param password Le mot de passe pour le chiffrement
   * @returns Les données chiffrées avec l'IV et le sel
   */
  static async encrypt(data: string, password: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const salt = this.generateSalt();
    const iv = this.generateIV();
    const key = await this.deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      encoder.encode(data)
    );

    return {
      encrypted: Buffer.from(encrypted).toString('base64'),
      iv: Buffer.from(iv).toString('base64'),
      salt: Buffer.from(salt).toString('base64')
    };
  }

  /**
   * Déchiffre des données avec un mot de passe
   * @param encryptedData Les données chiffrées avec l'IV et le sel
   * @param password Le mot de passe pour le déchiffrement
   * @returns Les données déchiffrées
   */
  static async decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    const { encrypted, iv, salt } = encryptedData;

    const encryptedBuffer = Buffer.from(encrypted, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const saltBuffer = Buffer.from(salt, 'base64');

    const key = await this.deriveKey(password, saltBuffer);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: ivBuffer
      },
      key,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Chiffre un objet avec des champs spécifiques à protéger
   * @param data L'objet contenant les données
   * @param fieldsToEncrypt Les champs à chiffrer
   * @param password Le mot de passe pour le chiffrement
   * @returns Une copie de l'objet avec les champs spécifiés chiffrés
   */
  static async encryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToEncrypt: (keyof T)[],
    password: string
  ): Promise<EncryptedObject<T>> {
    const result = { ...data } as EncryptedObject<T>;

    for (const field of fieldsToEncrypt) {
      if (result[field]) {
        const valueToEncrypt = typeof result[field] === 'string'
          ? result[field] as string
          : JSON.stringify(result[field]);
          
        result[field] = await this.encrypt(valueToEncrypt, password);
      }
    }

    return result;
  }

  /**
   * Déchiffre un objet avec des champs chiffrés
   * @param data L'objet contenant les données chiffrées
   * @param fieldsToDecrypt Les champs à déchiffrer
   * @param password Le mot de passe pour le déchiffrement
   * @returns Une copie de l'objet avec les champs spécifiés déchiffrés
   */
  static async decryptFields<T extends Record<string, any>>(
    data: EncryptedObject<T>,
    fieldsToDecrypt: (keyof T)[],
    password: string
  ): Promise<T> {
    const result = { ...data } as T;

    for (const field of fieldsToDecrypt) {
      if (result[field] && this.isEncryptedData(result[field])) {
        try {
          const decrypted = await this.decrypt(result[field] as EncryptedData, password);
          result[field] = this.isJsonString(decrypted)
            ? JSON.parse(decrypted)
            : decrypted;
        } catch (error) {
          console.error(`Erreur lors du déchiffrement du champ ${String(field)}:`, error);
          throw new Error(`Impossible de déchiffrer le champ ${String(field)}`);
        }
      }
    }

    return result;
  }

  private static isJsonString(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  private static isEncryptedData(data: any): data is EncryptedData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'encrypted' in data &&
      'iv' in data &&
      'salt' in data
    );
  }
}
