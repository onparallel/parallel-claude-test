import {
  Box,
  Button,
  Checkbox,
  Flex,
  IconButton,
  MenuItem,
  MenuList,
  Stack,
  useToast,
} from "@chakra-ui/core";
import { ButtonDropdown } from "@parallel/components/common/ButtonDropdown";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { Spacer } from "@parallel/components/common/Spacer";
import { SplitButton } from "@parallel/components/common/SplitButton";
import { Title } from "@parallel/components/common/Title";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition/FailureGeneratingLinkDialog";
import {
  PetitionRepliesField,
  PetitionRepliesFieldAction,
} from "@parallel/components/petition/PetitionRepliesField";
import { PetitionSendouts } from "@parallel/components/petition/PetitionSendouts";
import {
  withData,
  WithDataContext,
} from "@parallel/components/common/withData";
import {
  PetitionFieldReply,
  PetitionRepliesQuery,
  PetitionRepliesQueryVariables,
  PetitionRepliesUserQuery,
  UpdatePetitionInput,
  usePetitionRepliesQuery,
  usePetitionRepliesUserQuery,
  usePetitionReplies_fileUploadReplyDownloadLinkMutation,
  usePetitionReplies_sendRemindersMutation,
  usePetitionReplies_updatePetitionMutation,
  usePetitionReplies_validatePetitionFieldsMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import {
  usePetitionState,
  useWrapPetitionUpdater,
} from "@parallel/utils/petitions";
import { UnwrapPromise } from "@parallel/utils/types";
import { useSelectionState } from "@parallel/utils/useSelectionState";
import { gql } from "apollo-boost";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";

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
              id: petition!.id,
              name: petition!.name,
              status: petition!.status,
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
        try {
          await downloadReplyFile(petitionId, action.reply);
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

  const sendReminder = useSendReminder();

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
        <Stack direction="row" padding={4} backgroundColor="white">
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
            <Stack flex="2" spacing={4}>
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
          <PetitionSendouts
            sendouts={petition!.sendouts}
            marginX={4}
            marginTop={12}
            marginBottom={24}
            onSendReminder={(sendoutId) => sendReminder(petitionId, sendoutId)}
          />
        </Box>
      </PetitionLayout>
    </>
  );
}

PetitionReplies.fragments = {
  petition: gql`
    fragment PetitionReplies_Petition on Petition {
      id
      fields {
        ...PetitionRepliesField_PetitionField
      }
      ...PetitionLayout_Petition
      ...PetitionSendouts_Petition
    }
    ${PetitionLayout.fragments.petition}
    ${PetitionRepliesField.fragments.petitionField}
    ${PetitionSendouts.fragments.petition}
  `,
  user: gql`
    fragment PetitionReplies_User on User {
      ...PetitionLayout_User
    }
    ${PetitionLayout.fragments.user}
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
    ${PetitionReplies.fragments.petition}
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
    ${PetitionLayout.fragments.petition}
  `,
  gql`
    mutation PetitionReplies_fileUploadReplyDownloadLink(
      $petitionId: ID!
      $replyId: ID!
    ) {
      fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId) {
        result
        url
      }
    }
  `,
  gql`
    mutation PetitionReplies_sendReminders(
      $petitionId: ID!
      $sendoutIds: [ID!]!
    ) {
      sendReminders(petitionId: $petitionId, sendoutIds: $sendoutIds) {
        result
        sendouts {
          id
          status
        }
      }
    }
  `,
];

const GET_PETITION_REPLIES_DATA = gql`
  query PetitionReplies($id: ID!) {
    petition(id: $id) {
      ...PetitionReplies_Petition
    }
  }
  ${PetitionReplies.fragments.petition}
`;

const GET_PETITION_REPLIES_USER_DATA = gql`
  query PetitionRepliesUser {
    me {
      ...PetitionReplies_User
    }
  }
  ${PetitionReplies.fragments.user}
`;

function useDownloadReplyFile() {
  const [mutate] = usePetitionReplies_fileUploadReplyDownloadLinkMutation();
  const showFailure = useFailureGeneratingLinkDialog();
  return useCallback(
    async function downloadReplyFile(
      petitionId: string,
      reply: Pick<PetitionFieldReply, "id" | "content">
    ) {
      const _window = window.open(undefined, "_blank")!;
      const { data } = await mutate({
        variables: { petitionId, replyId: reply.id },
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

function useSendReminder() {
  const intl = useIntl();
  const toast = useToast();
  const [sendReminders] = usePetitionReplies_sendRemindersMutation();
  return useCallback(async (petitionId: string, sendoutId: string) => {
    await sendReminders({
      variables: { petitionId, sendoutIds: [sendoutId] },
    });
    toast({
      title: intl.formatMessage({
        id: "petition.reminder-sent.toast-header",
        defaultMessage: "Reminder sent",
      }),
      description: intl.formatMessage({
        id: "petition.reminder-sent.toast-description",
        defaultMessage: "The reminder is on it's way",
      }),
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }, []);
}

PetitionReplies.getInitialProps = async ({
  apollo,
  query,
}: WithDataContext) => {
  await Promise.all([
    apollo.query<PetitionRepliesQuery, PetitionRepliesQueryVariables>({
      query: GET_PETITION_REPLIES_DATA,
      variables: { id: query.petitionId as string },
    }),
    apollo.query<PetitionRepliesUserQuery>({
      query: GET_PETITION_REPLIES_USER_DATA,
    }),
  ]);
  return {
    petitionId: query.petitionId as string,
  };
};

export default withData(PetitionReplies);
