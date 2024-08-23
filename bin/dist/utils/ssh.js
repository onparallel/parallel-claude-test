"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeRemoteCommand = executeRemoteCommand;
exports.pingSsh = pingSsh;
exports.copyToRemoteServer = copyToRemoteServer;
const child_process_1 = require("child_process");
const remeda_1 = require("remeda");
async function executeRemoteCommand(ipAddress, command) {
    return await exec(`ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} ${command}`);
}
async function pingSsh(ipAddress) {
    return await exec(`ssh \
      -o ConnectTimeout=1 \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} true >/dev/null 2>&1`);
}
async function copyToRemoteServer(ipAddress, from, to) {
    return await exec(`scp \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${from} ${ipAddress}:${to}`);
}
async function exec(command) {
    return await new Promise((resolve, reject) => {
        const cp = (0, child_process_1.exec)(command, (error) => {
            if ((0, remeda_1.isNonNullish)(error)) {
                reject(error);
            }
            else {
                resolve();
            }
        });
        cp.stderr.pipe(process.stderr);
        cp.stdout.pipe(process.stdout);
    });
}
