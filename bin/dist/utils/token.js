"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.token = exports.encode = void 0;
const crypto_1 = require("crypto");
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function encode(buffer) {
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
exports.encode = encode;
function token(length) {
    const buffer = (0, crypto_1.randomBytes)(length);
    return encode(buffer);
}
exports.token = token;
