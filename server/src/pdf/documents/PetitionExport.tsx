import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { gql } from "apollo-server-core";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, zip } from "remeda";
import { FORMATS } from "../../util/dates";
import { evaluateFieldVisibility } from "../../util/fieldVisibility";
import { fileSize } from "../../util/fileSize";
import { formatNumberWithPrefix } from "../../util/formatNumberWithPrefix";
import { isFileTypeField } from "../../util/isFileTypeField";
import { FieldDescription } from "../components/FieldDescription";
import { NetDocumentsExternalLink } from "../components/NetDocumentsExternalLink";
import { SignaturesBlock } from "../components/SignaturesBlock";
import { cleanupText } from "../utils/cleanupText";
import { PdfDocumentGetProps } from "../utils/pdf";
import { ThemeProvider } from "../utils/ThemeProvider";
import { PdfDocumentTheme } from "../../util/PdfDocumentTheme";
import { LiquidProvider, LiquidScopeProvider } from "../utils/useLiquid";
import { useLiquidScope } from "../utils/useLiquidScope";
import {
  PetitionExport_PetitionBaseFragment,
  PetitionExport_petitionDocument,
  PetitionExport_PetitionFieldFragment,
} from "../__types";

export interface PetitionExportInitialData {
  petitionId: string;
  documentTitle: string | null;
  showSignatureBoxes?: boolean;
  includeNetDocumentsLinks?: boolean;
}

export interface PetitionExportProps extends Omit<PetitionExportInitialData, "petitionId"> {
  petition: PetitionExport_PetitionBaseFragment;
}

