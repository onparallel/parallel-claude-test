import sanitizeFilename from "sanitize-filename";
import truncateUtf8Bytes from "truncate-utf8-bytes";
import { byteLength } from "byte-length";

export function sanitizeFilenameWithSuffix(name: string, suffix: string) {
  const sanitizedName = sanitizeFilename(name);
  const sanitizedSuffix = sanitizeFilename(suffix);
  return truncateUtf8Bytes(sanitizedName, 255 - byteLength(sanitizedSuffix)) + sanitizedSuffix;
}
