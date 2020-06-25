import { Box, Button, Stack, Text } from "@chakra-ui/core";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import { Spacer } from "@parallel/components/common/Spacer";
import { Title } from "@parallel/components/common/Title";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { PaneWithFlyout } from "@parallel/components/layout/PaneWithFlyout";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import {
  DownloadAllDialog,
  useDownloadAllDialog,
} from "@parallel/components/petition-replies/DownloadAllDialog";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition-replies/FailureGeneratingLinkDialog";
import {
  PetitionRepliesField,
  PetitionRepliesFieldAction,
} from "@parallel/components/petition-replies/PetitionRepliesField";
import { PetitionRepliesFieldComments } from "@parallel/components/petition-replies/PetitionRepliesFieldComments";
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
  usePetitionReplies_createPetitionFieldCommentMutation,
  PetitionReplies_createPetitionFieldCommentMutationVariables,
  PetitionReplies_createPetitionFieldComment_PetitionFieldFragment,
  PetitionReplies_deletePetitionFieldCommentMutationVariables,
  usePetitionReplies_deletePetitionFieldCommentMutation,
  PetitionReplies_deletePetitionFieldComment_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
import { usePetitionState } from "@parallel/utils/usePetitionState";
import { gql } from "apollo-boost";
import { useCallback, useMemo, useState } from "react";
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

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const activeField = activeFieldId
    ? petition!.fields.find((f) => f.id === activeFieldId)
    : null;
  const activeFieldElement = useMemo(() => {
    return activeFieldId
      ? document.querySelector<HTMLElement>(`#field-${activeFieldId}`)!
      : null;
  }, [activeFieldId]);

  const [state, wrapper] = usePetitionState();
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
  const downloadAllDialog = useDownloadAllDialog();
  const handleDownloadAllClick = useCallback(async () => {
    try {
      const pattern = await downloadAllDialog({ fields: petition!.fields });
      window.open(
        `/api/downloads/petition/${petitionId}/files?pattern=${encodeURIComponent(
          pattern
        )}`,
        "_blank"
      );
    } catch {}
  }, [petitionId, petition!.fields]);

  const showDownloadAll = petition!.fields.some(
    (f) => f.type === "FILE_UPLOAD" && f.replies.length > 0
  );

  let pendingComments = 0;
  for (const field of petition!.fields) {
    for (const comment of field.comments) {
      pendingComments += comment.publishedAt ? 0 : 1;
    }
  }

  const createPetitionFieldComment = useCreatePetitionFieldComment();
  async function handleAddComment(content: string) {
    await createPetitionFieldComment({
      petitionId,
      petitionFieldId: activeFieldId!,
      content,
    });
  }

  const deletePetitionFieldComment = useDeletePetitionFieldComment();
  async function handleDeleteComment(petitionFieldCommentId: string) {
    await deletePetitionFieldComment({
      petitionId,
      petitionFieldId: activeFieldId!,
      petitionFieldCommentId,
    });
  }

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
        key={petition!.id}
        user={me}
        petition={petition!}
        onUpdatePetition={handleOnUpdatePetition}
        section="replies"
        scrollBody={false}
        state={state}
        display="flex"
        flexDirection="column"
        minHeight={0}
        overflow="visible"
      >
        <Stack
          direction="row"
          paddingX={4}
          paddingY={2}
          backgroundColor={pendingComments ? "yellow.50" : "white"}
        >
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
          {/* <Button
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
          </Button> */}
          {pendingComments ? (
            <Button variantColor="yellow">
              <FormattedMessage
                id="petition-replies.submit-comments"
                defaultMessage="Submit {commentCount, plural, =1 {# comment} other{# comments}}"
                values={{ commentCount: pendingComments }}
              />
            </Button>
          ) : null}
          {showDownloadAll ? (
            <Button
              variantColor="purple"
              leftIcon="download"
              onClick={handleDownloadAllClick}
            >
              <FormattedMessage
                id="petition.replies.download-all"
                defaultMessage="Download files"
              />
            </Button>
          ) : null}
        </Stack>
        <Divider />
        <Box flex="1" overflow="auto">
          <PaneWithFlyout
            active={Boolean(activeFieldId)}
            alignWith={activeFieldElement}
            flyout={
              <Box padding={4} paddingLeft={{ md: 0 }}>
                <PetitionRepliesFieldComments
                  key={activeFieldId!}
                  field={activeField!}
                  onClose={() => setActiveFieldId(null)}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                />
              </Box>
            }
          >
            <Stack flex="2" spacing={4} padding={4} id="petition-replies">
              {petition!.fields.map((field, index) => (
                <PetitionRepliesField
                  id={`field-${field.id}`}
                  key={field.id}
                  field={field}
                  index={index}
                  highlighted={activeFieldId === field.id}
                  onValidateToggle={() =>
                    handleValidateToggle([field.id], !field.validated)
                  }
                  onAction={handleAction}
                  isShowingComments={activeFieldId === field.id}
                  commentCount={index}
                  newCommentCount={index > 1 ? index - 1 : 0}
                  onToggleComments={() =>
                    setActiveFieldId(
                      activeFieldId === field.id ? null : field.id
                    )
                  }
                />
              ))}
            </Stack>
          </PaneWithFlyout>
        </Box>
      </PetitionLayout>
    </>
  );
}

