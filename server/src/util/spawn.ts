import { spawn as _spawn, SpawnOptions } from "child_process";

export async function spawn(command: string, args: readonly string[], options: SpawnOptions) {
  return await new Promise<void>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const child = _spawn(command, args, options)
      .on("error", reject)
      .on("close", (code, signal) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new ChildProcessNonSuccessError(command, args, code, signal, { stdout, stderr }));
        }
      });

    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);

    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });
  });
}

export class ChildProcessNonSuccessError extends Error {
  constructor(
    public command: string,
    public args: readonly string[],
    public exitCode: number | null,
    public signal: NodeJS.Signals | null,
    public data: { stdout: string; stderr: string },
  ) {
    super(`Process ${command} with args ${args.join(" ")} exited with code ${exitCode}`);
  }
}
