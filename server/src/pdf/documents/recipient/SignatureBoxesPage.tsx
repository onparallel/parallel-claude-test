import { Document, Page, StyleSheet } from "@react-pdf/renderer";
import gql from "graphql-tag";
import { PdfDocumentTheme } from "../../../util/PdfDocumentTheme";
import {
  SignatureBoxesPage_PetitionBaseFragment,
  SignatureBoxesPage_petitionDocument,
} from "../../__types";
import { SignaturesBlock } from "../../components/SignaturesBlock";
import { ThemeProvider } from "../../utils/ThemeProvider";
import { LiquidProvider } from "../../utils/liquid/LiquidContext";
import { PdfDocumentGetProps } from "../../utils/pdf";

export interface SignatureBoxesPageInitialData {
  petitionId: string;
}

export interface SignatureBoxesPageProps extends Omit<SignatureBoxesPageInitialData, "petitionId"> {
  petition: SignatureBoxesPage_PetitionBaseFragment;
}

export default function SignatureBoxesPage({ petition }: SignatureBoxesPageProps) {
  const theme = petition.selectedDocumentTheme.data as PdfDocumentTheme;
  const styles = StyleSheet.create({
    page: {
      paddingLeft: `${theme.marginLeft}mm`,
      paddingRight: `${theme.marginRight}mm`,
      paddingTop: `${theme.marginTop}mm`,
      paddingBottom: `${theme.marginBottom}mm`,
      lineHeight: 1.4,
    },
  });

  return (
    <LiquidProvider>
      <ThemeProvider theme={theme}>
        <Document>
          <Page style={styles.page}>
            {petition.__typename === "Petition" && petition.currentSignatureRequest ? (
              <SignaturesBlock
                signatureConfig={petition.currentSignatureRequest.signatureConfig}
                templateId={petition.fromTemplate?.id}
              />
            ) : null}
          </Page>
        </Document>
      </ThemeProvider>
    </LiquidProvider>
  );
}

SignatureBoxesPage.fragments = {
  get PetitionBase() {
    return gql`
      fragment SignatureBoxesPage_PetitionBase on PetitionBase {
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
        __typename
      }
      ${SignaturesBlock.fragments.SignatureConfig}
    `;
  },
};

SignatureBoxesPage.queries = [
  gql`
    query SignatureBoxesPage_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...SignatureBoxesPage_PetitionBase
      }
    }
    ${SignatureBoxesPage.fragments.PetitionBase}
  `,
];

SignatureBoxesPage.getProps = (async ({ petitionId, ...rest }, { client }) => {
  const response = await client!.request(SignatureBoxesPage_petitionDocument, {
    petitionId,
  });
  return {
    ...rest,
    petition: response.petition!,
  };
}) as PdfDocumentGetProps<SignatureBoxesPageInitialData, SignatureBoxesPageProps>;
