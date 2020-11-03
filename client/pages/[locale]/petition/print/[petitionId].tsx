import { gql } from "@apollo/client";
import { Heading, Flex, Text, Box, VisuallyHidden } from "@chakra-ui/core";
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
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import { Logo } from "@parallel/components/common/Logo";
import { ExtendChakra } from "@parallel/chakra/utils";
import { FormattedMessage } from "react-intl";

function PdfView({ petitionId }: { petitionId: string }) {
  const {
    data: { petition },
  } = assertQuery(
    usePdfViewPetitionQuery({
      variables: { id: petitionId },
    })
  );

  const p = petition?.__typename === "Petition" ? petition : null;
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

  const signers = p.accesses.map((a) => a.contact!);
  const signBoxRefs = signers.map(() => useRef<HTMLDivElement | null>(null));

  const [bboxData, setData] = useState<any[]>([]);
  useEffect(() => {
    setData(
      signBoxRefs.map((r, i) => ({
        signer: signers[i],
        box: r.current?.getBoundingClientRect(),
      }))
    );
  }, []);

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
          {pageNum === pages.length - 1 && signers && signers.length > 0 && (
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
                {signers?.map((signer, n) => (
                  <SignatureBoxWithRef
                    key={`signer-${n}`}
                    signer={signer}
                    ref={signBoxRefs[n]}
                  />
                ))}
              </Flex>
              <VisuallyHidden id="signature-bbox-data">
                {JSON.stringify(bboxData)}
              </VisuallyHidden>
            </Box>
          )}
        </PdfPage>
      ))}
    </>
  );
}

const SignatureBoxWithRef = forwardRef(SignatureBox);

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
        status
        content
      }
    }
  `,
  Access: gql`
    fragment PdfView_Access on PetitionAccess {
      contact {
        email
        fullName
      }
      status
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
        petition(id: $id) {
          ... on Petition {
            id
            name
            accesses {
              ...PdfView_Access
            }
            fields {
              ...PdfView_Field
            }
          }
        }
      }
      ${PdfView.fragments.Field}
      ${PdfView.fragments.Access}
    `,
    {
      variables: { id: petitionId },
    }
  );
  return { petitionId };
};

export default withApolloData(PdfView);
