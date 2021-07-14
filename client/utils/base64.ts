export function toBase64(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value).toString("base64");
  } else {
    return window.btoa(value);
  }
}

export function fromBase64(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "base64").toString();
  } else {
    return window.atob(value);
  }
}
