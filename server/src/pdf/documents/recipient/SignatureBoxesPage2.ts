import gql from "graphql-tag";
import { outdent } from "outdent";
import { IntlShape } from "react-intl";
import { isNonNullish } from "remeda";
import { PdfDocumentTheme } from "../../../util/PdfDocumentTheme";
import {
  SignatureBoxesPage2_PetitionBaseFragment,
  SignatureBoxesPage_petitionDocument,
} from "../../__types";
import { documentSignatures } from "../../utils/documentSignatures";
import { PdfDocument, PdfDocumentGetProps } from "../../utils/pdf";

export interface SignatureBoxesPageInitialData {
  petitionId: string;
}

export interface SignatureBoxesPageProps extends Omit<SignatureBoxesPageInitialData, "petitionId"> {
  petition: SignatureBoxesPage2_PetitionBaseFragment;
}

function SignatureBoxesPage2({ petition }: SignatureBoxesPageProps, intl: IntlShape) {
  const theme = petition.selectedDocumentTheme.data as PdfDocumentTheme;
  return [
    outdent`
    #import "@preview/prequery:0.1.0"
    #set page(
      margin: (
        top: ${theme.marginTop}mm,
        right: ${theme.marginRight}mm,
        bottom: ${theme.marginBottom}mm,
        left: ${theme.marginLeft}mm,
      ),
    )
    #show heading: set block(
      below: 1em,
      inset: (top: 0.4em)
    )
    #set text(
      font: ${JSON.stringify(theme.textFontFamily)},
      fill: rgb(${JSON.stringify(theme.textColor)}),
      size: ${theme.textFontSize}pt,
      lang: ${JSON.stringify(intl.locale)},
    )
    #set block(spacing: 2.1em)
    #set par(
      leading: 0.7em,
      justify: true,
    )
    #show link: underline
    #show link: set text(fill: rgb("#5650de"))
    `,
    ...(petition.__typename === "Petition" && isNonNullish(petition.currentSignatureRequest)
      ? documentSignatures(petition.currentSignatureRequest.signatureConfig, {
          intl,
          theme,
        })
      : []),
  ].join("\n");
}

SignatureBoxesPage2.TYPST = true;

SignatureBoxesPage2.fragments = {
  get PetitionBase() {
    return gql`
      fragment SignatureBoxesPage2_PetitionBase on PetitionBase {
        selectedDocumentTheme {
          data
        }
        ... on Petition {
          currentSignatureRequest {
            signatureConfig {
              ...documentSignatures_SignatureConfig
            }
          }
        }
        __typename
      }
      ${documentSignatures.fragments.SignatureConfig}
    `;
  },
};

SignatureBoxesPage2.queries = [
  gql`
    query SignatureBoxesPage2_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...SignatureBoxesPage2_PetitionBase
      }
    }
    ${SignatureBoxesPage2.fragments.PetitionBase}
  `,
];

SignatureBoxesPage2.getProps = (async ({ petitionId, ...rest }, { client }) => {
  const response = await client!.request(SignatureBoxesPage_petitionDocument, {
    petitionId,
  });
  return {
    ...rest,
    petition: response.petition!,
  };
}) as PdfDocumentGetProps<SignatureBoxesPageInitialData, SignatureBoxesPageProps>;

export default SignatureBoxesPage2 as PdfDocument<
  SignatureBoxesPageInitialData,
  SignatureBoxesPageProps,
  { signature: { page: number; x: number; y: number; width: number; height: number } }
>;
