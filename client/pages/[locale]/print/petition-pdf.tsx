import { gql } from "@apollo/client";
import { Box, BoxProps, Flex, Heading, Image, Text } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { FieldWithReplies } from "@parallel/components/print/FieldWithReplies";
import { PdfPage } from "@parallel/components/print/PdfPage";
import { SignatureBox } from "@parallel/components/print/SignatureBox";
import {
  PdfViewPetitionQuery,
  PetitionPdf_PetitionFieldFragment,
  usePdfViewPetitionQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import { evaluateFieldVisibility } from "@parallel/utils/fieldVisibility";
import { groupFieldsByPages } from "@parallel/utils/groupFieldsByPage";
import jwtDecode from "jwt-decode";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function PetitionPdf({ token }: { token: string }) {
  const { data } = assertQuery(
    usePdfViewPetitionQuery({
      variables: { token },
    })
  );

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
    signatureConfig,
  } = petition;

  const contacts = signatureConfig?.contacts;

  const visibleFields = evaluateFieldVisibility(petition.fields).filter(
    (f) => f.isVisible
  );

  const fieldIndexValues = useFieldIndexValues(visibleFields);
  const intl = useIntl();
  const pages = useMemo(() => {
    const fields = fieldIndexValues.map((indexValue, i) => ({
      ...visibleFields[i],
      title: `${indexValue} - ${
        visibleFields[i].title ??
        intl.formatMessage({
          id: "generic.untitled-field",
          defaultMessage: "Untitled field",
        })
      }`,
    }));
    return groupFieldsByPages<PetitionPdf_PetitionFieldFragment>(fields);
  }, [visibleFields]);

  return (
    <>
      {pages.map((fields, pageNum) => (
        <PdfPage key={pageNum}>
          {pageNum === 0 ? (
            <>
              {orgLogo ? (
                <Image
                  margin="5mm auto"
                  src={orgLogo}
                  alt={orgName}
                  width="40%"
                />
              ) : (
                <Logo
                  width="50mm"
                  justifyContent="center"
                  display="flex"
                  margin="5mm auto"
                />
              )}
              <Heading justifyContent="center" display="flex">
                {tokenPayload.documentTitle ?? petition.name}
              </Heading>
            </>
          ) : undefined}
          {fields.map((field, fieldNum) => (
            <FieldWithReplies key={`${pageNum}/${fieldNum}`} field={field} />
          ))}
          {tokenPayload.showSignatureBoxes &&
            pageNum === pages.length - 1 &&
            (contacts ?? []).length > 0 && (
              <Box sx={{ pageBreakInside: "avoid" }}>
                <SignatureDisclaimer
                  textAlign="center"
                  margin="15mm 4mm 5mm 4mm"
                  fontStyle="italic"
                />
                <Flex
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gridAutoRows: "minmax(150px, auto)",
                    alignItems: "center",
                    justifyItems: "center",
                    width: "100%",
                  }}
                >
                  {contacts?.map(
                    (signer, index) =>
                      signer && (
                        <SignatureBox
                          key={signer.id}
                          signer={{ ...signer!, key: index }}
                          timezone={signatureConfig!.timezone}
                        />
                      )
                  )}
                </Flex>
              </Box>
            )}
        </PdfPage>
      ))}
    </>
  );
}

function SignatureDisclaimer(props: BoxProps) {
  return (
    <Text {...props}>
      <FormattedMessage
        id="petition.print-pdf.signatures-disclaimer"
        defaultMessage="I declare that the data and documentation provided, as well as the copies or photocopies sent, faithfully reproduce the original documents and the current identification information."
      />
    </Text>
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
        signatureConfig {
          contacts {
            id
            fullName
            email
          }
          timezone
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
          content
        }
        ...evaluateFieldVisibility_PetitionField
      }
      ${evaluateFieldVisibility.fragments.PetitionField}
    `;
  },
};

PetitionPdf.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const token = decodeURIComponent(query.token as string);
  await fetchQuery<PdfViewPetitionQuery>(
    gql`
      query PdfViewPetition($token: String!) {
        petitionAuthToken(token: $token) {
          ...PetitionPdf_Petition
        }
      }
      ${PetitionPdf.fragments.Petition}
    `,
    {
      variables: { token },
    }
  );
  return { token };
};

export default withApolloData(PetitionPdf);
