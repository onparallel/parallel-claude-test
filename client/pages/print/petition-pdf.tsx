import { gql } from "@apollo/client";
import { Box, Grid, GridProps, Heading, Image, Text } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { PdfFieldWithReplies } from "@parallel/components/print/PdfFieldWithReplies";
import { SignatureBox } from "@parallel/components/print/SignatureBox";
import {
  PetitionPdf_petitionDocument,
  PetitionPdf_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { groupFieldsByPages } from "@parallel/utils/groupFieldsByPage";
import { LiquidProvider, LiquidScopeProvider } from "@parallel/utils/useLiquid";
import { useLiquidScope } from "@parallel/utils/useLiquidScope";
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
    () =>
      groupFieldsByPages<PetitionPdf_PetitionFieldFragment>(petition.fields, fieldVisibility, {
        isPdf: true,
      }),
    [petition.fields, fieldVisibility]
  );
  const scope = useLiquidScope(petition.fields);
  return (
    <LiquidProvider>
      <LiquidScopeProvider scope={scope}>
        <Box
          sx={{
            "@page": {
              size: "A4",
              margin: "1in",
            },
          }}
        >
          {pages.map((fields, pageIndex) => (
            <Box
              key={pageIndex}
              sx={{
                position: "relative",
                pageBreakAfter: "always",
                padding: "1px",
              }}
            >
              {pageIndex === 0 ? (
                <>
                  {orgLogo ? (
                    <Image
                      marginX="auto"
                      src={orgLogo}
                      alt={orgName}
                      width="40%"
                      maxHeight="64px"
                      objectFit="contain"
                    />
                  ) : (
                    <Logo width="50mm" marginX="auto" aria-label="Parallel" />
                  )}
                  <Heading
                    justifyContent="center"
                    display="flex"
                    marginBottom="10mm"
                    marginTop="5mm"
                  >
                    {tokenPayload.documentTitle ?? petition.name}
                  </Heading>
                </>
              ) : undefined}
              {fields.map((field, index) => (
                <Box key={field.id} marginTop={index > 0 ? "5mm" : 0}>
                  <PdfFieldWithReplies field={field} />
                </Box>
              ))}
              {tokenPayload.showSignatureBoxes &&
                pageIndex === pages.length - 1 &&
                (signers ?? []).length > 0 && (
                  <Box sx={{ pageBreakInside: "avoid" }}>
                    <Text textAlign="center" margin="15mm 4mm 5mm 4mm" fontStyle="italic">
                      <FormattedMessage
                        id="petition.print-pdf.signatures-disclaimer"
                        defaultMessage="I declare that the data and documentation provided, as well as the copies or photocopies sent, faithfully reproduce the original documents and the current identification information."
                      />
                    </Text>
                    {fromTemplateId ? (
                      <HardcodedSignatures fromTemplateId={fromTemplateId} />
                    ) : null}
                    <Box position="relative">
                      <SignaturesGrid>
                        {signers!.map((signer, index) => (
                          <SignatureBox
                            key={index}
                            signer={signer}
                            timezone={timezone!}
                            wordAnchor={`3cb39pzCQA9wJ${index}`}
                          />
                        ))}
                      </SignaturesGrid>
                    </Box>
                  </Box>
                )}
            </Box>
          ))}
        </Box>
      </LiquidScopeProvider>
    </LiquidProvider>
  );
}

PetitionPdf.fragments = {
  get Petition() {
    return gql`
      fragment PetitionPdf_Petition on Petition {
        id
        name
        fields {
          options
          ...PetitionPdf_PetitionField
          ...useLiquidScope_PetitionField
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
      ${useLiquidScope.fragments.PetitionField}
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
        showInPdf
        replies {
          id
          status
          content
        }
        ...groupFieldsByPages_PetitionField
        ...useFieldVisibility_PetitionField
      }
      ${groupFieldsByPages.fragments.PetitionField}
      ${useFieldVisibility.fragments.PetitionField}
    `;
  },
};

type HardcodedSigner = {
  name?: string;
  imgSrc: string;
};
function HardcodedSignatures({ fromTemplateId }: { fromTemplateId: string }) {
  const signaturesByTemplateId: Record<string, HardcodedSigner[] | undefined> = useMemo(() => {
    const guillermo: HardcodedSigner = {
      name: "Guillermo Preckler",
      imgSrc: "static/images/signatures/guillermo-preckler-brickbro.png",
    };
    const selloTiko: HardcodedSigner = {
      imgSrc: "static/images/signatures/sello-tiko.png",
    };
    switch (process.env.NEXT_PUBLIC_ENVIRONMENT) {
      case "production":
        return {
          EAwW2jXkP4C9LjU2b3: [guillermo],
          EAwW2jXkP4C9LjU2fS: [guillermo],
          EAwW2jXkP4C9LbfNRp: [selloTiko],
        };
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
          {signer.name ? <Text textAlign="center">{signer.name}</Text> : null}
        </Box>
      ))}
    </SignaturesGrid>
  ) : null;
}

function SignaturesGrid({ children, ...props }: GridProps) {
  return (
    <Grid
      templateColumns="repeat(3, 1fr)"
      templateRows="35mm"
      gridGap="5mm"
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
