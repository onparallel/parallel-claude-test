import { randomBytes } from "crypto";
import { decrypt, encrypt } from "../token";

describe("token", () => {
  it("should encrypt and decrypt a JSON object", () => {
    const key = Buffer.from(randomBytes(32).toString("base64"), "base64");

    const json = { A: 1, B: 2, C: [1, 2, 3] };

    const encrypted = encrypt(JSON.stringify(json), key).toString("hex");

    const decrypted = JSON.parse(decrypt(Buffer.from(encrypted, "hex"), key).toString("utf8"));

    expect(json).toMatchObject(decrypted);
  });
});
