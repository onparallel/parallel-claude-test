import { outdent } from "outdent";
import { IntlShape } from "react-intl";
import { PdfDocumentTheme } from "../../../util/PdfDocumentTheme";
import { PdfDocument } from "../../utils/pdf";

export interface AnnexCoverPageProps {
  fieldTitle: string | null;
  fieldNumber: number;
  theme: PdfDocumentTheme;
}

function AnnexCoverPageTypst(
  { fieldNumber, fieldTitle, theme }: AnnexCoverPageProps,
  intl: IntlShape,
) {
  const annexTitle = intl.formatMessage(
    {
      id: "document.annex-cover-page.title",
      defaultMessage: "Annex {n}",
    },
    { n: fieldNumber },
  );

  return outdent`
    #set page(
      margin: (
        top: ${theme.marginTop}mm,
        right: ${theme.marginRight}mm,
        bottom: ${theme.marginBottom}mm,
        left: ${theme.marginLeft}mm,
      ),
    )
    
    #set align(center + horizon)
    
    #block(
      spacing: 5mm,
      [
        #text(
          font: (${JSON.stringify(theme.title1FontFamily)}, "Noto Emoji"),
          size: ${theme.title1FontSize}pt,
          fill: rgb(${JSON.stringify(theme.title1Color)}),
          weight: 600,
        )[#upper(${JSON.stringify(annexTitle)})]
        
        ${
          fieldTitle
            ? `
        #text(
          font: (${JSON.stringify(theme.title2FontFamily)}, "Noto Emoji"),
          size: ${theme.title2FontSize}pt,
          fill: rgb(${JSON.stringify(theme.title2Color)}),
        )[${fieldTitle}]
        `
            : ""
        }
      ]
    )
  `;
}

export default AnnexCoverPageTypst as PdfDocument<{}, AnnexCoverPageProps>;
