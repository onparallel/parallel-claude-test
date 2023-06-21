import { exec as _exec } from "child_process";
import { isDefined } from "remeda";

export async function executeRemoteCommand(ipAddress: string, command: string) {
  return await exec(
    `ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} ${command}`
  );
}

export async function pingSsh(ipAddress: string) {
  return await exec(
    `ssh \
      -o ConnectTimeout=1 \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} true >/dev/null 2>&1`
  );
}

export async function copyToRemoteServer(ipAddress: string, from: string, to: string) {
  return await exec(
    `scp \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${from} ${ipAddress}:${to}`
  );
}

async function exec(command: string) {
  return await new Promise<void>((resolve, reject) => {
    const cp = _exec(command, (error) => {
      if (isDefined(error)) {
        reject(error);
      } else {
        resolve();
      }
    });
    cp.stderr!.pipe(process.stderr);
    cp.stdout!.pipe(process.stdout);
  });
}
