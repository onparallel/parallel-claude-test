/**
 * Format bytes to display original value with converted units in parentheses
 * Example: 1536000B (1.5MB), 5120B (5KB)
 */
export function formatBytes(bytes: number, threshold: number = 1024): string {
  if (bytes < threshold) {
    return `${bytes}B`;
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formattedSize = unitIndex === 0 ? size.toString() : size.toFixed(1);
  const convertedUnit = `${formattedSize}${units[unitIndex]}`;

  return `${bytes}B (${convertedUnit})`;
}
