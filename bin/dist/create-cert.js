"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const console_1 = require("console");
const promises_1 = require("dns/promises");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
async function main() {
    const { domain } = await yargs_1.default.usage("Usage: $0 --domain [domain]").option("domain", {
        required: true,
        type: "string",
        description: "The commit sha",
    }).argv;
    if (!process.env.SUDO_UID) {
        throw new Error("Run this script with sudo");
    }
    const result = await (0, promises_1.resolveCname)(domain);
    (0, console_1.assert)(result.length === 1 && result[0] === "lb.onparallel.com", `${domain} is not pointing to lb.onparallel.com`);
    (0, child_process_1.execSync)(`certbot certonly \
    --webroot -w /nfs/parallel/www/html \
    -m santi@onparallel.com \
    --agree-tos \
    --config-dir /nfs/parallel/certs/ \
    -d ${domain}`);
    (0, child_process_1.execSync)(`chmod 755 /nfs/parallel/certs/archive/${domain}/privkey1.pem`);
}
(0, run_1.run)(main);
