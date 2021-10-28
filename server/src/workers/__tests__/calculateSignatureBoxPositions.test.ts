import { readFileSync } from "fs";
import { join } from "path";
import {
  calculateSignatureBoxPositions,
  PageSignatureMetadata,
} from "../helpers/calculateSignatureBoxPositions";

describe("calculateSignatureBoxPositions", () => {
  it("calculates boxes of 5 signatures on a single page", async () => {
    const pdf = readFileSync(join(__dirname, "./assets/single-page.pdf"));
    const positions = await calculateSignatureBoxPositions(pdf, [
      { email: "homer@simpson.com" },
      { email: "marge@bouvier.com" },
      { email: "bart@simpson.com" },
      { email: "lisa@simpson.com" },
      { email: "apu@kuikemart.com" },
    ]);

    expect(positions).toStrictEqual<PageSignatureMetadata[][]>([
      [
        {
          email: "homer@simpson.com",
          signerIndex: 0,
          box: { top: 43.390410958904106, left: 7, height: 7, width: 26 },
        },
        {
          email: "marge@bouvier.com",
          signerIndex: 1,
          box: { top: 43.390410958904106, left: 37, height: 7, width: 26 },
        },
        {
          email: "bart@simpson.com",
          signerIndex: 2,
          box: { top: 43.390410958904106, left: 67, height: 7, width: 26 },
        },
        {
          email: "lisa@simpson.com",
          signerIndex: 3,
          box: { top: 55.52130898021308, left: 7, height: 7, width: 26 },
        },
        {
          email: "apu@kuikemart.com",
          signerIndex: 4,
          box: { top: 55.52130898021308, left: 37, height: 7, width: 26 },
        },
      ],
    ]);
  });

  it("fails when receiving pdf without signature boxes", async () => {
    const pdf = readFileSync(join(__dirname, "./assets/no-signature.pdf"));

    await expect(
      calculateSignatureBoxPositions(pdf, [{ email: "homer@simpson.com" }])
    ).rejects.toThrow("MALFORMED_PDF_ERROR");
  });
});
