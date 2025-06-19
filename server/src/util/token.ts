import { randomBytes, scrypt } from "crypto";

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
    return Buffer.alloc(0);
  }
  const bytes = [0];
  let i = 0;
  while (i < value.length) {
    const c = value[i];
    if (!(c in ALPHABET_MAP)) {
      throw new Error(
        `decode received unacceptable input. Character '${c}' is not in the alphabet.`,
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

export function hashString(value: string) {
  // This is the hash from JVM
  // The hash code for a string is computed as
  // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
  // where s[i] is the ith character of the string and n is the length of
  // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
  // (exclusive) by dropping high bits.
  let hashed = 0;
  for (let ii = 0; ii < value.length; ii++) {
    hashed = (31 * hashed + value.charCodeAt(ii)) | 0;
  }
  return smi(hashed);
}

// v8 has an optimization for storing 31-bit signed numbers.
// Values which have either 00 or 11 as the high order bits qualify.
// This function drops the highest order bit in a signed number, maintaining
// the sign bit.
function smi(i32: number) {
  return ((i32 >>> 1) & 0x40000000) | (i32 & 0xbfffffff);
}
