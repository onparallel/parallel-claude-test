import { sign } from "crypto";
import { EventSubscriptionSignatureKey } from "../db/__types";
import { IEncryptionService } from "../services/EncryptionService";

export function buildSubscriptionSignatureHeaders(
  keys: EventSubscriptionSignatureKey[],
  body: string,
  encryptionService: IEncryptionService,
) {
  const headers: HeadersInit = {};
  for (const key of keys) {
    const i = keys.indexOf(key);
    const privateKey = encryptionService.decrypt(Buffer.from(key.private_key, "base64"));
    headers[`X-Parallel-Signature-${i + 1}`] = sign(null, Buffer.from(body), {
      key: Buffer.from(privateKey, "base64"),
      format: "der",
      type: "pkcs8",
    }).toString("base64");
  }

  return headers;
}
