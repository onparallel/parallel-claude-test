import PDFParser from "pdf2json";
import { countBy } from "remeda";

export type PageSignatureMetadata = {
  email: string;
  box: {
    top: number;
    left: number;
    height: number;
    width: number;
  };
}[];

export async function calculateSignatureBoxPositions(
  pdfBuffer: Buffer,
  recipients: { email: string }[]
): Promise<PageSignatureMetadata[]> {
  const parser = new PDFParser();
  const metadata = await new Promise<any>((resolve, reject) => {
    parser.on("pdfParser_dataReady", resolve);
    parser.on("pdfParser_dataError", reject);
    parser.parseBuffer(pdfBuffer);
  });
  const positions: PageSignatureMetadata[] = metadata.formImage.Pages.map(
    (page: {
      Texts: { R: { T: string }[]; x: number; y: number }[];
      Height: number;
    }) => {
      const pageSignatureBoxes = page.Texts.filter((textBox) =>
        textBox.R.some((text) => text.T.startsWith("SIGNER_"))
      );

      return pageSignatureBoxes.map((sb) => {
        const signerIndex = parseInt(
          sb.R.find((r) => r.T.startsWith("SIGNER_"))!.T.split("SIGNER_")[1],
          10
        );
        return {
          email: recipients[signerIndex].email,
          box: {
            top: (sb.y / page.Height) * 100,
            left: (sb.x / metadata.formImage.Width) * 100,
            height: 7, // 7% of page height
            width: 26, // 26% of page width
          },
        };
      });
    }
  );

  if (countBy(positions, (pageSignature) => pageSignature.length > 0) === 0) {
    throw new Error(
      "couldn't find signature box positions on the signature pdf"
    );
  }

  return positions;
}
