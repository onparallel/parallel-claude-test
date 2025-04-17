import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Creates a temporary directory that will be automatically cleaned up when the returned object is disposed.
 *
 * @param prefix - Optional prefix for the temporary directory name
 * @returns An AsyncDisposable object containing the path to the temporary directory
 *
 * @example
 * ```
 * // Using with the 'using' statement (requires TypeScript 5.2+)
 * await using dir = await withTempDir();
 * console.log("Temporary directory created at:", dir.path);
 * // Directory will be automatically removed when the block exits
 * ```
 *
 * @example
 * ```
 * // Manual disposal
 * const dir = await withTempDir("my-prefix-");
 * try {
 *   // Use dir.path
 * } finally {
 *   await dir[Symbol.asyncDispose]();
 * }
 * ```
 */
export async function withTempDir(prefix?: string): Promise<AsyncDisposable & { path: string }> {
  const path = await mkdtemp(join(tmpdir(), `parallel-${prefix ?? ""}`));
  return {
    path,
    async [Symbol.asyncDispose]() {
      await rm(path, { recursive: true });
    },
  };
}
