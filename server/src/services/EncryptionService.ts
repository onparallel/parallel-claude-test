import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";

export const ENCRYPTION_SERVICE = Symbol.for("ENCRYPTION_SERVICE");

export interface IEncryptionService {
  encrypt(value: string, outputEncoding?: BufferEncoding): string;
  decrypt(value: Buffer, outputEncoding?: BufferEncoding): string;
}

@injectable()
export class EncryptionService implements IEncryptionService {
  constructor(@inject(CONFIG) private config: Pick<Config, "security">) {}

  encrypt(value: string, outputEncoding?: BufferEncoding) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      "aes-256-gcm",
      Buffer.from(this.config.security.encryptKeyBase64, "base64"),
      iv
    );
    const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const bufferLength = Buffer.alloc(1);
    bufferLength.writeUInt8(iv.length, 0);

    return Buffer.concat([bufferLength, iv, authTag, encrypted]).toString(outputEncoding);
  }

  decrypt(value: Buffer, outputEncoding?: BufferEncoding) {
    const ivSize = value.readUInt8(0);
    const iv = value.subarray(1, ivSize + 1);
    // The authTag is by default 16 bytes in AES-GCM
    const authTag = value.subarray(ivSize + 1, ivSize + 17);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      Buffer.from(this.config.security.encryptKeyBase64, "base64"),
      iv
    );
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(value.subarray(ivSize + 17)), decipher.final()]).toString(
      outputEncoding
    );
  }
}
