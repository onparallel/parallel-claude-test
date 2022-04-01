import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { gql } from "apollo-server-core";
import { FormattedDate, FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";
import { FORMATS } from "../../emails/utils/dates";
import { evaluateFieldVisibility } from "../../util/fieldVisibility";
import { fileSize } from "../../util/fileSize";
import { formatNumberWithPrefix } from "../../util/formatNumberWithPrefix";
import { PdfDocumentGetProps } from "../utils";
import {
  PetitionExport_petitionDocument,
  PetitionExport_PetitionFieldFragment,
  PetitionExport_PetitionFragment,
} from "../__types";
import { HardcodedSignatures } from "./HardcodedSignatures";

export interface PetitionExportTheme {
  marginHorizontal: number;
  marginTop: number;
  marginBottom: number;
  title1FontFamily: string;
  title1Color: string;
  title1FontSize: number;
  title2FontFamily: string;
  title2Color: string;
  title2FontSize: number;
  textFontFamily: string;
  textColor: string;
  textFontSize: number;
  logoPosition: "center" | "flex-start" | "flex-end";
  paginationPosition: "center" | "left" | "right";
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
  marginTop: 25.4,
  marginBottom: 25.4,
  title1FontFamily: "Roboto",
  title1Color: "#1A202C",
  title1FontSize: 16,
  title2FontFamily: "Roboto",
  title2Color: "#1A202C",
  title2FontSize: 14,
  textFontFamily: "Roboto",
  textColor: "#1A202C",
  textFontSize: 12,
  logoPosition: "center",
  paginationPosition: "right",
};

export default function PetitionExport({
  documentTitle,
  showSignatureBoxes,
  petition,
}: PetitionExportProps) {
  const intl = useIntl();
  const styles = StyleSheet.create({
    page: {
      paddingHorizontal: `${theme.marginHorizontal}mm`,
      paddingTop: `${theme.marginTop}mm`,
      paddingBottom: `${theme.marginBottom}mm`,
      lineHeight: 1.4,
    },
    title1: {
      fontFamily: theme.title1FontFamily,
      fontSize: theme.title1FontSize,
      color: theme.title1Color,
      fontWeight: 600,
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
    italicText: {
      fontStyle: "italic",
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: `${theme.marginHorizontal}mm`,
      height: `${theme.marginTop}mm`,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: theme.logoPosition,
    },
    headerLogo: {
      width: "50mm",
      maxHeight: `${theme.marginTop * 0.5}mm`,
      objectFit: "contain",
      objectPositionX: 0,
    },
    documentTitle: {
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: "20mm",
      marginTop: "10mm",
    },
    field: {
      border: "1px solid #CBD5E0",
      borderRadius: "5px",
      padding: "5mm",
    },
    fieldTitle: {
      fontWeight: "bold",
    },
    fieldReplies: {
      marginTop: "3mm",
    },
    fieldDescription: {
      textAlign: "justify",
      opacity: 0.7,
    },
    fieldSigners: {
      marginTop: "4mm",
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: `${theme.marginBottom * 0.5}mm`,
      paddingHorizontal: `${theme.marginHorizontal}mm`,
      height: `${theme.marginBottom}mm`,
    },
    footerPageNumber: {
      fontFamily: theme.textFontFamily,
      fontSize: theme.textFontSize,
      color: theme.textColor,
      textAlign: theme.paginationPosition,
    },
  });

  const visibility = evaluateFieldVisibility(petition.fields as any);
  const pages = groupFieldsByPages(petition.fields as any, visibility);
  const signers = petition.currentSignatureRequest?.signatureConfig.signers ?? [];
  const timezone = petition.currentSignatureRequest?.signatureConfig.timezone;

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
                  <View style={styles.fieldReplies}>
                    {field.replies.map((reply) =>
                      field.type === "FILE_UPLOAD" ? (
                        <Text style={[styles.text]} key={reply.id}>
                          {`${reply.content.filename} - ${fileSize(intl, reply.content.size)}`}
                          {reply.status === "APPROVED" ? null : (
                            <Text style={[styles.text]}>
                              {" "}
                              <FormattedMessage
                                id="petition-signature.file-submitted.pending-review"
                                defaultMessage="(Pending review)"
                              />
                            </Text>
                          )}
                        </Text>
                      ) : field.type === "DYNAMIC_SELECT" ? (
                        <View key={reply.id}>
                          {(reply.content.value as [string, string | null][]).map(
                            ([label, value], i) => (
                              <Text style={[styles.text]} key={i}>
                                {label}:{" "}
                                {value ?? (
                                  <Text>
                                    <FormattedMessage
                                      id="petition-signature.no-reply-submitted"
                                      defaultMessage="No replies have been submitted."
                                    />
                                  </Text>
                                )}
                              </Text>
                            )
                          )}
                        </View>
                      ) : field.type === "CHECKBOX" ? (
                        <View key={reply.id}>
                          {(reply.content.value as [string]).map((value, i) => (
                            <Text style={[styles.text]} key={i}>
                              {value}
                            </Text>
                          ))}
                        </View>
                      ) : field.type === "NUMBER" ? (
                        <Text style={[styles.text]} key={reply.id}>
                          {formatNumberWithPrefix(reply.content.value, field!.options)}
                        </Text>
                      ) : field.type === "DATE" ? (
                        <Text style={[styles.text]} key={reply.id}>
                          {intl.formatDate(reply.content.value, {
                            ...FORMATS.L,
                            timeZone: "UTC",
                          })}
                        </Text>
                      ) : field.type === "PHONE" ? (
                        <Text style={[styles.text]} key={reply.id}>
                          {reply.content.value}
                        </Text>
                      ) : (
                        <Text style={[styles.text]} key={reply.id}>
                          {reply.content.value}
                        </Text>
                      )
                    )}
                    {field.replies.length === 0 ? (
                      <Text style={[styles.text, styles.italicText]}>
                        {field.type === "FILE_UPLOAD" ? (
                          <FormattedMessage
                            id="petition-signature.file-not-submitted"
                            defaultMessage="File not submitted"
                          />
                        ) : (
                          <FormattedMessage
                            id="petition-signature.no-reply-submitted"
                            defaultMessage="No replies have been submitted."
                          />
                        )}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}
            </View>
          ))}
          {showSignatureBoxes && i === pages.length - 1 && signers.length > 0 && (
            <View style={[styles.fieldSigners]}>
              <Text style={[styles.text, styles.italicText]}>
                <FormattedMessage
                  id="petition.print-pdf.signatures-disclaimer"
                  defaultMessage="I declare that the data and documentation provided, as well as the copies or photocopies sent, faithfully reproduce the original documents and the current identification information."
                />
              </Text>
              {petition.fromTemplateId ? (
                <HardcodedSignatures fromTemplateId={petition.fromTemplateId} theme={theme} />
              ) : null}
              <View
                wrap={false}
                style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}
              >
                {signers!.map((signer, index) => (
                  <View
                    key={index}
                    style={{
                      ...styles.text,
                      height: "36mm",
                      width: "50mm",
                      border: "1px solid #CBD5E0",
                      textAlign: "center",
                      borderRadius: "5px",
                      position: "relative",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      padding: "2mm",
                      marginBottom: "5mm",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        position: "absolute",
                        top: 0,
                        left: 0,
                      }}
                    >
                      {`3cb39pzCQA9wJ${index}`}
                    </Text>
                    <Text>{signer.fullName}</Text>
                    <Text style={{ opacity: 0.7 }}>
                      <FormattedDate timeZone={timezone} value={new Date()} {...FORMATS.L} />
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View
            fixed
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
