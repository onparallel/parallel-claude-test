import { exec as _exec } from "child_process";
import { isNonNullish } from "remeda";

export async function executeRemoteCommand(
  ipAddress: string,
  command: string,
  { keyPath, signal }: { keyPath?: string; signal?: AbortSignal } = {},
) {
  return await exec(
    [
      "ssh",
      "-o UserKnownHostsFile=/dev/null",
      "-o StrictHostKeyChecking=no",
      ...(isNonNullish(keyPath) ? [`-i ${keyPath}`] : []),
      ipAddress,
      command,
    ].join(" "),
    { signal },
  );
}

export async function pingSsh(
  ipAddress: string,
  { keyPath, signal }: { keyPath?: string; signal?: AbortSignal } = {},
) {
  return await exec(
    [
      "ssh",
      "-o ConnectTimeout=1",
      "-o UserKnownHostsFile=/dev/null",
      "-o StrictHostKeyChecking=no",
      ...(isNonNullish(keyPath) ? [`-i ${keyPath}`] : []),
      ipAddress,
      "true >/dev/null 2>&1",
    ].join(" "),
    { signal },
  );
}

export async function copyToRemoteServer(
  ipAddress: string,
  from: string,
  to: string,
  { keyPath, signal }: { keyPath?: string; signal?: AbortSignal } = {},
) {
  return await exec(
    [
      "scp",
      "-o UserKnownHostsFile=/dev/null",
      "-o StrictHostKeyChecking=no",
      ...(isNonNullish(keyPath) ? [`-i ${keyPath}`] : []),
      from,
      `${ipAddress}:${to}`,
    ].join(" "),
    { signal },
  );
}

async function exec(command: string, { signal }: { signal?: AbortSignal } = {}) {
  return await new Promise<void>((resolve, reject) => {
    const cp = _exec(command, { signal }, (error) => {
      if (isNonNullish(error)) {
        reject(error);
      } else {
        resolve();
      }
    });
    cp.stderr!.pipe(process.stderr);
    cp.stdout!.pipe(process.stdout);
  });
}
