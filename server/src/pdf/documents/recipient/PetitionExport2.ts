import { Tokens, marked } from "@onparallel/marked-do-not-use";
import gql from "graphql-tag";
import { Liquid } from "liquidjs";
import { outdent } from "outdent";
import { IntlShape } from "react-intl";
import { isNonNull, isNonNullish, sortBy, times, zip } from "remeda";
import { assert } from "ts-essentials";
import { PdfDocumentTheme } from "../../../util/PdfDocumentTheme";
import { FORMATS, prettifyTimezone } from "../../../util/dates";
import { FieldLogicResult } from "../../../util/fieldLogic";
import { fileSize } from "../../../util/fileSize";
import { formatNumberWithPrefix } from "../../../util/formatNumberWithPrefix";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { createLiquid } from "../../../util/liquid";
import { never } from "../../../util/never";
import { titleize } from "../../../util/strings";
import { UnwrapArray } from "../../../util/types";
import {
  PetitionExport2_PetitionBaseFragment,
  PetitionExport2_PetitionFieldFragment,
  PetitionExport2_PetitionFieldReplyInnerFragment,
  PetitionExport2_petitionDocument,
} from "../../__types";
import { documentSignatures } from "../../utils/documentSignatures";
import { evaluateFieldLogic } from "../../utils/fieldLogic";
import {
  LiquidPetitionScopeProvider,
  buildPetitionFieldsLiquidScope,
} from "../../utils/liquid/LiquidPetitionScopeProvider";
import { buildPetitionVariablesLiquidScope } from "../../utils/liquid/LiquidPetitionVariableProvider";
import { PdfDocument, PdfDocumentGetPropsContext } from "../../utils/pdf";
import { block, box, element, heading, image, t, text, tt } from "../../utils/typst";

export interface PetitionExportInitialData {
  assetsUrl: string;
  petitionId: string;
  documentTitle: string | null;
  showSignatureBoxes?: boolean;
  includeNetDocumentsLinks?: boolean;
}

export interface PetitionExportProps extends Omit<PetitionExportInitialData, "petitionId"> {
  petition: PetitionExport2_PetitionBaseFragment;
}

