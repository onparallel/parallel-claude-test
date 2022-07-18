import { execSync } from "child_process";
import { assert } from "console";
import { resolveCname } from "dns/promises";
import yargs from "yargs";
import { run } from "./utils/run";

async function main() {
  const { domain } = await yargs.usage("Usage: $0 --domain [domain]").option("domain", {
    required: true,
    type: "string",
    description: "The commit sha",
  }).argv;

  if (!process.env.SUDO_UID) {
    throw new Error("Run this script with sudo");
  }

  const result = await resolveCname(domain);
  assert(
    result.length === 1 && result[0] === "lb.onparallel.com",
    `${domain} is not pointing to lb.onparallel.com`
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
