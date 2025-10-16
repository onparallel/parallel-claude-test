import { outdent } from "outdent";
import { IntlShape } from "react-intl";
import { PdfDocumentTheme } from "../../../util/PdfDocumentTheme";
import { PdfDocument } from "../../utils/pdf";
import { t, text } from "../../utils/typst";

export interface DamagedFilePageProps {
  theme: PdfDocumentTheme;
  fileName: string;
}

function DamagedFilePage({ theme, fileName }: DamagedFilePageProps, intl: IntlShape) {
  return [
    outdent`
    #set page(
      margin: (
        top: ${theme.marginTop}mm,
        right: ${theme.marginRight}mm,
        bottom: ${theme.marginBottom}mm,
        left: ${theme.marginLeft}mm,
      )
    )
    `,
    ...text(
      {
        font: `(${JSON.stringify(theme.textFontFamily)}, "Noto Emoji")`,
        size: `${theme.textFontSize}pt`,
        fill: `rgb(${JSON.stringify(theme.textColor)})`,
      },
      t(
        intl.formatMessage(
          {
            id: "document.damaged-file-page.text",
            defaultMessage: "The file {fileName} could not be attached.",
          },
          { fileName },
        ),
      ),
    ),
  ].join("\n");
}

export default DamagedFilePage as PdfDocument<{}, DamagedFilePageProps>;