function PetitionExport2(
  {
    assetsUrl,
    documentTitle,
    showSignatureBoxes,
    includeNetDocumentsLinks,
    petition,
  }: PetitionExportProps,
  intl: IntlShape,
) {
  const theme = petition.selectedDocumentTheme.data as PdfDocumentTheme;
  const liquid = createLiquid();
  const scope = buildPetitionFieldsLiquidScope(petition, intl);
  const doubleColumn = theme.doubleColumn;
  const columnGutter = 10;
  const DEBUG = false;
  return [
    outdent`
    #import "@preview/prequery:0.1.0"
    #set document(
      title: ${JSON.stringify(documentTitle ?? "")},
      author: "Parallel (www.onparallel.com)"
    )
    #set page(
      margin: (
        top: ${theme.marginTop}mm,
        right: ${theme.marginRight}mm,
        bottom: ${theme.marginBottom}mm,
        left: ${theme.marginLeft}mm,
      ),
      footer: context [
        #set align(right)
        #set text(${theme.textFontSize}pt)
        #counter(page).display("1")
      ]
    )
    #show heading: set block(
      below: 1em,
      inset: (top: 0.4em)
    )
    #set text(
      font: (${JSON.stringify(theme.textFontFamily)}, "Noto Emoji"),
      fill: rgb(${JSON.stringify(theme.textColor)}),
      size: ${theme.textFontSize}pt,
      lang: ${JSON.stringify(intl.locale)},
    )
    #show heading: set text(
      font: (${JSON.stringify(theme.title2FontFamily)}, "Noto Emoji"),
      size: ${theme.title2FontSize}pt * 14/16,
      fill: rgb(${JSON.stringify(theme.title2Color)}),
    )
    #show heading.where(
      level: 1
    ): set text(
      size: ${theme.title2FontSize}pt,
    )
    #let hint = (content) => text(
      style: "italic",
      fill: rgb(${JSON.stringify(theme.textColor)}).transparentize(30%),
      content
    )
    #set block(spacing: 2.1em)
    #set par(
      leading: 0.7em,
      justify: true,
    )
    #set list(indent: 1em)
    #set enum(indent: 0.5em)
    #set table(
      stroke: (top: none, right: none, bottom: rgb("#e2e8f0"), left: none),
      inset: (y: ${theme.textFontSize * 0.2}mm, x: ${theme.textFontSize * 0.15}mm),
    )
    #show table: set block(
      above: 0.3em,
      below: 0.3em,
    )
    #show table: set text(
      size: ${theme.textFontSize * 0.75}pt,
    )
    #show table.cell: it => {
      if it.y == 0 {
        strong(upper(text(fill: rgb(${JSON.stringify(theme.textColor)}).transparentize(20%), it)))
      } else {
        it
      }
    }
    #show link: underline
    #show link: set text(fill: rgb("#5650de"))
    #let mpagebreak = () => context {
      let left = ${theme.marginLeft}mm
      let right = ${theme.marginRight}mm
      let gutter = ${columnGutter}mm
      let numColumns = ${doubleColumn ? 2 : 1}
      let columnWidth = (page.width - left - right - gutter * (numColumns - 1)) / numColumns
      let currentCol = calc.floor((here().position().x + 1e-10mm - left)/(columnWidth + gutter))
      hide(place()[.])
      for _ in range(numColumns - currentCol) {
        colbreak()
      }
    }
    #let handleColumnBreaks = (
      minGapBreak: 3cm,
      minBlockBreak: 5cm,
      content
    ) => layout(((width, )) => {
      let (height,) = measure(block(width: width, content))
      context {
        let gap = (page.height - ${theme.marginBottom}mm) - here().position().y
        ${DEBUG ? "place([gap: #gap.mm(), height: #height.mm()])" : ""}
        if (gap > height) {
          // si cabe, cabe
          content
        } else if (gap < minGapBreak) {
          // si quedan menos de minGapBreak, columna nueva
          [
            #hide(place()[.])
            #colbreak()
            #content
          ]
        } else if (height < minBlockBreak) {
          // si es un bloque pequeño que quedara partido, columna nueva
          [
            #hide(place()[.])
            #colbreak()
            #content
          ]
        } else {
          content
        }
      }
    })
    `,
    ...(theme.showLogo || documentTitle
      ? block(
          { below: "12mm" },
          ...(theme.showLogo
            ? block(
                { width: "100%" },
                outdent`
                #set align(center)
                #context {
                  let url = ${JSON.stringify(petition.organization.logoUrl ?? `${assetsUrl}/static/emails/logo.png`)}
                  let path = ${JSON.stringify(petition.organization.logoUrl ? "assets/logo" : "assets/logo.png")}
                  let image = prequery.image(url, path)
                  let size = measure(image)
                  let ratio = 84 / 50
                  if (size.width / size.height > ratio) {
                    prequery.image(url, path, width: 84mm)
                  } else {
                    prequery.image(url, path, height: 50mm)
                  }
                }
                `,
              )
            : []),
          ...(documentTitle
            ? block(
                { width: "100%", above: theme.showLogo ? "12mm" : "0mm" },
                "#set align(center)",
                ...text(
                  {
                    font: `(${JSON.stringify(theme.title1FontFamily)}, "Noto Emoji")`,
                    size: `${theme.title1FontSize}pt`,
                    fill: `rgb(${JSON.stringify(theme.title1Color)})`,
                    weight: JSON.stringify("semibold"),
                  },
                  t(documentTitle),
                ),
              )
            : []),
        )
      : []),
    "#[",
    ...(doubleColumn ? [`#show: columns.with(2, gutter: ${columnGutter}mm)`] : []),
    ...groupFieldsByPages(petition).flatMap((page, i) => [
      ...(i > 0 ? ["#mpagebreak()"] : []),
      ...page.flatMap(({ field, logic }) =>
        field.type === "HEADING"
          ? field.title || field.description || logic.headerNumber
            ? [
                ...block(
                  { spacing: "2.1em" },
                  ...handleColumnBreaks(
                    ...(field.title || logic.headerNumber
                      ? heading(
                          {
                            numbering: logic.headerNumber
                              ? `_ => "${logic.headerNumber}."`
                              : "none",
                          },
                          t(field.title ?? ""),
                        )
                      : []),
                    ...fieldDescription(field.description, {
                      liquid,
                      scope: { ...scope, ...buildPetitionVariablesLiquidScope(logic) },
                      intl,
                    }),
                  ),
                ),
              ]
            : []
          : field.type === "FIELD_GROUP"
            ? [
                ...block(
                  { above: "2.1em", below: "5mm" },
                  ...handleColumnBreaks(
                    ...(field.title
                      ? heading(
                          { level: "2", numbering: "none", outlined: "false" },
                          t(field.title),
                        )
                      : []),
                    ...fieldDescription(field.description, {
                      liquid,
                      scope: { ...scope, ...buildPetitionVariablesLiquidScope(logic) },
                      intl,
                    }),
                  ),
                ),
                ...zip(field.replies, logic.groupChildrenLogic!).flatMap(
                  ([reply, groupLogic], replyNumber) =>
                    group(
                      ...(field.multiple
                        ? block(
                            { below: "5mm", above: "5cm", inset: "(top: 1mm)" },
                            tt(
                              {},
                              t(
                                titleize(field.options.groupName ?? "") ||
                                  intl.formatMessage({
                                    id: "document.petition-export.default-group-name",
                                    defaultMessage: "Reply",
                                  }),
                              ),
                              " ",
                              `${replyNumber + 1}`,
                            ),
                          )
                        : []),
                      ...zip(reply.children ?? [], groupLogic!).flatMap(([child, logic]) => [
                        ...block(
                          { spacing: "5mm" },
                          ...(child.field.title
                            ? heading(
                                { level: "2", numbering: "none", outlined: "false" },
                                t(child.field.title),
                              )
                            : []),
                          ...fieldDescription(child.field.description, {
                            liquid,
                            scope: { ...scope, ...buildPetitionVariablesLiquidScope(logic) },
                            intl,
                          }),
                          ...fieldReplies(child.field, child.replies, {
                            intl,
                            assetsUrl,
                            includeNetDocumentsLinks,
                          }),
                        ),
                      ]),
                    ),
                ),
              ]
            : group(
                ...(field.title
                  ? heading({ level: "2", numbering: "none", outlined: "false" }, t(field.title))
                  : []),
                ...fieldDescription(field.description, {
                  liquid,
                  scope: { ...scope, ...buildPetitionVariablesLiquidScope(logic) },
                  intl,
                }),
                ...fieldReplies(field, field.replies, {
                  intl,
                  assetsUrl,
                  includeNetDocumentsLinks,
                }),
              ),
      ),
    ]),
    "]",
    ...(showSignatureBoxes &&
    petition.__typename === "Petition" &&
    isNonNullish(petition.currentSignatureRequest)
      ? documentSignatures(petition.currentSignatureRequest.signatureConfig, {
          intl,
          theme,
          templateId: petition.fromTemplate?.id,
        })
      : []),
  ].join("\n");
}

