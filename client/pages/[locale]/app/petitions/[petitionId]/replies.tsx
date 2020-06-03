import {
  Box,
  Button,
  Checkbox,
  Flex,
  IconButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/core";
import { ButtonDropdown } from "@parallel/components/common/ButtonDropdown";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import { Spacer } from "@parallel/components/common/Spacer";
import { SplitButton } from "@parallel/components/common/SplitButton";
import { Title } from "@parallel/components/common/Title";
import {
  withApolloData,
  WithDataContext,
} from "@parallel/components/common/withApolloData";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition-replies/FailureGeneratingLinkDialog";
import {
  PetitionRepliesField,
  PetitionRepliesFieldAction,
} from "@parallel/components/petition-replies/PetitionRepliesField";
import {
  PetitionFieldReply,
  PetitionRepliesQuery,
  PetitionRepliesQueryVariables,
  PetitionRepliesUserQuery,
  UpdatePetitionInput,
  usePetitionRepliesQuery,
  usePetitionRepliesUserQuery,
  usePetitionReplies_fileUploadReplyDownloadLinkMutation,
  usePetitionReplies_updatePetitionMutation,
  usePetitionReplies_validatePetitionFieldsMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { compose } from "@parallel/utils/compose";
import {
  usePetitionState,
  useWrapPetitionUpdater,
} from "@parallel/utils/petitions";
import { UnwrapPromise } from "@parallel/utils/types";
import { useSelectionState } from "@parallel/utils/useSelectionState";
import { gql } from "apollo-boost";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";

type PetitionProps = UnwrapPromise<
  ReturnType<typeof PetitionReplies.getInitialProps>
>;

function PetitionReplies({ petitionId }: PetitionProps) {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(usePetitionRepliesUserQuery());
  const {
    data: { petition },
    refetch,
  } = assertQuery(usePetitionRepliesQuery({ variables: { id: petitionId } }));

  const [state, setState] = usePetitionState();
  const wrapper = useWrapPetitionUpdater(setState);
  const [updatePetition] = usePetitionReplies_updatePetitionMutation();
  const [
    validatePetitionFields,
  ] = usePetitionReplies_validatePetitionFieldsMutation();
  const downloadReplyFile = useDownloadReplyFile();

  const handleValidateToggle = useCallback(
    wrapper(async (fieldIds: string[], value: boolean) => {
      validatePetitionFields({
        variables: { petitionId: petition!.id, fieldIds, value },
        optimisticResponse: {
          validatePetitionFields: {
            __typename: "PetitionAndFields",
            petition: {
              __typename: "Petition",
              ...pick(petition!, [
                "id",
                "name",
                "status",
                "locale",
                "deadline",
              ]),
              updatedAt: new Date().toISOString(),
            },
            fields: fieldIds.map((id) => ({
              __typename: "PetitionField",
              id,
              validated: value,
            })),
          },
        },
      });
    }),
    []
  );

  const handleOnUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId]
  );

  const handleAction = async function (action: PetitionRepliesFieldAction) {
    switch (action.type) {
      case "DOWNLOAD_FILE":
      case "PREVIEW_FILE":
        try {
          await downloadReplyFile(
            petitionId,
            action.reply,
            action.type === "PREVIEW_FILE"
          );
        } catch {}
        break;
    }
  };

  const {
    selection,
    selected,
    anySelected,
    allSelected,
    toggle,
    toggleAll,
    toggleBy,
  } = useSelectionState(petition!.fields, "id");

  return (
    <>
      <Title>
        {petition!.name ||
          intl.formatMessage({
            id: "generic.untitled-petition",
            defaultMessage: "Untitled petition",
          })}
      </Title>
      <PetitionLayout
        user={me}
        petition={petition!}
        onUpdatePetition={handleOnUpdatePetition}
        section="replies"
        scrollBody={false}
        state={state}
      >
        <Stack
          direction="row"
          paddingX={4}
          paddingY={2}
          backgroundColor="white"
        >
          <SplitButton>
            <Button variant="outline" onClick={toggleAll} padding={0}>
              <Checkbox
                isReadOnly
                onClick={(event) => event.preventDefault()}
                isChecked={anySelected && allSelected}
                isIndeterminate={anySelected && !allSelected}
                size="md"
                variantColor="purple"
              />
            </Button>
            <ButtonDropdown
              as={IconButton}
              variant="outline"
              icon="chevron-down"
              aria-label="op"
              minWidth={8}
              dropdown={
                <MenuList
                  minWidth="160px"
                  placement="bottom-start"
                  marginLeft="-40px"
                >
                  <MenuItem onClick={() => toggleBy(() => true)}>
                    <FormattedMessage
                      id="petition.replies.select-all"
                      defaultMessage="All"
                    />
                  </MenuItem>
                  <MenuItem onClick={() => toggleBy(() => false)}>
                    <FormattedMessage
                      id="petition.replies.select-none"
                      defaultMessage="None"
                    />
                  </MenuItem>
                </MenuList>
              }
            ></ButtonDropdown>
          </SplitButton>
          <IconButtonWithTooltip
            onClick={() => refetch()}
            icon="repeat"
            placement="bottom"
            variant="outline"
            label={intl.formatMessage({
              id: "generic.reload-data",
              defaultMessage: "Reload",
            })}
          />
          <Spacer />
          {anySelected ? (
            <Button
              leftIcon="check"
              onClick={() =>
                handleValidateToggle(
                  selected.map((r) => r.id),
                  true
                )
              }
            >
              <FormattedMessage
                id="petition.replies.validate-selected"
                defaultMessage="Mark as reviewed"
              />
            </Button>
          ) : null}
        </Stack>
        <Divider />
        <Box flex="1" overflow="auto">
          <Flex margin={4}>
            <Stack flex="2" spacing={4} id="petition-replies">
              {petition!.fields.map((field, index) => (
                <PetitionRepliesField
                  key={field.id}
                  field={field}
                  index={index}
                  selected={selection[field.id]}
                  onValidateToggle={() =>
                    handleValidateToggle([field.id], !field.validated)
                  }
                  onAction={handleAction}
                  onToggle={(event) => toggle(field.id, event)}
                />
              ))}
            </Stack>
            <Spacer flex="1" display={{ base: "none", md: "block" }} />
          </Flex>
        </Box>
      </PetitionLayout>
    </>
  );
}

