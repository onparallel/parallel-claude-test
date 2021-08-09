import PDFParser from "pdf2json";
import { countBy, groupBy } from "remeda";

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
  const pageWidth = metadata.formImage.Width as number;
  const positions: PageSignatureMetadata[] = metadata.formImage.Pages.map(
    (page: { Texts: { R: { T: string }[]; x: number; y: number }[]; Height: number }) => {
      /**
       * pdf parser can't guarantee that the extracted texts will be complete words.
       * So we need to:
       *  Group text in lines using the "y" coordinate, then group lines in 3 columns spanning the page Width
       *  extract and decode the text contents of each line-column
       *  at this step, each word could be wrongly splitted in 2 or more parts, so we need to remove the space characters.
       */
      const pageLines = groupBy(page.Texts, (t) => t.y);

      // between 1 and 3 boxes could be in the same "y" position, so we also need to group the lines in columns
      const colWidth = pageWidth / 3;
      const columns = [
        { minX: 0, maxX: colWidth },
        { minX: colWidth, maxX: colWidth * 2 },
        { minX: colWidth * 2, maxX: colWidth * 3 },
      ];

      // split each line into an Array of dimension 3, each value being the texts inside a column
      const lineColumns = Object.values(pageLines).map((line) =>
        columns.map((col) => line.filter((l) => l.x >= col.minX && l.x <= col.maxX))
      );

      const pageTexts = lineColumns.flatMap((lineArray) => {
        return lineArray.map((lineCol) => {
          return {
            text: decodeURIComponent(
              lineCol.map((pl) => pl.R.map((r) => r.T).join("")).join("")
            ).replace(/\s/g, ""),
            box: lineCol[0],
          };
        });
      });

      // if some of the extracted texts matches the "SIGNER_" regexp, we found a Signature Box
      const pageSignatureBoxes = pageTexts.filter((t) => {
        return t.text.match(/SIGNER_\d/);
      });

      return pageSignatureBoxes.map((sb) => {
        const signerIndex = parseInt(sb.text.split("SIGNER_")[1], 10);
        return {
          email: recipients[signerIndex].email,
          box: {
            top: (sb.box.y / page.Height) * 100,
            left: Math.ceil((sb.box.x / pageWidth) * 100),
            height: 7, // 7% of page height
            width: 26, // 26% of page width
          },
        };
      });
    }
  );

  if (countBy(positions, (pageSignature) => pageSignature.length > 0) === 0) {
    throw new Error("MALFORMED_PDF_ERROR");
  }

  return positions;
}