const handleColumnBreaks = element("handleColumnBreaks");

function group(...content: string[]) {
  return block(
    { spacing: "5mm" },
    ...handleColumnBreaks(
      ...block(
        {
          width: "100%",
          radius: "1.5mm",
          inset: "(x: 4.2mm, top: 3.6mm, bottom: 4.2mm)",
          stroke: 'rgb("#CBD5E0")',
          spacing: "0em",
        },
        ...content,
      ),
    ),
  );
}

function fieldReplies(
  field: PetitionExport2_PetitionFieldFragment,
  replies: PetitionExport2_PetitionFieldReplyInnerFragment[],
  {
    intl,
    assetsUrl,
    includeNetDocumentsLinks,
  }: {
    intl: IntlShape;
    assetsUrl: string;
    includeNetDocumentsLinks?: boolean;
  },
) {
  const orderedReplies = sortBy(
    replies.filter((r) => r.status !== "REJECTED"),
    (r) => isNonNullish(r.content.error),
  );
  return [
    ...orderedReplies.flatMap((reply) =>
      block(
        { spacing: "5mm" },
        ...fieldReply(field, reply, { intl, assetsUrl, includeNetDocumentsLinks }),
        // activity
        ...((isNonNullish(field.parent) && field.parent.showActivityInPdf) ||
        (field.showActivityInPdf && field.type !== "FIELD_GROUP")
          ? [
              ...block(
                { above: "0.8em" },
                tt(
                  { size: "0.8em" },
                  `#hint([${intl.formatMessage(
                    {
                      id: "document.petition-export.reply-updated-by",
                      defaultMessage: "Reply by {name} on {date}",
                    },
                    {
                      name:
                        reply.repliedBy?.__typename === "PetitionAccess"
                          ? reply.repliedBy.contact
                            ? t(reply.repliedBy.contact.fullName)
                            : t(
                                intl.formatMessage({
                                  id: "generic.deleted-contact",
                                  defaultMessage: "Deleted Contact",
                                }),
                              )
                          : isNonNullish(reply.repliedBy)
                            ? t(reply.repliedBy.fullName ?? "")
                            : t(
                                intl.formatMessage({
                                  id: "generic.deleted-user",
                                  defaultMessage: "Deleted user",
                                }),
                              ),
                      date: intl.formatDate(reply.repliedAt!, {
                        timeZone: "UTC",
                        timeZoneName: "short",
                        ...FORMATS.LLL,
                      }),
                    },
                  )}])`,
                ),
              ),
              ...(isNonNullish(reply.lastReviewedBy) &&
              reply.status === "APPROVED" &&
              field.requireApproval
                ? block(
                    { above: "0.5em" },
                    tt(
                      { size: "0.8em" },
                      `#hint([${intl.formatMessage(
                        {
                          id: "document.petition-export.reply-approved-by",
                          defaultMessage: "Approved by {name} on {date}",
                        },
                        {
                          name: t(reply.lastReviewedBy?.fullName ?? ""),
                          date: intl.formatDate(reply.repliedAt!, {
                            timeZone: "UTC",
                            timeZoneName: "short",
                            ...FORMATS.LLL,
                          }),
                        },
                      )}])`,
                    ),
                  )
                : []),
            ]
          : []),
      ),
    ),
    ...(orderedReplies.length === 0
      ? [
          ...block(
            `#hint([${
              isFileTypeField(field.type)
                ? t(
                    intl.formatMessage({
                      id: "document.petition-export.no-files",
                      defaultMessage: "No files have been submitted.",
                    }),
                  )
                : t(
                    intl.formatMessage({
                      id: "document.petition-export.no-replies",
                      defaultMessage: "No replies have been submitted.",
                    }),
                  )
            }])`,
          ),
        ]
      : []),
  ];
}

