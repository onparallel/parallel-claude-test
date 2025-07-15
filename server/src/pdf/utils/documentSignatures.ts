import gql from "graphql-tag";
import { outdent } from "outdent";
import { IntlShape } from "react-intl";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { ContactLocale } from "../../db/__types";
import { PdfDocumentTheme } from "../../util/PdfDocumentTheme";
import { FORMATS } from "../../util/dates";
import { SlateNode } from "../../util/slate/render";
import { paragraphIsEmpty } from "../../util/slate/utils";
import { hashString } from "../../util/token";
import { documentSignatures_SignatureConfigFragment } from "../__types";
import { getHardcodedSignatures } from "./hadrcodedSignatures";

export function documentSignatures(
  signatureConfig: documentSignatures_SignatureConfigFragment,
  { theme, intl, templateId }: { theme: PdfDocumentTheme; intl: IntlShape; templateId?: string },
) {
  const date = intl.formatDate(new Date(), {
    timeZone: signatureConfig.timezone,
    ...FORMATS.LL,
  });

  const someHasEmbeddedImage = signatureConfig.signers!.some((s) =>
    isNonNullish(s?.embeddedSignatureImage),
  );

  const signers: { fullName: string; signatureImageUrl?: string; wordAnchor?: string }[] =
    someHasEmbeddedImage
      ? signatureConfig.signers!.map((signer, i) => ({
          wordAnchor: `3cb39pzCQA9wJ${i}`,
          fullName: signer!.fullName,
          signatureImageUrl: signer!.embeddedSignatureImage?.url ?? null,
        }))
      : [
          ...(process.env.NODE_ENV === "production" && isNonNullish(templateId)
            ? getHardcodedSignatures(templateId)
            : []),
          ...signatureConfig.signers!.map((s, i) => ({
            fullName: s!.fullName,
            wordAnchor: `3cb39pzCQA9wJ${i}`,
          })),
        ];

  const legalTextSlate = theme.legalText[intl.locale as ContactLocale];

  return [
    ...(legalTextSlate ? legalText(legalTextSlate) : []),
    outdent`
    #show: columns.with(1)
    #let signature(
      name,
      date,
      anchor,
      signature: [],
    ) = context [
      #box(
        width: 100%,
        height: 100%,
        radius: 1.5mm,
        stroke: rgb("#CBD5E0"),
        [
          #set text(size: 10pt)
          #grid(
            align: center,
            columns: (1fr),
            rows:(1fr, auto, auto),
            grid.cell(
              inset: 1pt,
              context layout(size => {
                let position = here().position()
                if (signature == []) {
                  [
                    #place(
                      top + left,
                      dy: 1pt,
                      text(stroke: white, anchor)
                    )
                    #metadata((
                      page: position.page,
                      x: calc.round(position.x.mm(), digits: 2),
                      y: calc.round(position.y.mm(), digits: 2),
                      height: calc.round(size.height.mm(), digits: 2),
                      width: calc.round(size.width.mm(), digits: 2),
                    )) <signature>
                  ]
                } else {
                  signature
                }
              }
            )),
            grid.cell(inset: (top: 2mm, x: 2mm), name),
            grid.cell(inset: (y: 2mm), date),
          )
        ]
      )
    ]
    #grid(
      columns: (1fr, 1fr, 1fr),
      rows: (36mm),
      gutter: 5mm,
      ${signers
        .map(
          (s) => outdent`
            signature(${[
              JSON.stringify(s.fullName),
              JSON.stringify(date),
              s.wordAnchor ? JSON.stringify(s.wordAnchor) : "[]",
              s.signatureImageUrl
                ? `signature: prequery.image(${JSON.stringify(s.signatureImageUrl!)}, ${JSON.stringify(`assets/${hashString(s.signatureImageUrl!)}`)})`
                : null,
            ]
              .filter(isNonNullish)
              .join(", ")})
            `,
        )
        .join(",\n")
        .replaceAll(/\n/g, "\n  ")}
    )
    `,
  ];
}

documentSignatures.fragments = {
  SignatureConfig: gql`
    fragment documentSignatures_SignatureConfig on SignatureConfig {
      signers {
        fullName
        email
        embeddedSignatureImage
      }
      timezone
    }
  `,
};

function legalText(nodes: SlateNode[]) {
  function inlineNode(node: SlateNode): string {
    if (node.type === "link") {
      return `#link(${JSON.stringify(node.url)})[${node.children!.map((n) => inlineNode(n)).join("")}]`;
    } else {
      assert("text" in node, "SlateNode is text");
      let text = `#${JSON.stringify(node.text)}`;
      if (node.bold) {
        text = `*${text}*`;
      }
      if (node.italic) {
        text = `_${text}_`;
      }
      if (node.underline) {
        text = `#underline(${text})`;
      }
      return text;
    }
  }
  return nodes.flatMap((node, i) => {
    return paragraphIsEmpty(node)
      ? ["#linebreak()"]
      : [...(i > 0 ? ["#linebreak()"] : []), node.children!.map((n) => inlineNode(n)).join("")];
  });
}