export default function PetitionExport({
  documentTitle,
  showSignatureBoxes,
  includeNetDocumentsLinks,
  petition,
}: PetitionExportProps) {
  const intl = useIntl();
  const theme = petition.selectedDocumentTheme.data as PdfDocumentTheme;
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
    noReplies: {
      fontStyle: "italic",
      opacity: 0.7,
    },
    // header: {
    //   position: "absolute",
    //   top: 0,
    //   left: 0,
    //   right: 0,
    //   paddingLeft: `${theme.marginLeft}mm`,
    //   paddingRight: `${theme.marginRight}mm`,
    //   height: `${theme.marginTop}mm`,
    //   alignItems: "center",
    //   flexDirection: "row",
    //   justifyContent:
    //     theme.logoPosition === "left"
    //       ? "flex-start"
    //       : theme.logoPosition === "right"
    //       ? "flex-end"
    //       : "center",
    // },
    // headerLogo: {
    //   width: "50mm",
    //   maxHeight: `${theme.marginTop * 0.6}mm`,
    //   objectFit: "contain",
    //   objectPositionX: 0,
    // },
    documentStart: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginBottom: "10mm",
    },
    documentLogo: {
      width: "84mm",
      maxHeight: "50mm",
      objectFit: "contain",
    },
    documentTitle: {
      marginTop: "10mm",
      textAlign: "center",
    },
    field: {
      border: "1px solid #CBD5E0",
      borderRadius: "1.5mm",
      padding: "4.2mm",
    },
    headerTitle: {
      fontWeight: "bold",
    },
    headerDescription: {
      textAlign: "justify",
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
    signaturesBlock: {
      marginTop: "4mm",
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingLeft: `${theme.marginLeft}mm`,
      paddingRight: `${theme.marginRight}mm`,
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
  const scope = useLiquidScope(petition);

  const simpleRepliesNetdocumentsExternalId = pages
    .flat()
    .find(
      (field) =>
        field.type !== "HEADING" &&
        !isFileTypeField(field.type) &&
        field.replies.some((r) => !!r.metadata.EXTERNAL_ID_CUATRECASAS)
    )?.replies[0].metadata.EXTERNAL_ID_CUATRECASAS;

  return (
    <LiquidProvider>
      <LiquidScopeProvider scope={scope}>
        <ThemeProvider theme={theme}>
          <Document>
            {pages.map((page, i) => (
              <Page key={i} style={styles.page} wrap>
                {i === 0 ? (
                  <View style={styles.documentStart}>
                    {theme.showLogo ? (
                      <Image
                        src={
                          petition.organization.logoUrl ??
                          "http://static.onparallel.com/static/emails/logo.png"
                        }
                        style={styles.documentLogo}
                      />
                    ) : null}
                    {documentTitle ? (
                      <View style={styles.documentTitle}>
                        <Text style={styles.title1}>{documentTitle}</Text>
                      </View>
                    ) : null}
                    {includeNetDocumentsLinks && simpleRepliesNetdocumentsExternalId ? (
                      <NetDocumentsExternalLink
                        externalId={simpleRepliesNetdocumentsExternalId}
                        style={{ marginTop: "2mm" }}
                      />
                    ) : null}
                  </View>
                ) : null}
                {page.map((field, i) => (
                  <View key={i} style={{ marginBottom: "5mm" }}>
                    {field.type === "HEADING" ? (
                      <View>
                        {field.title ? (
                          <Text
                            style={[
                              styles.headerTitle,
                              styles.title2,
                              ...(field.description ? [{ marginBottom: "2mm" }] : []),
                            ]}
                          >
                            {cleanupText(field.title)}
                          </Text>
                        ) : null}
                        {field.description ? (
                          <View style={[styles.text, styles.headerDescription]}>
                            <FieldDescription description={field.description} />
                          </View>
                        ) : null}
                      </View>
                    ) : (
                      <View key={i} style={styles.field} wrap={false}>
                        {field.title ? (
                          <Text style={[styles.text, styles.fieldTitle]}>
                            {cleanupText(field.title)}
                          </Text>
                        ) : null}
                        {field.description ? (
                          <View
                            style={[styles.text, styles.fieldDescription, { marginTop: "2mm" }]}
                          >
                            <FieldDescription description={field.description} />
                          </View>
                        ) : null}
                        <View style={styles.fieldReplies}>
                          {field.replies.map((reply) =>
                            isFileTypeField(field.type) ? (
                              <View
                                key={reply.id}
                                style={[
                                  {
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                  },
                                ]}
                              >
                                <Text style={[styles.text]}>
                                  {`${reply.content.filename} - ${fileSize(
                                    intl,
                                    reply.content.size
                                  )}`}
                                  {reply.status === "APPROVED" ? null : (
                                    <Text style={[styles.text]}>
                                      {" "}
                                      <FormattedMessage
                                        id="document.petition-export.file-pending-review"
                                        defaultMessage="(Pending review)"
                                      />
                                    </Text>
                                  )}
                                </Text>
                                {includeNetDocumentsLinks &&
                                reply.metadata.EXTERNAL_ID_CUATRECASAS ? (
                                  <NetDocumentsExternalLink
                                    variant="button"
                                    style={{ marginLeft: "1mm" }}
                                    externalId={reply.metadata.EXTERNAL_ID_CUATRECASAS}
                                  />
                                ) : null}
                              </View>
                            ) : field.type === "DYNAMIC_SELECT" ? (
                              <View key={reply.id}>
                                {(reply.content.value as [string, string | null][]).map(
                                  ([label, value], i) => (
                                    <Text style={[styles.text]} key={i}>
                                      {label}:{" "}
                                      {value ?? (
                                        <Text style={[styles.text, styles.noReplies]}>
                                          <FormattedMessage
                                            id="document.petition-export.no-replies"
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
                            <Text style={[styles.text, styles.noReplies]}>
                              {isFileTypeField(field.type) ? (
                                <FormattedMessage
                                  id="document.petition-export.no-files"
                                  defaultMessage="No files have been submitted."
                                />
                              ) : (
                                <FormattedMessage
                                  id="document.petition-export.no-replies"
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
                {i === pages.length - 1 &&
                showSignatureBoxes &&
                petition.__typename === "Petition" &&
                isDefined(petition.currentSignatureRequest) ? (
                  <SignaturesBlock
                    signatureConfig={petition.currentSignatureRequest.signatureConfig}
                    templateId={petition.fromTemplateId}
                    style={styles.signaturesBlock}
                  />
                ) : null}
                <View
                  fixed
                  style={styles.footer}
                  render={({ pageNumber }) => (
                    <Text style={styles.footerPageNumber}>{pageNumber}</Text>
                  )}
                />
              </Page>
            ))}
          </Document>
        </ThemeProvider>
      </LiquidScopeProvider>
    </LiquidProvider>
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
  get PetitionBase() {
    return gql`
      fragment PetitionExport_PetitionBase on PetitionBase {
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
        selectedDocumentTheme {
          data
        }
        ... on Petition {
          fromTemplateId
          currentSignatureRequest {
            signatureConfig {
              ...SignaturesBlock_SignatureConfig
            }
          }
        }
        ...useLiquidScope_PetitionBase
        __typename
      }
      ${this.PetitionField}
      ${SignaturesBlock.fragments.SignatureConfig}
      ${useLiquidScope.fragments.PetitionBase}
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
          metadata
        }
      }
    `;
  },
};

PetitionExport.queries = [
  gql`
    query PetitionExport_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...PetitionExport_PetitionBase
      }
    }
    ${PetitionExport.fragments.PetitionBase}
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
