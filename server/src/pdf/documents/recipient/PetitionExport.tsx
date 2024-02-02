import ReactPDF, { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import gql from "graphql-tag";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, pick, sortBy, sumBy, times, zip } from "remeda";
import { PdfDocumentTheme } from "../../../util/PdfDocumentTheme";
import { FORMATS, prettifyTimezone } from "../../../util/dates";
import { FieldLogicResult, evaluateFieldLogic } from "../../../util/fieldLogic";
import { fileSize } from "../../../util/fileSize";
import { formatNumberWithPrefix } from "../../../util/formatNumberWithPrefix";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { titleize } from "../../../util/strings";
import { UnwrapArray } from "../../../util/types";
import {
  PetitionExport_PetitionBaseFragment,
  PetitionExport_PetitionFieldFragment,
  PetitionExport_PetitionFieldReplyFragment,
  PetitionExport_petitionDocument,
} from "../../__types";
import { FieldActivity } from "../../components/FieldActivity";
import { FieldDescription } from "../../components/FieldDescription";
import { NetDocumentsExternalLink } from "../../components/NetDocumentsExternalLink";
import { SignaturesBlock } from "../../components/SignaturesBlock";
import { ThemeProvider } from "../../utils/ThemeProvider";
import { cleanupText } from "../../utils/cleanupText";
import { LiquidProvider } from "../../utils/liquid/LiquidContext";
import { LiquidScopeProvider } from "../../utils/liquid/LiquidScopeProvider";
import { useLiquidRender } from "../../utils/liquid/useLiquid";
import { PdfDocumentGetProps } from "../../utils/pdf";
import { LiquidPetitionVariableProvider } from "../../utils/liquid/LiquidPetitionVariableProvider";

export interface PetitionExportInitialData {
  assetsUrl: string;
  petitionId: string;
  documentTitle: string | null;
  showSignatureBoxes?: boolean;
  includeNetDocumentsLinks?: boolean;
}

export interface PetitionExportProps extends Omit<PetitionExportInitialData, "petitionId"> {
  petition: PetitionExport_PetitionBaseFragment;
}

