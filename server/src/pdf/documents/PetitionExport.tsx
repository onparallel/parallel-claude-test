import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { gql } from "apollo-server-core";
import { FormattedMessage } from "react-intl";
import { zip } from "remeda";
import { evaluateFieldVisibility } from "../../util/fieldVisibility";
import { PdfDocumentGetProps } from "../utils";
import {
  PetitionExport_petitionDocument,
  PetitionExport_PetitionFieldFragment,
  PetitionExport_PetitionFragment,
} from "../__types";

interface PetitionExportTheme {
  marginHorizontal: number;
  marginVertical: number;
  title1FontFamily: string;
  title1Color: string;
  title1FontSize: number;
  title2FontFamily: string;
  title2Color: string;
  title2FontSize: number;
  textFontFamily: string;
  textColor: string;
  textFontSize: number;
}

export interface PetitionExportInitialData {
  petitionId: string;
  documentTitle: string;
  showSignatureBoxes: boolean;
}

export interface PetitionExportProps extends Omit<PetitionExportInitialData, "petitionId"> {
  petition: PetitionExport_PetitionFragment;
}

const theme: PetitionExportTheme = {
  marginHorizontal: 25.4,
  // marginVertical: 25.4,
  // marginHorizontal: 10,
  marginVertical: 25.4,
  title1FontFamily: "Roboto",
  title1Color: "#333333",
  title1FontSize: 16,
  title2FontFamily: "Roboto",
  title2Color: "#333333",
  title2FontSize: 14,
  textFontFamily: "Roboto",
  textColor: "#333333",
  textFontSize: 12,
};

export default function PetitionExport({ documentTitle, petition }: PetitionExportProps) {
  const styles = StyleSheet.create({
    page: {
      paddingHorizontal: `${theme.marginHorizontal}mm`,
      paddingVertical: `${theme.marginVertical}mm`,
      lineHeight: 1.4,
    },
    title1: {
      fontFamily: theme.title1FontFamily,
      fontSize: theme.title1FontSize,
      color: theme.title1Color,
    },
    title2: {
      fontFamily: theme.title2FontFamily,
      fontSize: theme.title2FontSize,
      color: theme.title2Color,
    },
    text: {
      fontFamily: theme.textFontFamily,
      fontSize: theme.textFontSize,
      color: theme.textColor,
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: `${theme.marginHorizontal}mm`,
      height: `${theme.marginVertical}mm`,
      alignItems: "center",
      flexDirection: "row",
    },
    headerLogo: {
      width: "50mm",
      maxHeight: `${theme.marginVertical * 0.5}mm`,
      objectFit: "contain",
      objectPositionX: 0,
    },
    documentTitle: {
      fontWeight: 600,
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: "10mm",
      marginTop: "10mm",
    },
    field: {
      border: "1px solid #ccd4dd",
      borderRadius: "5px",
      padding: "5mm",
    },
    fieldTitle: {
      fontWeight: "bold",
    },
    fieldDescription: {
      textAlign: "justify",
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: "10mm",
      paddingHorizontal: `${theme.marginHorizontal}mm`,
      height: `${theme.marginVertical}mm`,
    },
    footerPageNumber: {
      fontFamily: theme.textFontFamily,
      fontSize: theme.textFontSize,
      color: theme.textColor,
      textAlign: "right",
    },
  });
  const visibility = evaluateFieldVisibility(petition.fields as any);
  const pages = groupFieldsByPages(petition.fields as any, visibility);
  return (
    <Document>
      {pages.map((page, i) => (
        <Page key={i} style={styles.page} wrap>
          <View fixed style={styles.header}>
            <Image
              src={
                petition.organization.logoUrl ??
                "http://static.onparallel.com/static/emails/logo.png"
              }
              style={styles.headerLogo}
            />
          </View>
          <View
            render={({ pageNumber }) =>
              pageNumber === 1 ? (
                <View style={styles.documentTitle}>
                  <Text style={styles.title1}>{documentTitle}</Text>
                </View>
              ) : null
            }
          />
          {page.map((field, i) => (
            <View key={i} style={{ marginBottom: "5mm" }}>
              {field.type === "HEADING" ? (
                <View>
                  {field.title ? (
                    <Text
                      debug
                      style={[
                        styles.fieldTitle,
                        styles.title2,
                        ...(field.description ? [{ marginBottom: "2mm" }] : []),
                      ]}
                    >
                      {field.title}
                    </Text>
                  ) : null}
                  {field.description ? (
                    <Text style={[styles.text, styles.fieldDescription]}>{field.description}</Text>
                  ) : null}
                </View>
              ) : (
                <View key={i} style={styles.field} wrap={false}>
                  <Text style={[styles.text, styles.fieldTitle]}>{field.title}</Text>
                  {field.description ? (
                    <Text style={[styles.text, styles.fieldDescription, { marginTop: "2mm" }]}>
                      {field.description}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          ))}
          <View>
            <Text>
              <FormattedMessage
                id="aejfeawk"
                defaultMessage="I declare that the <b>data</b> and documentation provided, as well as the copies or photocopies sent, faithfully reproduce the original documents and the current identification information."
                values={{
                  b: (chunks: any) => <Text style={{ color: "red" }}>{chunks}</Text>,
                }}
              />
            </Text>
          </View>
          <View
            fixed
            debug
            style={styles.footer}
            render={({ pageNumber }) => <Text style={styles.footerPageNumber}>{pageNumber}</Text>}
          />
        </Page>
      ))}
    </Document>
  );
}

function groupFieldsByPages<T extends PetitionExport_PetitionFieldFragment>(
  fields: T[],
  visibility: boolean[]
): T[][] {
  const pages: T[][] = [];
  let page: T[] = [];
  for (const [field, isVisible] of zip(fields, visibility)) {
    if (field.showInPdf) {
      if (field.type === "HEADING" && field.options!.hasPageBreak) {
        if (page.length > 0) {
          pages.push(page);
          page = [];
        }
      }
      if (isVisible) {
        page.push(field);
      }
    }
  }
  pages.push(page);
  return pages;
}

PetitionExport.fragments = {
  get Petition() {
    return gql`
      fragment PetitionExport_Petition on Petition {
        id
        name
        fields {
          options
          ...PetitionExport_PetitionField
        }
        organization {
          name
          logoUrl
        }
        fromTemplateId
        currentSignatureRequest {
          signatureConfig {
            signers {
              fullName
              email
            }
            timezone
          }
        }
      }
      ${this.PetitionField}
    `;
  },
  get PetitionField() {
    return gql`
      fragment PetitionExport_PetitionField on PetitionField {
        id
        type
        title
        options
        description
        showInPdf
        visibility
        replies {
          id
          status
          content
        }
      }
    `;
  },
};

PetitionExport.queries = [
  gql`
    query PetitionExport_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...PetitionExport_Petition
      }
    }
    ${PetitionExport.fragments.Petition}
  `,
];

PetitionExport.getProps = (async ({ petitionId, ...rest }, { client }) => {
  const response = await client!.request(PetitionExport_petitionDocument, {
    petitionId,
  });
  return {
    ...rest,
    petition: response.petition!,
  };
}) as PdfDocumentGetProps<PetitionExportInitialData, PetitionExportProps>;