PetitionReplies.fragments = {
  Petition: gql`
    fragment PetitionReplies_Petition on Petition {
      id
      ...PetitionLayout_Petition
      fields {
        ...PetitionRepliesField_PetitionField
        ...PetitionRepliesFieldComments_PetitionField
        ...DownloadAllDialog_PetitionField
      }
    }
    ${PetitionLayout.fragments.Petition}
    ${PetitionRepliesField.fragments.PetitionField}
    ${PetitionRepliesFieldComments.fragments.PetitionField}
    ${DownloadAllDialog.fragments.PetitionField}
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
  gql`
    mutation PetitionReplies_createPetitionFieldComment(
      $petitionId: ID!
      $petitionFieldId: ID!
      $petitionFieldReplyId: ID
      $content: String!
    ) {
      createPetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldReplyId: $petitionFieldReplyId
        content: $content
      ) {
        ...PetitionRepliesFieldComments_PetitionFieldComment
      }
    }
    ${PetitionRepliesFieldComments.fragments.PetitionFieldComment}
  `,
  gql`
    mutation PetitionReplies_deletePetitionFieldComment(
      $petitionId: ID!
      $petitionFieldId: ID!
      $petitionFieldCommentId: ID!
    ) {
      deletePetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
      )
    }
    ${PetitionRepliesFieldComments.fragments.PetitionFieldComment}
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

function useCreatePetitionFieldComment() {
  const [
    createPetitionFieldComment,
  ] = usePetitionReplies_createPetitionFieldCommentMutation();
  return useCallback(
    async (
      variables: PetitionReplies_createPetitionFieldCommentMutationVariables
    ) => {
      await createPetitionFieldComment({
        variables,
        update(client, { data }) {
          if (!data) {
            return;
          }
          const options = {
            fragment: gql`
              fragment PetitionReplies_createPetitionFieldComment_PetitionField on PetitionField {
                comments {
                  ...PetitionRepliesFieldComments_PetitionFieldComment
                }
              }
              ${PetitionRepliesFieldComments.fragments.PetitionFieldComment}
            `,
            fragmentName:
              "PetitionReplies_createPetitionFieldComment_PetitionField",
            id: variables.petitionFieldId,
          };
          const field = client.readFragment<
            PetitionReplies_createPetitionFieldComment_PetitionFieldFragment
          >(options);
          client.writeFragment<
            PetitionReplies_createPetitionFieldComment_PetitionFieldFragment
          >({
            ...options,
            data: {
              ...field,
              comments: [...field!.comments, data!.createPetitionFieldComment],
            },
          });
        },
      });
    },
    [createPetitionFieldComment]
  );
}

function useDeletePetitionFieldComment() {
  const [
    deletePetitionFieldComment,
  ] = usePetitionReplies_deletePetitionFieldCommentMutation();
  return useCallback(
    async (
      variables: PetitionReplies_deletePetitionFieldCommentMutationVariables
    ) => {
      await deletePetitionFieldComment({
        variables,
        update(client, { data }) {
          if (!data) {
            return;
          }
          const options = {
            fragment: gql`
              fragment PetitionReplies_deletePetitionFieldComment_PetitionField on PetitionField {
                comments {
                  id
                }
              }
            `,
            id: variables.petitionFieldId,
          };
          const field = client.readFragment<
            PetitionReplies_deletePetitionFieldComment_PetitionFieldFragment
          >(options);
          client.writeFragment<
            PetitionReplies_deletePetitionFieldComment_PetitionFieldFragment
          >({
            ...options,
            data: {
              ...field,
              comments: field!.comments.filter(
                (c) => c.id !== variables.petitionFieldCommentId
              ),
            },
          });
        },
      });
    },
    [deletePetitionFieldComment]
  );
}

PetitionReplies.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery<PetitionRepliesQuery, PetitionRepliesQueryVariables>(
      gql`
        query PetitionReplies($id: ID!) {
          petition(id: $id) {
            ...PetitionReplies_Petition
          }
        }
        ${PetitionReplies.fragments.Petition}
      `,
      {
        variables: { id: query.petitionId as string },
      }
    ),
    fetchQuery<PetitionRepliesUserQuery>(
      gql`
        query PetitionRepliesUser {
          me {
            ...PetitionReplies_User
          }
        }
        ${PetitionReplies.fragments.User}
      `
    ),
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
