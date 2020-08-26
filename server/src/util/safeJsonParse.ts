import { Maybe } from "./types";

export function safeJsonParse(value: Maybe<string>) {
  try {
    return value !== null ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
