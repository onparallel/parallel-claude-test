import { gql } from "@apollo/client";
import {
  Heading,
  Flex,
  Text,
  Box,
  ChakraProvider,
  useTheme,
} from "@chakra-ui/core";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import {
  PdfViewPetitionQuery,
  PdfView_FieldFragment,
  usePdfViewPetitionQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { groupFieldsByPages } from "@parallel/utils/groupFieldsByPage";
import { useMemo } from "react";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import { Logo } from "@parallel/components/common/Logo";
import { ExtendChakra } from "@parallel/chakra/utils";
import { FormattedMessage } from "react-intl";
import { PdfPage } from "@parallel/components/print/PdfPage";
import { FieldWithReplies } from "@parallel/components/print/FieldWithReplies";
import { SignatureBox } from "@parallel/components/print/SignatureBox";

function PdfView({ petitionId }: { petitionId: string }) {
  const { data } = assertQuery(
    usePdfViewPetitionQuery({
      variables: { id: petitionId },
    })
  );

  const petition = data?.publicPetitionSignature?.petition;
  const settings = data?.publicPetitionSignature?.settings;
  const recipients = data?.publicPetitionSignature?.signers;

  if (!petition) {
    throw new Error(`petition with id ${petitionId} not found`);
  }

  if (!settings || Object.keys(settings).length === 0) {
    throw new Error("petition signature request must have defined settings");
  }

  if (!recipients || recipients.length === 0) {
    throw new Error(
      "petition signature request must contain valid contactIds in its settings"
    );
  }

  const fieldIndexValues = useFieldIndexValues(petition.fields);
  const pages = useMemo(() => {
    const fields = fieldIndexValues.map((indexValue, i) => ({
      ...petition.fields[i],
      title: `${indexValue} - ${petition.fields[i].title}`,
    }));
    return groupFieldsByPages<PdfView_FieldFragment>(fields);
  }, [petition.fields]);

  const theme = useTheme();
  return (
    <ChakraProvider theme={theme}>
      {pages.map((fields, pageNum) => (
        <PdfPage key={pageNum}>
          {pageNum === 0 ? (
            <>
              <Logo
                width="50mm"
                justifyContent="center"
                display="flex"
                margin="5mm auto"
              />
              <Heading justifyContent="center" display="flex">
                {petition.name}
              </Heading>
            </>
          ) : undefined}
          {fields.map((field, fieldNum) => (
            <FieldWithReplies key={`${pageNum}/${fieldNum}`} field={field} />
          ))}
          {pageNum === pages.length - 1 && recipients && recipients.length > 0 && (
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
                  {recipients?.map((signer, n) => (
                    <SignatureBox
                      key={n}
                      signer={{ ...signer, key: n }}
                      timezone={settings["timezone"]}
                    />
                  ))}
                </Flex>
              </Box>
            </>
          )}
        </PdfPage>
      ))}
    </ChakraProvider>
  );
}

function SignatureDisclaimer(props: ExtendChakra) {
  return (
    <Text {...props}>
      <FormattedMessage
        id="petition.print-pdf.signatures-disclaimer"
        defaultMessage="I declare that the data and documentation provided, as well as the copies or photocopies sent, faithfully reproduce the original documents and the current information of the legal entity identified."
      />
    </Text>
  );
}

PdfView.fragments = {
  Field: gql`
    fragment PdfView_Field on PetitionField {
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
  `,
};

PdfView.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;

  await fetchQuery<PdfViewPetitionQuery>(
    gql`
      query PdfViewPetition($id: GID!) {
        publicPetitionSignature(petitionId: $id) {
          settings
          signers {
            id
            fullName
            email
          }
          petition {
            id
            name
            fields {
              ...PdfView_Field
            }
          }
        }
      }
      ${PdfView.fragments.Field}
    `,
    {
      variables: { id: petitionId },
    }
  );
  return { petitionId };
};

export default withApolloData(PdfView);
