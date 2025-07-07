"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeRemoteCommand = executeRemoteCommand;
exports.pingSsh = pingSsh;
exports.copyToRemoteServer = copyToRemoteServer;
const child_process_1 = require("child_process");
const remeda_1 = require("remeda");
async function executeRemoteCommand(ipAddress, command, { keyPath, signal } = {}) {
    return await exec([
        "ssh",
        "-o UserKnownHostsFile=/dev/null",
        "-o StrictHostKeyChecking=no",
        ...((0, remeda_1.isNonNullish)(keyPath) ? [`-i ${keyPath}`] : []),
        ipAddress,
        command,
    ].join(" "), { signal });
}
async function pingSsh(ipAddress, { keyPath, signal } = {}) {
    return await exec([
        "ssh",
        "-o ConnectTimeout=1",
        "-o UserKnownHostsFile=/dev/null",
        "-o StrictHostKeyChecking=no",
        ...((0, remeda_1.isNonNullish)(keyPath) ? [`-i ${keyPath}`] : []),
        ipAddress,
        "true >/dev/null 2>&1",
    ].join(" "), { signal });
}
async function copyToRemoteServer(ipAddress, from, to, { keyPath, signal } = {}) {
    return await exec([
        "scp",
        "-o UserKnownHostsFile=/dev/null",
        "-o StrictHostKeyChecking=no",
        ...((0, remeda_1.isNonNullish)(keyPath) ? [`-i ${keyPath}`] : []),
        from,
        `${ipAddress}:${to}`,
    ].join(" "), { signal });
}
async function exec(command, { signal } = {}) {
    return await new Promise((resolve, reject) => {
        const cp = (0, child_process_1.exec)(command, { signal }, (error) => {
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
