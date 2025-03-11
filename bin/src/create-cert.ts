import { execSync } from "child_process";
import { resolveCname } from "dns/promises";
import { assert } from "ts-essentials";
import yargs from "yargs";
import { run } from "./utils/run";

const LB_DOMAIN = {
  production: "lb.onparallel.com",
  staging: "lb-staging.onparallel.com",
}[process.env.ENV as "production" | "staging"];

async function main() {
  const { domain } = await yargs.usage("Usage: $0 --domain [domain]").option("domain", {
    required: true,
    type: "string",
    description: "The domain to create the certificate for",
  }).argv;

  if (!process.env.SUDO_UID) {
    throw new Error("Run this script with sudo");
  }

  const result = await resolveCname(domain);
  assert(
    result.length === 1 && result[0] === LB_DOMAIN,
    `${domain} is not pointing to ${LB_DOMAIN}`,
  );

  execSync(`certbot certonly \
    --webroot -w /nfs/parallel/www/html \
    -m santi@onparallel.com \
    --agree-tos \
    --config-dir /nfs/parallel/certs/ \
    -d ${domain}`);
  execSync(`chmod 755 /nfs/parallel/certs/archive/${domain}/privkey1.pem`);
}

run(main);
