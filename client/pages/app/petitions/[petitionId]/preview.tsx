import { gql, useMutation } from "@apollo/client";
import { Box, Flex, Stack } from "@chakra-ui/react";
import { ArrowForwardIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { Spacer } from "@parallel/components/common/Spacer";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { PetitionPreviewPetitionField } from "@parallel/components/petition-preview/PetitionPreviewPetitionField";
import { RecipientViewPetitionFieldCard } from "@parallel/components/recipient-view/fields/RecipientViewPetitionFieldCard";
import { RecipientViewContentsCard } from "@parallel/components/recipient-view/RecipientViewContentsCard";
import { RecipientViewPagination } from "@parallel/components/recipient-view/RecipientViewPagination";
import { RecipientViewProgressFooter } from "@parallel/components/recipient-view/RecipientViewProgressFooter";
import {
  PetitionPreview_PetitionBaseFragment,
  PetitionPreview_petitionDocument,
  PetitionPreview_updatePetitionDocument,
  PetitionPreview_userDocument,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGetPageFields } from "@parallel/utils/useGetPageFields";
import { usePetitionStateWrapper, withPetitionState } from "@parallel/utils/usePetitionState";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { useIntl } from "react-intl";

type PetitionPreviewProps = UnwrapPromise<ReturnType<typeof PetitionPreview.getInitialProps>>;

function PetitionPreview({ petitionId }: PetitionPreviewProps) {
  const intl = useIntl();
  const router = useRouter();
  const { query } = router;
  const {
    data: { me },
  } = useAssertQuery(PetitionPreview_userDocument);
  const { data } = useAssertQuery(PetitionPreview_petitionDocument, {
    variables: { id: petitionId },
  });

  const [finalized, setFinalized] = useState(false);

  const wrapper = usePetitionStateWrapper();

  const [updatePetition] = useMutation(PetitionPreview_updatePetitionDocument);
  const handleOnUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId]
  );

  const petition = data!.petition as PetitionPreview_PetitionBaseFragment;

  const pageCount =
    petition.fields.filter((f) => f.type === "HEADING" && f.options!.hasPageBreak).length + 1;

  const currentPage = Number(query.page) || 1;

  const { fields, pages, visibility } = useGetPageFields(petition.fields, currentPage);

  const breakpoint = "md";

  const isPetition = petition.__typename === "Petition";

  const handleNextClick = useCallback(async () => {}, [petition]);

  const handleFinalize = useCallback(
    async function () {
      try {
        setFinalized(true);
        const canFinalize = petition.fields.every(
          (f, index) =>
            !visibility[index] ||
            f.validated ||
            f.optional ||
            completedFieldReplies(f).length > 0 ||
            f.isReadOnly
        );
        if (canFinalize) {
          // TODO: Handle finalize in preview petition
        } else {
          // go to first repliable field without replies
          let page = 1;
          const field = petition.fields.find((field, index) => {
            if (field.type === "HEADING" && field.options.hasPageBreak) {
              page += 1;
            }
            return (
              visibility[index] &&
              !completedFieldReplies(field).length &&
              !field.optional &&
              !field.validated &&
              !field.isReadOnly
            );
          })!;

          router.push(`/app/petitions/${query.petitionId}/preview?page=${page}#field-${field.id}`);
        }
      } catch {}
    },
    [petition.fields, visibility, router, query]
  );

  return (
    <ToneProvider value={petition.tone}>
      <PetitionLayout
        key={petition.id}
        user={me}
        petition={petition}
        onUpdatePetition={handleOnUpdatePetition}
        section="preview"
        scrollBody
        headerActions={
          petition?.__typename === "Petition" && petition.status === "DRAFT" ? (
            <ResponsiveButtonIcon
              data-action="compose-next"
              id="petition-next"
              colorScheme="purple"
              icon={<ArrowForwardIcon fontSize="18px" />}
              label={intl.formatMessage({
                id: "generic.next",
                defaultMessage: "Next",
              })}
              onClick={handleNextClick}
            />
          ) : null
        }
      >
        <Flex backgroundColor="gray.50" minHeight="100%" flexDirection="column" alignItems="center">
          <Flex
            flex="1"
            flexDirection={{ base: "column", [breakpoint]: "row" }}
            width="100%"
            maxWidth="container.lg"
            paddingY={6}
            paddingX={4}
          >
            <Box
              flex={{ base: 0, [breakpoint]: 1 }}
              minWidth={0}
              marginRight={{ base: 0, [breakpoint]: 4 }}
              marginBottom={4}
            >
              <Stack
                spacing={4}
                position={{ base: "relative", [breakpoint]: "sticky" }}
                top={{ base: 0, [breakpoint]: 6 }}
              >
                <RecipientViewContentsCard
                  currentPage={currentPage}
                  petition={petition}
                  display={{ base: "none", [breakpoint]: "flex" }}
                />
              </Stack>
            </Box>
            <Flex flexDirection="column" flex="2" minWidth={0}>
              <Stack spacing={4} key={0}>
                {fields.map((field) => (
                  <PetitionPreviewPetitionField
                    key={field.id}
                    petitionId={petition.id}
                    field={field}
                    isDisabled={isPetition && (field.validated || petition.status === "CLOSED")}
                    isInvalid={
                      finalized &&
                      !field.validated &&
                      completedFieldReplies(field).length === 0 &&
                      !field.optional
                    }
                    hasCommentsEnabled={field.options.hasCommentsEnabled}
                  />
                ))}
              </Stack>
              <Spacer />
              {pages > 1 ? (
                <RecipientViewPagination
                  marginTop={8}
                  currentPage={currentPage}
                  pageCount={pageCount}
                />
              ) : null}
            </Flex>
          </Flex>
          {isPetition && petition.status !== "CLOSED" && (
            <RecipientViewProgressFooter petition={petition} onFinalize={handleFinalize} />
          )}
        </Flex>
      </PetitionLayout>
    </ToneProvider>
  );
}