function fieldReply(
  field: PetitionExport2_PetitionFieldFragment,
  reply: PetitionExport2_PetitionFieldReplyInnerFragment,
  {
    intl,
    assetsUrl,
    includeNetDocumentsLinks,
  }: { intl: IntlShape; assetsUrl: string; includeNetDocumentsLinks?: boolean },
) {
  switch (field.type) {
    case "TEXT":
    case "SHORT_TEXT":
    case "PHONE":
      return [t(reply.content.value)];
    case "SELECT":
      if (isNonNullish(field.options.labels)) {
        const index = (field.options.values as string[]).indexOf(reply.content.value);
        const label = (field.options.labels as string[])[index];
        if (index >= 0) {
          return [t(label)];
        }
      }
      return [t(reply.content.value)];
    case "CHECKBOX":
      return (reply.content.value as string[])
        .map((value) => {
          if (isNonNullish(field.options.labels)) {
            const index = (field.options.values as string[]).indexOf(value);
            const label = (field.options.labels as string[])[index];
            if (index >= 0) {
              return t(label);
            }
          }
          return value;
        })
        .flatMap((value, i) => [...(i > 0 ? ["#linebreak()", value] : [value])]);
    case "DYNAMIC_SELECT":
      return (reply.content.value as [string, string | null][])
        .map(
          ([label, value]) =>
            `${t(label)}: ${
              value
                ? t(value)
                : `#hint([${t(
                    intl.formatMessage({
                      id: "document.petition-export.no-replies",
                      defaultMessage: "No replies have been submitted.",
                    }),
                  )}])`
            }`,
        )
        .flatMap((value, i) => [...(i > 0 ? ["#linebreak()", value] : [value])]);
    case "NUMBER":
      return [t(formatNumberWithPrefix(intl, reply.content.value, field.options))];
    case "DATE":
      return [
        t(
          intl.formatDate(reply.content.value, {
            ...FORMATS.L,
            timeZone: "UTC",
          }),
        ),
      ];
    case "DATE_TIME":
      return [
        t(
          `${intl.formatDate(reply.content.value, {
            ...FORMATS["L+LT"],
            timeZone: reply.content.timezone,
          })} (${prettifyTimezone(reply.content.timezone)})`,
        ),
      ];
    case "FILE_UPLOAD":
    case "ES_TAX_DOCUMENTS":
    case "DOW_JONES_KYC":
      if (isNonNullish(reply.content.error)) {
        assert(field.type === "ES_TAX_DOCUMENTS");
      } else {
        return [
          tt(
            {},
            t(reply.content.filename),
            " - ",
            t(fileSize(intl, reply.content.size)),
            ...(includeNetDocumentsLinks && isNonNullish(reply.metadata.EXTERNAL_ID_CUATRECASAS)
              ? [
                  "#h(1mm)",
                  `#link(${JSON.stringify(`https://eu.netdocuments.com/neWeb2/goid.aspx?id=${reply.metadata.EXTERNAL_ID_CUATRECASAS}`)})[`,
                  ...box(
                    {
                      width: "18pt",
                      height: "18pt",
                      stroke: 'rgb("#CBD5E0")',
                      radius: "1.5mm",
                      baseline: "25%",
                    },
                    ...image(`${assetsUrl}/static/logos/netdocuments.png`, {
                      format: '"png"',
                      alt: '"NetDocuments"',
                    }),
                  ),
                  "]",
                ]
              : []),
          ),
        ];
      }
      return [];

    case "ID_VERIFICATION":
      if (reply.content.type === "identity-verification") {
        return [
          t(
            intl.formatMessage({
              id: "document.petition-export.identity-verification-header",
              defaultMessage: "Identity Verification",
            }),
          ),
          isNonNullish(reply.content.error)
            ? t(
                intl.formatMessage({
                  id: "document.petition-export.file-not-found",
                  defaultMessage: "(Not found)",
                }),
              )
            : null,
        ].filter(isNonNull);
      } else if (reply.content.type === "identity-verification-selfie") {
        return [
          t(
            intl.formatMessage({
              id: "document.petition-export.identity-verification-selfie-header",
              defaultMessage: "Identity Verification (Proof of life)",
            }),
          ),
          isNonNullish(reply.content.error)
            ? t(
                intl.formatMessage({
                  id: "document.petition-export.file-not-found",
                  defaultMessage: "(Not found)",
                }),
              )
            : null,
        ].filter(isNonNull);
      }
      return [];
    case "HEADING":
    case "FIELD_GROUP":
    case "BACKGROUND_CHECK":
    default:
      console.log(field);
      return never();
  }
}

