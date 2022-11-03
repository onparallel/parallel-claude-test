import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  .split("")
  .filter((c) => !"il10O".includes(c)); // avoid ambiguous characters
const ALPHABET_MAP = Object.fromEntries(ALPHABET.map((c, i) => [c, i]));

export function encode(buffer: Buffer) {
  if (buffer.length === 0) {
    return "";
  }
  const digits = [0];
  let i = 0;
  while (i < buffer.length) {
    let j = 0;
    while (j < digits.length) {
      digits[j] <<= 8;
      j++;
    }
    digits[0] += buffer[i];
    let carry = 0;
    j = 0;
    while (j < digits.length) {
      digits[j] += carry;
      carry = (digits[j] / ALPHABET.length) | 0;
      digits[j] %= ALPHABET.length;
      ++j;
    }
    while (carry) {
      digits.push(carry % ALPHABET.length);
      carry = (carry / ALPHABET.length) | 0;
    }
    i++;
  }
  i = 0;
  while (buffer[i] === 0 && i < buffer.length - 1) {
    digits.push(0);
    i++;
  }
  return digits
    .reverse()
    .map((d) => ALPHABET[d])
    .join("");
}

export function decode(value: string) {
  if (value.length === 0) {
    return new Buffer(0);
  }
  const bytes = [0];
  let i = 0;
  while (i < value.length) {
    const c = value[i];
    if (!(c in ALPHABET_MAP)) {
      throw new Error(
        `decode received unacceptable input. Character '${c}' is not in the alphabet.`
      );
    }
    let j = 0;
    while (j < bytes.length) {
      bytes[j] *= ALPHABET.length;
      j++;
    }
    bytes[0] += ALPHABET_MAP[c];
    let carry = 0;
    j = 0;
    while (j < bytes.length) {
      bytes[j] += carry;
      carry = bytes[j] >> 8;
      bytes[j] &= 0xff;
      ++j;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
    i++;
  }
  i = 0;
  while (value[i] === "1" && i < value.length - 1) {
    bytes.push(0);
    i++;
  }
  return Buffer.from(bytes.reverse());
}

export function random(length: number) {
  const buffer = randomBytes(length);
  return encode(buffer);
}

export async function hash(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, key) => {
      if (err) {
        reject(err);
      } else {
        resolve(key.toString("hex"));
      }
    });
  });
}

export function encrypt(value: string, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const bufferLength = Buffer.alloc(1);
  bufferLength.writeUInt8(iv.length, 0);

  return Buffer.concat([bufferLength, iv, authTag, encrypted]);
}

export function decrypt(value: Buffer, key: Buffer) {
  const ivSize = value.readUInt8(0);
  const iv = value.subarray(1, ivSize + 1);
  // The authTag is by default 16 bytes in AES-GCM
  const authTag = value.subarray(ivSize + 1, ivSize + 17);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(value.subarray(ivSize + 17)), decipher.final()]);
}
