import { gql } from "@apollo/client";
import { Heading, Flex, Text, Box } from "@chakra-ui/core";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import {
  FieldWithReplies,
  PdfPage,
  SignatureBox,
} from "@parallel/components/print";
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

type PdfRecipient = { email: string; name: string };
function PdfView({
  petitionId,
  recipients,
}: {
  petitionId: string;
  recipients: PdfRecipient[];
}) {
  const { data } = assertQuery(
    usePdfViewPetitionQuery({
      variables: { id: petitionId },
    })
  );

  const p = data?.publicPetitionPdf;

  if (!p) {
    throw new Error("petition not found");
  }

  const fieldIndexValues = useFieldIndexValues(p.fields);
  const pages = useMemo(() => {
    const fields = fieldIndexValues.map((indexValue, i) => ({
      ...p.fields[i],
      title: `${indexValue} - ${p.fields[i].title}`,
    }));
    return groupFieldsByPages<PdfView_FieldFragment>(fields);
  }, [p.fields]);

  return (
    <>
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
                {p.name}
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
                    <SignatureBox key={n} signer={{ ...signer, key: n }} />
                  ))}
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
  if (!query.recipients) {
    throw new Error("expected recipients data on URL");
  }
  const recipients: PdfRecipient[] = JSON.parse(query.recipients as string);
  if (!recipients.every((r) => r.email && r.name)) {
    throw new Error("expected email and name info for each recipient");
  }

  await fetchQuery<PdfViewPetitionQuery>(
    gql`
      query PdfViewPetition($id: GID!) {
        publicPetitionPdf(petitionId: $id) {
          id
          name
          fields {
            ...PdfView_Field
          }
        }
      }
      ${PdfView.fragments.Field}
    `,
    {
      variables: { id: petitionId },
    }
  );
  return { petitionId, recipients };
};

export default withApolloData(PdfView);
