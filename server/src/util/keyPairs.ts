import { generateKeyPairSync } from "crypto";

export function generateEDKeyPair() {
  return generateKeyPairSync("ed25519", {
    publicKeyEncoding: { format: "der", type: "spki" },
    privateKeyEncoding: { format: "der", type: "pkcs8" },
  });
}
