import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { gql } from "apollo-server-core";
import { FormattedMessage } from "react-intl";
import { PdfDocumentGetProps } from "../utils/pdf";
import { PdfDocumentTheme } from "../utils/ThemeProvider";
import { AnnexCoverPage_meDocument } from "../__types";

export interface AnnexCoverPageInitialData {
  fieldTitle: string | null;
  fieldNumber: number;
}

interface AnnexCoverPageProps extends AnnexCoverPageInitialData {
  theme: PdfDocumentTheme;
}

export default function AnnexCoverPage({ fieldNumber, fieldTitle, theme }: AnnexCoverPageProps) {
  const styles = StyleSheet.create({
    page: {
      paddingLeft: `${theme.marginLeft}mm`,
      paddingRight: `${theme.marginRight}mm`,
      paddingTop: `${theme.marginTop}mm`,
      paddingBottom: `${theme.marginBottom}mm`,
      lineHeight: 1.4,
    },
    title1: {
      fontFamily: theme.title1FontFamily,
      fontSize: theme.title1FontSize,
      color: theme.title1Color,
      fontWeight: 600,
      marginBottom: "5px",
      textTransform: "uppercase",
    },
    title2: {
      fontFamily: theme.title2FontFamily,
      fontSize: theme.title2FontSize,
      color: theme.title2Color,
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: "auto",
    },
  });

  return (
    <Document>
      <Page style={styles.page} wrap>
        <View style={styles.centered}>
          <Text style={styles.title1}>
            <FormattedMessage
              id="document.annex-cover-page.title"
              defaultMessage="Annex {n}"
              values={{ n: fieldNumber }}
            />
          </Text>
          <Text style={styles.title2}>{fieldTitle}</Text>
        </View>
      </Page>
    </Document>
  );
}

AnnexCoverPage.queries = [
  gql`
    query AnnexCoverPage_me {
      me {
        organization {
          pdfDocumentTheme
        }
      }
    }
  `,
];

AnnexCoverPage.getProps = (async (props, { client }) => {
  const response = await client!.request(AnnexCoverPage_meDocument);
  return {
    ...props,
    theme: response.me.organization.pdfDocumentTheme,
  };
}) as PdfDocumentGetProps<AnnexCoverPageInitialData, AnnexCoverPageProps>;
