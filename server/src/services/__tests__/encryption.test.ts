import { randomBytes } from "crypto";
import { EncryptionService } from "../encryption";

describe("EncryptionService", () => {
  it("should encrypt and decrypt a JSON object", () => {
    const encryption = new EncryptionService({
      security: { encryptKeyBase64: randomBytes(32).toString("base64"), jwtSecret: "" },
    });

    const json = { A: 1, B: 2, C: [1, 2, 3] };

    const encrypted = encryption.encrypt(JSON.stringify(json), "hex");

    const decrypted = JSON.parse(encryption.decrypt(Buffer.from(encrypted, "hex"), "utf8"));

    expect(json).toMatchObject(decrypted);
  });
});