function fieldDescription(
  description: string | null,
  { liquid, scope, intl }: { liquid: Liquid; scope: Record<string, any>; intl: IntlShape },
) {
  if (description === null) {
    return [];
  }
  if (description.includes("{{") || description.includes("{%")) {
    try {
      description = liquid.parseAndRenderSync(description, scope, { globals: { intl } });
    } catch (e) {
      description = "";
    }
    assert(isNonNullish(description));
  }
  // after liquid there might be initial linebreaks, trim those
  description = description.trim();
  const tokens = marked.lexer(description);
  return tokens.flatMap((t, i) =>
    t.type === "heading"
      ? [
          ...heading(
            { level: `${t.depth}`, outlined: "false" },
            mdInlineContent({ tokens: t.tokens as InlineToken[] }),
          ),
          ...trailingNewLines({ raw: t.raw }),
        ]
      : t.type === "paragraph"
        ? t.tokens && t.tokens.length === 1 && t.tokens[0].type === "image"
          ? block(
              { width: "100%" },
              "#set align(center)",
              ...image(t.tokens[0].href, { alt: JSON.stringify(t.tokens[0].text), width: "75%" }),
            )
          : [
              mdInlineContent({ tokens: t.tokens as InlineToken[] }),
              // if next token is a paragraph needs an extra empty line in between
              ...(i < tokens.length - 1 && ["paragraph", "space"].includes(tokens[i + 1].type)
                ? [""]
                : []),
            ]
        : t.type === "list"
          ? mdList({ token: t as Tokens.List })
          : t.type === "table"
            ? [...mdTable({ token: t as Tokens.Table }), ...trailingNewLines({ raw: t.raw })]
            : t.type === "space"
              ? times((t.raw.match(/\n/g)?.length ?? 1) - 2, () => "#linebreak()")
              : t.type === "hr"
                ? [
                    '#line(length: 100%, stroke: 1pt + rgb("#e2e8f0"))',
                    ...trailingNewLines({ raw: t.raw }),
                  ]
                : `#text(${JSON.stringify(JSON.stringify(t))})`,
  );
}

