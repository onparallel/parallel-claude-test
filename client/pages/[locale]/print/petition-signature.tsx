import { gql } from "@apollo/client";
import { Box, Flex, Heading, Image, Text } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
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
  PrintPetition_PetitionFieldFragment,
  usePdfViewPetitionQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import { groupFieldsByPages } from "@parallel/utils/groupFieldsByPage";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function PrintPetition({ token }: { token: string }) {
  const { data } = assertQuery(
    usePdfViewPetitionQuery({
      variables: { token },
    })
  );

  const { petition, tokenPayload } = data.petitionAuthToken!;
  const { name: orgName, logoUrl: orgLogo } = petition.organization;

  const signatureConfig = petition.currentSignatureRequest?.signatureConfig;
  const contacts = signatureConfig?.contacts;
  const { showSignatureBoxes } = tokenPayload;

  if (!petition) {
    throw new Error(`petition with id ${tokenPayload.petitionId} not found`);
  }

  const fieldIndexValues = useFieldIndexValues(petition.fields);
  const intl = useIntl();
  const pages = useMemo(() => {
    const fields = fieldIndexValues.map((indexValue, i) => ({
      ...petition.fields[i],
      title: `${indexValue} - ${
        petition.fields[i].title ??
        intl.formatMessage({
          id: "generic.untitled-field",
          defaultMessage: "Untitled field",
        })
      }`,
    }));
    return groupFieldsByPages<PrintPetition_PetitionFieldFragment>(fields);
  }, [petition.fields]);

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
                {signatureConfig?.title ?? petition.name}
              </Heading>
            </>
          ) : undefined}
          {fields.map((field, fieldNum) => (
            <FieldWithReplies key={`${pageNum}/${fieldNum}`} field={field} />
          ))}
          {signatureConfig &&
            showSignatureBoxes &&
            pageNum === pages.length - 1 &&
            contacts &&
            contacts.length > 0 && (
              <>
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
                            timezone={signatureConfig["timezone"]}
                          />
                        )
                    )}
                  </Flex>
                </Box>
              </>
            )}
        </PdfPage>
      ))}
    </>
  );
}

function SignatureDisclaimer(props: ExtendChakra) {
  return (
    <Text {...props}>
      <FormattedMessage
        id="petition.print-pdf.signatures-disclaimer"
        defaultMessage="I declare that the data and documentation provided, as well as the copies or photocopies sent, faithfully reproduce the original documents and the current identification information."
      />
    </Text>
  );
}

PrintPetition.fragments = {
  get PetitionAuthToken() {
    return gql`
      fragment PrintPetition_PetitionAuthToken on PetitionAuthToken {
        tokenPayload
        petition {
          id
          name
          fields {
            ...PrintPetition_PetitionField
          }
          organization {
            name
            logoUrl
          }
          currentSignatureRequest(token: $token) {
            signatureConfig {
              contacts {
                id
                fullName
                email
              }
              provider
              timezone
              title
            }
          }
        }
      }
      ${this.PetitionField}
    `;
  },
  get PetitionField() {
    return gql`
      fragment PrintPetition_PetitionField on PetitionField {
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
      }
    `;
  },
};

PrintPetition.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const token = decodeURIComponent(query.token as string);
  await fetchQuery<PdfViewPetitionQuery>(
    gql`
      query PdfViewPetition($token: String!) {
        petitionAuthToken(token: $token) {
          ...PrintPetition_PetitionAuthToken
        }
      }
      ${PrintPetition.fragments.PetitionAuthToken}
    `,
    {
      variables: { token },
    }
  );
  return { token };
};

export default withApolloData(PrintPetition);