PetitionReplies.fragments = {
  Petition: gql`
    fragment PetitionReplies_Petition on Petition {
      id
      fields {
        ...PetitionRepliesField_PetitionField
      }
      ...PetitionLayout_Petition
    }
    ${PetitionLayout.fragments.Petition}
    ${PetitionRepliesField.fragments.PetitionField}
  `,
  User: gql`
    fragment PetitionReplies_User on User {
      ...PetitionLayout_User
    }
    ${PetitionLayout.fragments.User}
  `,
};

PetitionReplies.mutations = [
  gql`
    mutation PetitionReplies_updatePetition(
      $petitionId: ID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionReplies_Petition
      }
    }
    ${PetitionReplies.fragments.Petition}
  `,
  gql`
    mutation PetitionReplies_validatePetitionFields(
      $petitionId: ID!
      $fieldIds: [ID!]!
      $value: Boolean!
    ) {
      validatePetitionFields(
        petitionId: $petitionId
        fieldIds: $fieldIds
        value: $value
      ) {
        fields {
          id
          validated
        }
        petition {
          ...PetitionLayout_Petition
        }
      }
    }
    ${PetitionLayout.fragments.Petition}
  `,
  gql`
    mutation PetitionReplies_fileUploadReplyDownloadLink(
      $petitionId: ID!
      $replyId: ID!
      $preview: Boolean
    ) {
      fileUploadReplyDownloadLink(
        petitionId: $petitionId
        replyId: $replyId
        preview: $preview
      ) {
        result
        url
      }
    }
  `,
];

function useDownloadReplyFile() {
  const [mutate] = usePetitionReplies_fileUploadReplyDownloadLinkMutation();
  const showFailure = useFailureGeneratingLinkDialog();
  return useCallback(
    async function downloadReplyFile(
      petitionId: string,
      reply: Pick<PetitionFieldReply, "id" | "content">,
      preview: boolean
    ) {
      const _window = window.open(undefined, "_blank")!;
      const { data } = await mutate({
        variables: { petitionId, replyId: reply.id, preview },
      });
      const { url, result } = data!.fileUploadReplyDownloadLink;
      if (result === "SUCCESS") {
        _window.location.href = url!;
      } else {
        _window.close();
        try {
          await showFailure({ filename: reply.content.filename });
        } catch {}
      }
    },
    [mutate]
  );
}

PetitionReplies.getInitialProps = async ({
  apollo,
  query,
}: WithDataContext) => {
  await Promise.all([
    apollo.query<PetitionRepliesQuery, PetitionRepliesQueryVariables>({
      query: gql`
        query PetitionReplies($id: ID!) {
          petition(id: $id) {
            ...PetitionReplies_Petition
          }
        }
        ${PetitionReplies.fragments.Petition}
      `,
      variables: { id: query.petitionId as string },
    }),
    apollo.query<PetitionRepliesUserQuery>({
      query: gql`
        query PetitionRepliesUser {
          me {
            ...PetitionReplies_User
          }
        }
        ${PetitionReplies.fragments.User}
      `,
    }),
  ]);
  return {
    petitionId: query.petitionId as string,
  };
};

export default compose(
  withOnboarding({
    key: "PETITION_REVIEW",
    steps: [
      {
        title: (
          <FormattedMessage
            id="tour.petition-replies.your-information"
            defaultMessage="Here you have your information on the requests"
          />
        ),
        content: (
          <FormattedMessage
            id="tour.petition-replies.all-items-on-page"
            defaultMessage="On this page, you can see all the items that you requested to the recipients."
          />
        ),
        placement: "center",
        target: "#__next",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-replies.review-items"
            defaultMessage="Replies"
          />
        ),
        content: (
          <Text>
            <FormattedMessage
              id="tour.petition-replies.completed-items"
              defaultMessage="If your recipients completed the information, you can <b>download</b> the files, <b>copy the text</b> replies, or <b>mark them as reviewed</b>."
              values={{
                b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              }}
            />
          </Text>
        ),
        placement: "right-start",
        target: "#petition-replies",
      },
    ],
  }),
  withApolloData
)(PetitionReplies);