type InlineToken =
  | Tokens.HTML
  | Tokens.Text
  | Tokens.Link
  | Tokens.Codespan
  | Tokens.Strong
  | Tokens.Em
  | Tokens.Del
  | Tokens.Space
  | Tokens.Image;

function mdInlineContent({ tokens }: { tokens: InlineToken[] }) {
  return tokens.map((t) => mdInline({ token: t })).join("");
}

function mdInline({ token }: { token: InlineToken }): string {
  if (token.type === "space") {
    return "{space}";
  }
  const content =
    "tokens" in token && token.tokens !== undefined
      ? token.tokens.map((t) => mdInline({ token: t as InlineToken })).join("")
      : // use .raw as .text html-escapes some characters
        token.raw.replaceAll(/\t/g, " ".repeat(4));
  return token.type === "strong"
    ? `*${content}*`
    : token.type === "em"
      ? `_${content}_`
      : token.type === "del"
        ? `#strike([${content}])`
        : token.type === "link"
          ? `#link(${JSON.stringify(token.href)})[${content}]`
          : `#${JSON.stringify(content)}`;
}

function mdList({ token }: { token: Tokens.List }) {
  function renderList(list: Tokens.List, level = 0): string[] {
    return list.items.flatMap((li, i) =>
      li.tokens.flatMap((t, j) => {
        if (t.type === "list") {
          return renderList(t as Tokens.List, level + 1);
        } else {
          return t.type === "text"
            ? [
                "  ".repeat(level),
                j === 0
                  ? list.ordered
                    ? `${(typeof list.start === "number" ? list.start : 1) + i}. `
                    : "- "
                  : "  ",
                mdInlineContent({ tokens: (t as Tokens.Text).tokens as InlineToken[] }),
              ].join("")
            : t.type === "space"
              ? [
                  "",
                  ...times(
                    (t.raw.match(/\n/g)?.length ?? 1) - 2,
                    () => "  ".repeat(level + 1) + "#linebreak()",
                  ),
                ]
              : [JSON.stringify(t)];
        }
      }),
    );
  }
  return renderList(token);
}

