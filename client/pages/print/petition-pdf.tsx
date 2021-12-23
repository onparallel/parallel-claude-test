import { gql } from "@apollo/client";
import { Box, Grid, GridProps, Heading, Image, Text } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { PdfFieldWithReplies } from "@parallel/components/print/PdfFieldWithReplies";
import { PdfPage } from "@parallel/components/print/PdfPage";
import { SignatureBox } from "@parallel/components/print/SignatureBox";
import {
  PetitionPdf_petitionDocument,
  PetitionPdf_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { groupFieldsByPages } from "@parallel/utils/groupFieldsByPage";
import jwtDecode from "jwt-decode";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";

function PetitionPdf({ token }: { token: string }) {
  const { data } = useAssertQuery(PetitionPdf_petitionDocument, {
    variables: { token },
  });

  const tokenPayload = jwtDecode<{
    documentTitle?: string;
    showSignatureBoxes?: boolean;
  }>(token);

  const petition = data.petitionAuthToken;

  if (!petition) {
    throw new Error(`petition not found on auth token ${token}`);
  }

  const {
    organization: { name: orgName, logoUrl: orgLogo },
    currentSignatureRequest,
    fromTemplateId,
  } = petition;

  const signers = currentSignatureRequest?.signatureConfig.signers;
  const timezone = currentSignatureRequest?.signatureConfig.timezone;

  const fieldVisibility = useFieldVisibility(petition.fields);
  const pages = useMemo(
    () => groupFieldsByPages<PetitionPdf_PetitionFieldFragment>(petition.fields, fieldVisibility),
    [petition.fields, fieldVisibility]
  );

  return (
    <>
      {pages.map((fields, pageNum) => (
        <PdfPage key={pageNum}>
          {pageNum === 0 ? (
            <>
              {orgLogo ? (
                <Image margin="5mm auto" src={orgLogo} alt={orgName} width="40%" />
              ) : (
                <Logo width="50mm" justifyContent="center" display="flex" margin="5mm auto" />
              )}
              <Heading justifyContent="center" display="flex">
                {tokenPayload.documentTitle ?? petition.name}
              </Heading>
            </>
          ) : undefined}
          {fields.map((field) => (
            <PdfFieldWithReplies key={field.id} field={field} />
          ))}
          {tokenPayload.showSignatureBoxes &&
            pageNum === pages.length - 1 &&
            (signers ?? []).length > 0 && (
              <Box sx={{ pageBreakInside: "avoid" }}>
                <Text textAlign="center" margin="15mm 4mm 5mm 4mm" fontStyle="italic">
                  <FormattedMessage
                    id="petition.print-pdf.signatures-disclaimer"
                    defaultMessage="I declare that the data and documentation provided, as well as the copies or photocopies sent, faithfully reproduce the original documents and the current identification information."
                  />
                </Text>
                {fromTemplateId ? <HardcodedSignatures fromTemplateId={fromTemplateId} /> : null}
                <SignaturesGrid>
                  {signers!.map(({ email, fullName }, key) => (
                    <SignatureBox
                      key={key}
                      signer={{ email, fullName, key }}
                      timezone={timezone!}
                    />
                  ))}
                </SignaturesGrid>
              </Box>
            )}
        </PdfPage>
      ))}
    </>
  );
}

PetitionPdf.fragments = {
  get Petition() {
    return gql`
      fragment PetitionPdf_Petition on Petition {
        id
        name
        fields {
          ...PetitionPdf_PetitionField
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
      fragment PetitionPdf_PetitionField on PetitionField {
        id
        type
        title
        options
        description
        validated
        replies {
          id
          status
          content
        }
        ...useFieldVisibility_PetitionField
      }
      ${useFieldVisibility.fragments.PetitionField}
    `;
  },
};

type HardcodedSigner = {
  name: string;
  imgSrc: string;
};
function HardcodedSignatures({ fromTemplateId }: { fromTemplateId: string }) {
  const signaturesByTemplateId: Record<string, HardcodedSigner[] | undefined> = useMemo(() => {
    switch (process.env.NEXT_PUBLIC_ENVIRONMENT) {
      case "production":
        return {};
      case "staging":
        return {};
      default:
        return {};
    }
  }, []);

  return (signaturesByTemplateId[fromTemplateId] ?? []).length > 0 ? (
    <SignaturesGrid marginBottom="10px">
      {(signaturesByTemplateId[fromTemplateId] ?? []).map((signer, index) => (
        <Box key={index}>
          <Image height="35mm" src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/${signer.imgSrc}`} />
          <Text textAlign="center">{signer.name}</Text>
        </Box>
      ))}
    </SignaturesGrid>
  ) : null;
}

function SignaturesGrid({ children, ...props }: GridProps) {
  return (
    <Grid
      templateColumns="repeat(3, 1fr)"
      autoRows="minmax(150px, auto)"
      alignItems="center"
      justifyItems="center"
      width="100%"
      marginBottom="10px"
      {...props}
    >
      {children}
    </Grid>
  );
}

PetitionPdf.queries = [
  gql`
    query PetitionPdf_petition($token: String!) {
      petitionAuthToken(token: $token) {
        ...PetitionPdf_Petition
      }
    }
    ${PetitionPdf.fragments.Petition}
  `,
];

PetitionPdf.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const token = decodeURIComponent(query.token as string);
  await fetchQuery(PetitionPdf_petitionDocument, {
    variables: { token },
  });
  return { token };
};

export default withApolloData(PetitionPdf);