PetitionPreview.fragments = {
  get PetitionField() {
    return gql`
      fragment PetitionPreview_PetitionField on PetitionField {
        id
        ...RecipientViewPetitionFieldCard_PetitionField
        ...RecipientViewContentsCard_PetitionField
        ...RecipientViewProgressFooter_PetitionField
      }
      ${RecipientViewPetitionFieldCard.fragments.PetitionField}
      ${RecipientViewContentsCard.fragments.PetitionField}
      ${RecipientViewProgressFooter.fragments.PetitionField}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment PetitionPreview_PetitionBase on PetitionBase {
        id
        tone
        ... on Petition {
          status
          signatureConfig {
            integration {
              environment
              name
            }
          }
        }
        fields {
          ...PetitionPreview_PetitionField
        }
        ...PetitionLayout_PetitionBase
        ...RecipientViewContentsCard_Petition
        ...RecipientViewProgressFooter_Petition
      }
      ${this.PetitionField}
      ${RecipientViewContentsCard.fragments.Petition}
      ${RecipientViewProgressFooter.fragments.Petition}
      ${PetitionLayout.fragments.PetitionBase}
    `;
  },
  get User() {
    return gql`
      fragment PetitionPreview_User on User {
        ...PetitionLayout_User
      }
      ${PetitionLayout.fragments.User}
    `;
  },
};

PetitionPreview.mutations = [
  gql`
    mutation PetitionPreview_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionPreview_PetitionBase
      }
    }
    ${PetitionPreview.fragments.PetitionBase}
  `,
];

PetitionPreview.queries = [
  gql`
    query PetitionPreview_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionPreview_PetitionBase
      }
    }
    ${PetitionPreview.fragments.PetitionBase}
  `,
  gql`
    query PetitionPreview_user {
      me {
        ...PetitionPreview_User
      }
    }
    ${PetitionPreview.fragments.User}
  `,
];

PetitionPreview.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  await Promise.all([
    fetchQuery(PetitionPreview_userDocument),
    fetchQuery(PetitionPreview_petitionDocument, {
      variables: { id: petitionId },
      ignoreCache: true,
    }),
  ]);
  return { petitionId };
};

export default compose(withPetitionState, withDialogs, withApolloData)(PetitionPreview);
