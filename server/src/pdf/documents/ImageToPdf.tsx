import { Document, Image, Page, StyleSheet, View } from "@react-pdf/renderer";
import { PdfDocumentTheme } from "../../util/PdfDocumentTheme";

export interface ImageToPdfProps {
  imageUrl: string;
  theme: PdfDocumentTheme;
}

export default function ImageToPdf({ imageUrl, theme }: ImageToPdfProps) {
  const styles = StyleSheet.create({
    centered: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: "auto",
    },
    page: {
      paddingLeft: `${theme.marginLeft}mm`,
      paddingRight: `${theme.marginRight}mm`,
      paddingTop: `${theme.marginTop}mm`,
      paddingBottom: `${theme.marginBottom}mm`,
      lineHeight: 1.4,
    },
    image: {
      objectFit: "contain",
    },
  });

  return (
    <Document>
      <Page style={styles.page} wrap>
        <View style={styles.centered}>
          <Image style={styles.image} src={imageUrl} />
        </View>
      </Page>
    </Document>
  );
}