export default function PetitionExport({
  assetsUrl,
  documentTitle,
  showSignatureBoxes,
  includeNetDocumentsLinks,
  petition,
}: PetitionExportProps) {
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
    header: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginBottom: "10mm",
    },
    content: {
      display: "flex",
      flexDirection: "column",
      gap: "5mm",
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

  const pages = groupFieldsByPages(petition);

  const simpleRepliesNetDocumentsField = pages
    .flatMap((page) => [...page.flatMap((p) => [p.field, ...(p.field.children ?? [])])])
    .find(
      (f) =>
        f.type !== "HEADING" &&
        f.type !== "FIELD_GROUP" &&
        !isFileTypeField(f.type) &&
        f.replies.some((r) => !!r.metadata.EXTERNAL_ID_CUATRECASAS),
    );

  const simpleRepliesNetdocumentsExternalId = simpleRepliesNetDocumentsField?.replies.find(
    (r) => !!r.metadata.EXTERNAL_ID_CUATRECASAS,
  )?.metadata.EXTERNAL_ID_CUATRECASAS as string | undefined;

  function notEmptyHeading(
    field: Pick<PetitionExport_PetitionFieldFragment, "type" | "title" | "description">,
  ) {
    return !(field.type === "HEADING" && !field.title && !field.description);
  }

  return (
    <LiquidProvider>
      <LiquidScopeProvider petition={petition}>
        <ThemeProvider theme={theme}>
          <Document>
            {pages.map((page, i) => (
              <Page key={i} style={styles.page}>
                {i === 0 ? (
                  <View style={styles.header}>
                    {theme.showLogo ? (
                      <Image
                        src={petition.organization.logoUrl ?? `${assetsUrl}/static/emails/logo.png`}
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
                <View style={styles.content}>
                  {page
                    .filter((x) => notEmptyHeading(x.field))
                    .map(({ field, logic }) => {
                      return (
                        <LiquidPetitionVariableProvider key={field.id} logic={logic}>
                          <PetitionExportField
                            field={field}
                            replies={field.replies}
                            theme={petition.selectedDocumentTheme.data as PdfDocumentTheme}
                            isPetition={petition.__typename === "Petition"}
                            includeNetDocumentsLinks={includeNetDocumentsLinks}
                            fieldLogic={logic}
                          />
                        </LiquidPetitionVariableProvider>
                      );
                    })}
                </View>
                {i === pages.length - 1 &&
                showSignatureBoxes &&
                petition.__typename === "Petition" &&
                isDefined(petition.currentSignatureRequest) ? (
                  <SignaturesBlock
                    signatureConfig={petition.currentSignatureRequest.signatureConfig}
                    templateId={petition.fromTemplate?.id ?? null}
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

interface PetitionExportFieldProps {
  theme: PdfDocumentTheme;
  field: PetitionExport_PetitionFieldFragment;
  replies: PetitionExport_PetitionFieldReplyFragment[];
  includeNetDocumentsLinks?: boolean;
  isPetition: boolean;
  styles?: ReactPDF.Styles;
  fieldLogic?: FieldLogicResult;
}

function PetitionExportField({
  includeNetDocumentsLinks,
  theme,
  field,
  replies,
  isPetition,
  styles: stylesOverwrite,
  fieldLogic,
}: PetitionExportFieldProps) {
  const intl = useIntl();
  const styles = StyleSheet.create({
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
    groupName: {
      fontWeight: 400,
      marginBottom: "2mm",
    },
    ...stylesOverwrite,
  });

  const liquidRender = useLiquidRender();
  const approxNumberLines =
    (field.description ? approxTextHeight(liquidRender(field.description)) : 0) +
    sumBy(replies, (r) =>
      field.type === "TEXT"
        ? approxTextHeight(r.content.value ?? "")
        : field.type === "CHECKBOX"
          ? sumBy(r.content.value as string[], (v) => approxTextHeight(v))
          : 1,
    ) +
    // more space for activity
    sumBy(replies, () => (field.showActivityInPdf ? 3 : 0)) +
    // space for separation between replies
    (replies.length > 1 ? (replies.length - 1) * 1 : 0);

  // move FILE replies with errors to the bottom of the card
  const orderedReplies = isFileTypeField(field.type)
    ? sortBy(replies, (r) => isDefined(r.content.error))
    : replies;

  return (
    <View>
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
        <View
          style={field.type === "FIELD_GROUP" ? undefined : styles.field}
          wrap={field.type === "FIELD_GROUP" || approxNumberLines > 25 ? true : false}
        >
          {field.title ? (
            <Text style={[styles.text, styles.fieldTitle]}>{cleanupText(field.title)}</Text>
          ) : null}
          {field.description ? (
            <View style={[styles.text, styles.fieldDescription, { marginTop: "2mm" }]}>
              <FieldDescription description={field.description} />
            </View>
          ) : null}
          <View style={styles.fieldReplies}>
            {zip(
              orderedReplies,
              fieldLogic?.groupChildrenLogic ?? times(orderedReplies.length, () => undefined),
            ).map(([reply, groupLogic], replyNumber) => (
              <View key={reply.id}>
                {isFileTypeField(field.type) ? (
                  !isDefined(reply.content.error) ? (
                    <View
                      style={[
                        {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <Text style={[styles.text]}>
                        {`${reply.content.filename} - ${fileSize(intl, reply.content.size)}`}
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
                      {includeNetDocumentsLinks && reply.metadata.EXTERNAL_ID_CUATRECASAS ? (
                        <NetDocumentsExternalLink
                          variant="button"
                          style={{ marginLeft: "1mm" }}
                          externalId={reply.metadata.EXTERNAL_ID_CUATRECASAS}
                        />
                      ) : null}
                    </View>
                  ) : field.type === "ES_TAX_DOCUMENTS" ? (
                    <View>
                      <Text style={[styles.text]}>
                        {reply.content.request.model.type}{" "}
                        <FormattedMessage
                          id="document.petition-export.file-not-found"
                          defaultMessage="(Not found)"
                        />
                      </Text>
                    </View>
                  ) : null
                ) : field.type === "DYNAMIC_SELECT" ? (
                  <View>
                    {(reply.content.value as [string, string | null][]).map(([label, value], i) => (
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
                    ))}
                  </View>
                ) : field.type === "CHECKBOX" ? (
                  <View>
                    {(reply.content.value as [string]).map((value, i) => (
                      <Text style={[styles.text]} key={i}>
                        {value}
                      </Text>
                    ))}
                  </View>
                ) : field.type === "NUMBER" ? (
                  <Text style={[styles.text]}>
                    {formatNumberWithPrefix(intl, reply.content.value, field!.options)}
                  </Text>
                ) : field.type === "DATE" ? (
                  <Text style={[styles.text]}>
                    {intl.formatDate(reply.content.value, {
                      ...FORMATS.L,
                      timeZone: "UTC",
                    })}
                  </Text>
                ) : field.type === "DATE_TIME" ? (
                  <Text style={[styles.text]}>
                    {`${intl.formatDate(reply.content.value, {
                      ...FORMATS["L+LT"],
                      timeZone: reply.content.timezone,
                    })} (${prettifyTimezone(reply.content.timezone)})`}
                  </Text>
                ) : field.type === "PHONE" ? (
                  <Text style={[styles.text]}>{reply.content.value}</Text>
                ) : field.type === "FIELD_GROUP" ? (
                  <View style={{ ...styles.field, marginBottom: "5mm" }}>
                    <Text style={[styles.text, styles.groupName]}>
                      {titleize(field.options.groupName ?? "") ||
                        intl.formatMessage({
                          id: "document.petition-export.default-group-name",
                          defaultMessage: "Reply",
                        })}{" "}
                      {replyNumber + 1}
                    </Text>
                    {zip(reply.children ?? [], groupLogic!).map(([child, logic]) => (
                      <LiquidPetitionVariableProvider key={field.id} logic={logic}>
                        <PetitionExportField
                          key={`${field.id}-${child.field.id}`}
                          styles={{ field: { border: "unset" } }}
                          field={child.field}
                          replies={child.replies.map((r) => ({
                            ...r,
                            children: null,
                          }))}
                          isPetition={isPetition}
                          theme={theme}
                          includeNetDocumentsLinks={includeNetDocumentsLinks}
                        />
                      </LiquidPetitionVariableProvider>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.text]}>{reply.content.value}</Text>
                )}
                {isPetition && field.showActivityInPdf ? (
                  <FieldActivity reply={reply} style={styles.text} />
                ) : null}
              </View>
            ))}
            {replies.length === 0 ? (
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
  );
}

function approxTextHeight(text: string) {
  let lines = 1;
  let current = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n" || ++current > 80) {
      lines++;
      current = 0;
    }
  }
  return lines;
}

function groupFieldsByPages<T extends PetitionExport_PetitionBaseFragment>(
  petition: T,
): { field: UnwrapArray<typeof petition.fields>; logic: FieldLogicResult }[][] {
  const fieldLogic = evaluateFieldLogic({
    fields: petition.fields.map((field) => ({
      ...pick(field, ["id", "type", "options", "math", "visibility"]),
      replies: field.replies.map((reply) => ({
        content: reply.content,
        anonymized_at: reply.isAnonymized ? new Date() : null,
        children:
          reply.children?.map((child) => ({
            field: pick(child.field, ["id"]),
            replies: child.replies.map((r) => ({
              content: r.content,
              anonymized_at: r.isAnonymized ? new Date() : null,
            })),
          })) ?? null,
      })),
      children:
        field.children?.map((child) => ({
          ...pick(child, ["id", "type", "options", "math", "visibility", "parent"]),
          replies: child.replies.map((reply) => ({
            content: reply.content,
            anonymized_at: reply.isAnonymized ? new Date() : null,
          })),
        })) ?? null,
    })),
    variables: petition.variables.map((v) => ({
      name: v.name,
      default_value: v.defaultValue,
    })),
    custom_lists: petition.customLists,
  });

  const pages: { field: UnwrapArray<typeof petition.fields>; logic: FieldLogicResult }[][] = [];
  let page: { field: UnwrapArray<typeof petition.fields>; logic: FieldLogicResult }[] = [];

  for (const [field, logic] of zip(petition.fields, fieldLogic)) {
    if (field.showInPdf) {
      if (field.type === "HEADING" && field.options!.hasPageBreak) {
        if (page.length > 0) {
          pages.push(page);
          page = [];
        }
      }
      if (logic.isVisible) {
        if (field.type === "FIELD_GROUP") {
          page.push({
            field: {
              ...field,
              replies: zip(field.replies, logic.groupChildrenLogic!).map(
                ([reply, childrenLogic]) => ({
                  ...reply,
                  children: zip(reply.children!, childrenLogic)
                    .filter(([child, { isVisible }]) => isVisible && child.field.showInPdf)
                    .map(([r]) => r),
                }),
              ),
            },
            logic: {
              ...logic,
              groupChildrenLogic: logic.groupChildrenLogic!.map((g) =>
                g.filter(({ isVisible }) => isVisible),
              ),
            } as any,
          });
        } else {
          page.push({ field, logic });
        }
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
          ...PetitionExport_PetitionField
          replies {
            ...PetitionExport_PetitionFieldReply
          }
        }
        organization {
          name
          logoUrl
        }
        selectedDocumentTheme {
          data
        }
        ... on Petition {
          fromTemplate {
            id
          }
          currentSignatureRequest {
            signatureConfig {
              ...SignaturesBlock_SignatureConfig
            }
          }
        }
        ...LiquidScopeProvider_PetitionBase
        variables {
          name
          defaultValue
        }
        customLists {
          name
          values
        }
        __typename
      }
      ${this.PetitionField}
      ${this.PetitionFieldReply}
      ${SignaturesBlock.fragments.SignatureConfig}
      ${LiquidScopeProvider.fragments.PetitionBase}
    `;
  },
  get PetitionFieldInner() {
    return gql`
      fragment PetitionExport_PetitionFieldInner on PetitionField {
        id
        type
        title
        options
        description
        showInPdf
        showActivityInPdf
        visibility
        math
        options
      }
    `;
  },
  get PetitionFieldReplyInner() {
    return gql`
      fragment PetitionExport_PetitionFieldReplyInner on PetitionFieldReply {
        id
        status
        content
        metadata
        isAnonymized
        ...FieldActivity_PetitionFieldReply
      }
      ${FieldActivity.fragments.PetitionFieldReply}
    `;
  },
  get PetitionField() {
    return gql`
      fragment PetitionExport_PetitionField on PetitionField {
        ...PetitionExport_PetitionFieldInner
        children {
          ...PetitionExport_PetitionFieldInner
          parent {
            id
          }
          replies {
            ...PetitionExport_PetitionFieldReplyInner
          }
        }
      }
      ${this.PetitionFieldInner}
      ${this.PetitionFieldReplyInner}
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment PetitionExport_PetitionFieldReply on PetitionFieldReply {
        ...PetitionExport_PetitionFieldReplyInner
        children {
          field {
            ...PetitionExport_PetitionField
          }
          replies {
            ...PetitionExport_PetitionFieldReplyInner
          }
        }
      }
      ${this.PetitionFieldReplyInner}
      ${this.PetitionField}
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