function mdTable({ token }: { token: Tokens.Table }) {
  const columns = token.header.length;
  return outdent`
    #table(
      columns: (${times(columns, () => "1fr").join(", ")}),
      align: (${token.align.map((align) => align ?? "left").join(", ")}),
      ${token.header.map((t) => `[${mdInlineContent({ tokens: t.tokens as InlineToken[] })}]`).join(", ")},
      ${token.rows.map((row) => row.map((t) => `[${mdInlineContent({ tokens: t.tokens as InlineToken[] })}]`).join(", ")).join(",\n  ")}
    )
  `.split("\n");
}

function trailingNewLines({ raw }: { raw: string }) {
  const newLines = raw.match(/\n+$/)?.[0].match(/\n/g)?.length ?? 1;
  return newLines === 1 ? [] : times(newLines - 1, () => "#linebreak()");
}

function groupFieldsByPages<T extends PetitionExport2_PetitionBaseFragment>(
  petition: T,
): { field: UnwrapArray<typeof petition.fields>; logic: FieldLogicResult }[][] {
  const fieldLogic = evaluateFieldLogic(petition);

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

PetitionExport2.TYPST = true;

PetitionExport2.fragments = {
  get PetitionBase() {
    return gql`
      fragment PetitionExport2_PetitionBase on PetitionBase {
        id
        name
        fields {
          ...PetitionExport2_PetitionField
          replies {
            ...PetitionExport2_PetitionFieldReply
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
              ...documentSignatures_SignatureConfig
            }
          }
        }
        ...LiquidPetitionScopeProvider_PetitionBase
        __typename
      }
      ${this.PetitionField}
      ${this.PetitionFieldReply}
      ${documentSignatures.fragments.SignatureConfig}
      ${LiquidPetitionScopeProvider.fragments.PetitionBase}
    `;
  },
  get PetitionFieldInner() {
    return gql`
      fragment PetitionExport2_PetitionFieldInner on PetitionField {
        id
        type
        title
        options
        description
        showInPdf
        showActivityInPdf
        visibility
        math
        multiple
        requireApproval
      }
    `;
  },
  get PetitionFieldReplyInner() {
    return gql`
      fragment PetitionExport2_PetitionFieldReplyInner on PetitionFieldReply {
        id
        status
        content
        metadata
        isAnonymized
        status
        repliedBy {
          __typename
          ... on User {
            fullName
          }
          ... on PetitionAccess {
            contact {
              fullName
            }
          }
        }
        repliedAt
        lastReviewedBy {
          fullName
        }
        lastReviewedAt
      }
    `;
  },
  get PetitionField() {
    return gql`
      fragment PetitionExport2_PetitionField on PetitionField {
        ...PetitionExport2_PetitionFieldInner
        parent {
          id
          showActivityInPdf
        }
        children {
          ...PetitionExport2_PetitionFieldInner
          parent {
            id
          }
          replies {
            ...PetitionExport2_PetitionFieldReplyInner
          }
        }
      }
      ${this.PetitionFieldInner}
      ${this.PetitionFieldReplyInner}
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment PetitionExport2_PetitionFieldReply on PetitionFieldReply {
        ...PetitionExport2_PetitionFieldReplyInner
        children {
          field {
            ...PetitionExport2_PetitionField
          }
          replies {
            ...PetitionExport2_PetitionFieldReplyInner
          }
        }
      }
      ${this.PetitionFieldReplyInner}
      ${this.PetitionField}
    `;
  },
};

PetitionExport2.queries = [
  gql`
    query PetitionExport2_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...PetitionExport2_PetitionBase
      }
    }
    ${PetitionExport2.fragments.PetitionBase}
  `,
];

PetitionExport2.getProps = async (
  { petitionId, ...rest }: PetitionExportInitialData,
  { client }: PdfDocumentGetPropsContext,
) => {
  const response = await client!.request(PetitionExport2_petitionDocument, {
    petitionId,
  });
  return {
    ...rest,
    petition: response.petition!,
  };
};

export default PetitionExport2 as PdfDocument<
  PetitionExportInitialData,
  PetitionExportProps,
  { signature: { page: number; x: number; y: number; width: number; height: number } }
>;
