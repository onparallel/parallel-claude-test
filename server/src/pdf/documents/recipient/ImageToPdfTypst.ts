import { outdent } from "outdent";
import { IntlShape } from "react-intl";
import { PdfDocumentTheme } from "../../../util/PdfDocumentTheme";
import { hashString } from "../../../util/token";
import { PdfDocument } from "../../utils/pdf";

export interface ImageToPdfProps {
  imagePath: string;
  theme: PdfDocumentTheme;
}

function ImageToPdfTypst({ imagePath, theme }: ImageToPdfProps, intl: IntlShape) {
  return outdent`
    #import "@preview/prequery:0.1.0"
    #set page(
      margin: (
        top: ${theme.marginTop}mm,
        right: ${theme.marginRight}mm,
        bottom: ${theme.marginBottom}mm,
        left: ${theme.marginLeft}mm,
      ),
    )
    
    #set align(center + horizon)
    #context {
      let originalPath = ${JSON.stringify(imagePath)}
      let path = ${JSON.stringify(`assets/${hashString(imagePath)}`)}
      let image = prequery.image(originalPath, path)
      let size = measure(image)
      
      // Calculate max dimensions (page size minus margins)
      let max_width = 210mm - ${theme.marginLeft}mm - ${theme.marginRight}mm
      let max_height = 297mm - ${theme.marginTop}mm - ${theme.marginBottom}mm
      
      // Scale image to fit within page while maintaining aspect ratio
      let scale_x = max_width / size.width
      let scale_y = max_height / size.height
      let scale = calc.min(scale_x, scale_y, 1.0)
      
      if (scale < 1.0) {
        prequery.image(originalPath, path, width: size.width * scale, height: size.height * scale)
      } else {
        prequery.image(originalPath, path)
      }
    }
  `;
}

ImageToPdfTypst.TYPST = true;

export default ImageToPdfTypst as PdfDocument<{}, ImageToPdfProps>;
