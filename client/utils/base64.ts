export function toBase64(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value).toString("base64");
  } else {
    // https://web.dev/articles/base64-encoding
    return window.btoa(String.fromCodePoint(...Array.from(new TextEncoder().encode(value))));
  }
}

export function fromBase64(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "base64").toString();
  } else {
    // https://web.dev/articles/base64-encoding
    return new TextDecoder().decode(Uint8Array.from(atob(value), (m) => m.codePointAt(0)!));
  }
}
