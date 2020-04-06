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
import { Card } from "@parallel/components/common/Card";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { Divider } from "@parallel/components/common/Divider";
import { Spacer } from "@parallel/components/common/Spacer";
import { SplitButton } from "@parallel/components/common/SplitButton";
import { Title } from "@parallel/components/common/Title";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import {
  PetitionReviewField,
  PetitionReviewFieldAction,
} from "@parallel/components/petition/PetitionReviewField";
import { PetitionSendouts } from "@parallel/components/petition/PetitionSendouts";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  PetitionFieldReply,
  PetitionReviewQuery,
  PetitionReviewQueryVariables,
  PetitionReviewUserQuery,
  UpdatePetitionInput,
  usePetitionReviewQuery,
  usePetitionReview_fileUploadReplyDownloadLinkMutation,
  usePetitionReview_updatePetitionMutation,
  usePetitionReview_validatePetitionFieldsMutation,
  usePetitionsUserQuery,
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
  ReturnType<typeof PetitionReview.getInitialProps>
>;

function PetitionReview({ petitionId }: PetitionProps) {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(usePetitionsUserQuery());
  const {
    data: { petition },
  } = assertQuery(usePetitionReviewQuery({ variables: { id: petitionId } }));

  const [state, setState] = usePetitionState();
  const wrapper = useWrapPetitionUpdater(setState);
  const [updatePetition] = usePetitionReview_updatePetitionMutation();
  const [
    validatePetitionFields,
  ] = usePetitionReview_validatePetitionFieldsMutation();
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

  const handleAction = async function (action: PetitionReviewFieldAction) {
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
        section="review"
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
                      id="petition.review.select-all"
                      defaultMessage="All"
                    />
                  </MenuItem>
                  <MenuItem onClick={() => toggleBy(() => false)}>
                    <FormattedMessage
                      id="petition.review.select-none"
                      defaultMessage="None"
                    />
                  </MenuItem>
                </MenuList>
              }
            ></ButtonDropdown>
          </SplitButton>
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
                id="petition.review.validate-selected"
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
                <PetitionReviewField
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
            margin={4}
            marginTop={12}
          />
        </Box>
      </PetitionLayout>
    </>
  );
}

PetitionReview.fragments = {
  petition: gql`
    fragment PetitionReview_Petition on Petition {
      id
      ...PetitionLayout_Petition
      fields {
        ...PetitionReviewField_PetitionField
      }
      ...PetitionSendouts_Petition
    }
    ${PetitionLayout.fragments.petition}
    ${PetitionReviewField.fragments.petitionField}
    ${PetitionSendouts.fragments.petition}
  `,
  user: gql`
    fragment PetitionReview_User on User {
      ...PetitionLayout_User
    }
    ${PetitionLayout.fragments.user}
  `,
};

PetitionReview.mutations = [
  gql`
    mutation PetitionReview_updatePetition(
      $petitionId: ID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionReview_Petition
      }
    }
    ${PetitionReview.fragments.petition}
  `,
  gql`
    mutation PetitionReview_validatePetitionFields(
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
    mutation PetitionReview_fileUploadReplyDownloadLink(
      $petitionId: ID!
      $replyId: ID!
    ) {
      fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId) {
        result
        url
      }
    }
  `,
];

const GET_PETITION_REVIEW_DATA = gql`
  query PetitionReview($id: ID!) {
    petition(id: $id) {
      ...PetitionReview_Petition
    }
  }
  ${PetitionReview.fragments.petition}
`;

const GET_PETITION_REVIEW_USER_DATA = gql`
  query PetitionReviewUser {
    me {
      ...PetitionReview_User
    }
  }
  ${PetitionReview.fragments.user}
`;

function useDownloadReplyFile() {
  const [mutate] = usePetitionReview_fileUploadReplyDownloadLinkMutation();
  const openDialog = useDialog(FailureGeneratingLink, []);
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
          await openDialog({ filename: reply.content.filename });
        } catch {}
      }
    },
    [mutate]
  );
}

function FailureGeneratingLink({
  filename,
  ...props
}: {
  filename: string;
} & DialogCallbacks<string>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.review.download-file-error-dialog.header"
          defaultMessage="Error downloading {filename}"
          values={{
            filename,
          }}
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="petition.review.download-file-error-dialog.body"
            defaultMessage="There was a problem generating the link for {filename}. This usually means that the upload from the user failed."
            values={{
              filename,
            }}
          />
        </Text>
      }
      confirm={<></>}
      {...props}
    />
  );
}

PetitionReview.getInitialProps = async ({ apollo, query }: WithDataContext) => {
  await Promise.all([
    apollo.query<PetitionReviewQuery, PetitionReviewQueryVariables>({
      query: GET_PETITION_REVIEW_DATA,
      variables: { id: query.petitionId as string },
    }),
    apollo.query<PetitionReviewUserQuery>({
      query: GET_PETITION_REVIEW_USER_DATA,
    }),
  ]);
  return {
    petitionId: query.petitionId as string,
  };
};

export default withData(PetitionReview);
