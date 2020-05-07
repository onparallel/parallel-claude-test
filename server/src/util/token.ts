import { randomBytes } from "crypto";

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
      throw `decode received unacceptable input. Character '${c}' is not in the alphabet.`;
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
