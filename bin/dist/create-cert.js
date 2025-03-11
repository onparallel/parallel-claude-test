"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const promises_1 = require("dns/promises");
const ts_essentials_1 = require("ts-essentials");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const LB_DOMAIN = {
    production: "lb.onparallel.com",
    staging: "lb-staging.onparallel.com",
}[process.env.ENV];
async function main() {
    const { domain } = await yargs_1.default.usage("Usage: $0 --domain [domain]").option("domain", {
        required: true,
        type: "string",
        description: "The domain to create the certificate for",
    }).argv;
    if (!process.env.SUDO_UID) {
        throw new Error("Run this script with sudo");
    }
    const result = await (0, promises_1.resolveCname)(domain);
    (0, ts_essentials_1.assert)(result.length === 1 && result[0] === LB_DOMAIN, `${domain} is not pointing to ${LB_DOMAIN}`);
    (0, child_process_1.execSync)(`certbot certonly \
    --webroot -w /nfs/parallel/www/html \
    -m santi@onparallel.com \
    --agree-tos \
    --config-dir /nfs/parallel/certs/ \
    -d ${domain}`);
    (0, child_process_1.execSync)(`chmod 755 /nfs/parallel/certs/archive/${domain}/privkey1.pem`);
}
(0, run_1.run)(main);
