import { Document, Image, Page, StyleSheet, View } from "@react-pdf/renderer";
import { gql } from "apollo-server-core";
import { PdfDocumentGetProps } from "../utils/pdf";
import { PdfDocumentTheme } from "../utils/ThemeProvider";
import { ImageToPdf_meDocument } from "../__types";

interface ImageToPdfProps {
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

ImageToPdf.queries = [
  gql`
    query ImageToPdf_me {
      me {
        organization {
          pdfDocumentTheme
        }
      }
    }
  `,
];

ImageToPdf.getProps = (async ({ imageUrl }, { client }) => {
  const response = await client!.request(ImageToPdf_meDocument);
  return {
    imageUrl,
    theme: response.me.organization.pdfDocumentTheme,
  };
}) as PdfDocumentGetProps<Omit<ImageToPdfProps, "theme">, ImageToPdfProps>;
