import { gql, useApolloClient } from "@apollo/client";
import { Box, Button, Stack, Text, useToast } from "@chakra-ui/core";
import {
  DownloadIcon,
  ListIcon,
  RepeatIcon,
  ThumbUpIcon,
} from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { PaneWithFlyout } from "@parallel/components/layout/PaneWithFlyout";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { PetitionFieldsIndex } from "@parallel/components/petition-common/PetitionFieldsIndex";
import { ClosePetitionButton } from "@parallel/components/petition-replies/ClosePetitionButton";
import { useClosePetitionDialog } from "@parallel/components/petition-replies/ClosePetitionDialog";
import { useConfirmPetitionCompletedDialog } from "@parallel/components/petition-replies/ConfirmPetitionCompletedDialog";
import { useConfirmResendCompletedNotificationDialog } from "@parallel/components/petition-replies/ConfirmResendCompletedNotificationDialog";
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
  PetitionFieldReplyStatus,
  PetitionRepliesFieldComments_PetitionFieldCommentFragment,
  PetitionRepliesQuery,
  PetitionRepliesQueryVariables,
  PetitionRepliesUserQuery,
  PetitionReplies_createPetitionFieldCommentMutationVariables,
  PetitionReplies_createPetitionFieldComment_PetitionFieldFragment,
  PetitionReplies_deletePetitionFieldCommentMutationVariables,
  PetitionReplies_deletePetitionFieldComment_PetitionFieldFragment,
  PetitionReplies_PetitionFragment,
  PetitionReplies_updatePetitionFieldCommentMutationVariables,
  PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables,
  PetitionStatus,
  UpdatePetitionInput,
  usePetitionRepliesQuery,
  usePetitionRepliesUserQuery,
  usePetitionReplies_createPetitionFieldCommentMutation,
  usePetitionReplies_deletePetitionFieldCommentMutation,
  usePetitionReplies_fileUploadReplyDownloadLinkMutation,
  usePetitionReplies_markPetitionFieldCommentsAsReadMutation,
  usePetitionReplies_presendPetitionClosedNotificationMutation,
  usePetitionReplies_sendPetitionClosedNotificationMutation,
  usePetitionReplies_submitUnpublishedCommentsMutation,
  usePetitionReplies_updatePetitionFieldCommentMutation,
  usePetitionReplies_updatePetitionFieldRepliesStatusMutation,
  usePetitionReplies_updatePetitionMutation,
  usePetitionReplies_validatePetitionFieldsMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import { UnwrapPromise } from "@parallel/utils/types";
import { usePetitionState } from "@parallel/utils/usePetitionState";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

type PetitionRepliesProps = UnwrapPromise<
  ReturnType<typeof PetitionReplies.getInitialProps>
>;

function PetitionReplies({ petitionId }: PetitionRepliesProps) {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(usePetitionRepliesUserQuery());
  const { data, refetch } = assertQuery(
    usePetitionRepliesQuery({ variables: { id: petitionId } })
  );
  const petition = data!.petition as PetitionReplies_PetitionFragment;
  const toast = useToast();

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const activeField = activeFieldId
    ? petition.fields.find((f) => f.id === activeFieldId)
    : null;
  const activeFieldElement = useMemo(() => {
    return activeFieldId
      ? document.querySelector<HTMLElement>(`#field-${activeFieldId}`)!
      : null;
  }, [activeFieldId]);

  useEffect(() => {
    if (activeFieldId) {
      document.body.classList.add("hide-hubspot");
    } else {
      document.body.classList.remove("hide-hubspot");
    }
    return () => document.body.classList.remove("hide-hubspot");
  }, [Boolean(activeFieldId)]);

  const [
    markPetitionFieldCommentsAsRead,
  ] = usePetitionReplies_markPetitionFieldCommentsAsReadMutation();
  useEffect(() => {
    if (activeFieldId) {
      const timeout = setTimeout(async () => {
        const petitionFieldCommentIds = activeField!.comments
          .filter((c) => c.isUnread)
          .map((c) => c.id);
        if (petitionFieldCommentIds.length > 0) {
          await markPetitionFieldCommentsAsRead({
            variables: { petitionId, petitionFieldCommentIds },
          });
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [activeFieldId]);

  const [state, wrapper] = usePetitionState();
  const [updatePetition] = usePetitionReplies_updatePetitionMutation();
  const [
    validatePetitionFields,
  ] = usePetitionReplies_validatePetitionFieldsMutation();
  const downloadReplyFile = useDownloadReplyFile();

  const handleValidateToggle = useCallback(
    async (
      fieldIds: string[],
      value: boolean,
      validateRepliesWith?: PetitionFieldReplyStatus
    ) => {
      await validatePetitionFields({
        variables: {
          petitionId: petition.id,
          fieldIds,
          value,
          validateRepliesWith,
        },
        optimisticResponse: {
          validatePetitionFields: {
            __typename: "PetitionAndPartialFields",
            petition: {
              id: petition.id,
              status: petition.status, // TODO predict correct status
              __typename: "Petition",
            },
            fields: fieldIds.map((id) => {
              const field = petition.fields.find((f) => f.id === id)!;
              return {
                __typename: "PetitionField",
                id,
                validated: value,
                replies: field.replies.map((reply) => ({
                  ...pick(reply, ["__typename", "id"]),
                  status:
                    reply.status === "PENDING"
                      ? validateRepliesWith ?? reply.status
                      : reply.status,
                })),
              };
            }),
          },
        },
      });
    },
    [petition]
  );

  const updatePetitionFieldRepliesStatus = useUpdatePetitionFieldRepliesStatus();
  async function handleUpdateRepliesStatus(
    petitionFieldId: string,
    petitionFieldReplyIds: string[],
    status: PetitionFieldReplyStatus
  ) {
    if (status === "REJECTED") {
      setActiveFieldId(petitionFieldId);
      setTimeout(() => {
        const input = document.querySelector<HTMLTextAreaElement>(
          "#petition-replies-comments-input"
        );
        scrollIntoView(input!, { block: "center", behavior: "smooth" });
        input!.focus();
      }, 150);
    }
    const field = petition.fields.find((f) => f.id === petitionFieldId)!;
    await updatePetitionFieldRepliesStatus(
      {
        petitionId,
        petitionFieldId,
        petitionFieldReplyIds,
        status,
      },
      petition.status,
      // field is automatically validated if there are no pending replies
      status === "APPROVED"
        ? field.validated ||
            field.replies.every(
              (r) =>
                petitionFieldReplyIds.includes(r.id) || r.status !== "PENDING"
            )
        : field.validated
    );
  }

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
      let pattern = "";
      if (
        petition.fields.some(
          (field) => field.type === "FILE_UPLOAD" && field.replies.length > 0
        )
      ) {
        pattern = await downloadAllDialog({ fields: petition.fields });
      }
      window.open(
        `/api/downloads/petition/${petitionId}/files?pattern=${encodeURIComponent(
          pattern
        )}`,
        "_blank"
      );
    } catch {}
  }, [petitionId, petition.fields]);

  const showDownloadAll = petition.fields.some(
    (f) => ["FILE_UPLOAD", "TEXT"].includes(f.type) && f.replies.length > 0
  );

  let pendingComments = 0;
  for (const field of petition.fields) {
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

  const updatePetitionFieldComment = useUpdatePetitionFieldComment();
  async function handleUpdateComment(
    petitionFieldCommentId: string,
    content: string
  ) {
    await updatePetitionFieldComment({
      petitionId,
      petitionFieldId: activeFieldId!,
      petitionFieldCommentId,
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

  const [
    submitUnpublishedComments,
    { loading: isSubmitting },
  ] = usePetitionReplies_submitUnpublishedCommentsMutation();
  async function handleSubmitUnpublished() {
    await submitUnpublishedComments({
      variables: { petitionId },
    });
  }

  const handleIndexFieldClick = useCallback(async (fieldId: string) => {
    const fieldElement = document.querySelector(`#field-${fieldId}`);
    if (fieldElement) {
      await scrollIntoView(fieldElement, { scrollMode: "if-needed" });
      fieldElement.setAttribute("data-highlighted", "true");
      setTimeout(() => {
        fieldElement.removeAttribute("data-highlighted");
      }, 1000);
    }
  }, []);

  const fieldIndexValues = useFieldIndexValues(petition.fields);

  const confirmPetitionDialog = useConfirmPetitionCompletedDialog();
  const [
    sendPetitionClosedNotification,
  ] = usePetitionReplies_sendPetitionClosedNotificationMutation();
  const [
    presendPetitionClosedNotification,
  ] = usePetitionReplies_presendPetitionClosedNotificationMutation();
  const petitionAlreadyNotifiedDialog = useConfirmResendCompletedNotificationDialog();
  const handleConfirmPetitionCompleted = useCallback(async () => {
    const petitionClosedNotificationToast = {
      title: intl.formatMessage({
        id: "petition.message-sent.toast-header",
        defaultMessage: "Message sent",
      }),
      description: intl.formatMessage({
        id: "petition.message-sent.toast-description",
        defaultMessage: "The message is on it's way",
      }),
      status: "success" as const,
      duration: 3000,
      isClosable: true,
    };
    try {
      await presendPetitionClosedNotification({
        variables: { petitionId: petition.id },
      });
      await sendPetitionClosedNotification({
        variables: {
          petitionId: petition.id,
          emailBody: await confirmPetitionDialog({
            locale: petition.locale,
          }),
        },
      });
      toast(petitionClosedNotificationToast);
    } catch (error) {
      if (
        error?.graphQLErrors?.[0]?.extensions.code ===
        "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR"
      ) {
        try {
          await petitionAlreadyNotifiedDialog({});
          await sendPetitionClosedNotification({
            variables: {
              petitionId: petition.id,
              emailBody: await confirmPetitionDialog({
                locale: petition.locale,
              }),
              force: true,
            },
          });
          toast(petitionClosedNotificationToast);
        } catch {}
      }
    }
  }, [petition, intl.locale]);

  const closePetitionDialog = useClosePetitionDialog();
  const handleClosePetition = useCallback(
    async (sendNotification: boolean) => {
      try {
        const hasUnreviewedReplies = petition.fields.some((f) =>
          f.replies.some((r) => r.status === "PENDING")
        );

        const option = hasUnreviewedReplies
          ? await closePetitionDialog({})
          : "APPROVE";

        await handleValidateToggle(
          petition.fields.map((f) => f.id),
          true,
          option === "APPROVE" ? "APPROVED" : "REJECTED"
        );
        if (sendNotification) {
          await handleConfirmPetitionCompleted();
        }
      } catch {}
    },
    [petition, handleValidateToggle, handleConfirmPetitionCompleted]
  );

  return (
    <PetitionLayout
      key={petition.id}
      user={me}
      petition={petition}
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
          icon={<RepeatIcon />}
          placement="bottom"
          variant="outline"
          label={intl.formatMessage({
            id: "generic.reload-data",
            defaultMessage: "Reload",
          })}
        />
        <ClosePetitionButton
          hidden={petition.status === "CLOSED"}
          onClosePetition={handleClosePetition}
        />
        <Button
          hidden={petition.status !== "CLOSED"}
          colorScheme="blue"
          leftIcon={<ThumbUpIcon fontSize="lg" display="block" />}
          onClick={() => handleConfirmPetitionCompleted()}
        >
          <FormattedMessage
            id="petition-replies.notify-petition-reviewed.button"
            defaultMessage="Notify that it is correct"
          />
        </Button>
        {pendingComments ? (
          <Button
            colorScheme="yellow"
            isDisabled={isSubmitting}
            onClick={handleSubmitUnpublished}
          >
            <FormattedMessage
              id="petition-replies.submit-comments"
              defaultMessage="Submit {commentCount, plural, =1 {# comment} other{# comments}}"
              values={{ commentCount: pendingComments }}
            />
          </Button>
        ) : null}
        {showDownloadAll ? (
          <Button
            colorScheme="purple"
            leftIcon={<DownloadIcon fontSize="lg" display="block" />}
            onClick={handleDownloadAllClick}
            id="download-all"
          >
            <FormattedMessage
              id="petition-replies.download-all"
              defaultMessage="Download replies"
            />
          </Button>
        ) : null}
      </Stack>
      <Divider />
      <Box flex="1" overflow="auto">
        <PaneWithFlyout
          isFlyoutActive={Boolean(activeFieldId)}
          alignWith={activeFieldElement}
          flyout={
            <Box padding={4} paddingLeft={{ md: 0 }}>
              {activeFieldId ? (
                <PetitionRepliesFieldComments
                  key={activeFieldId!}
                  field={activeField!}
                  userId={me.id}
                  onClose={() => setActiveFieldId(null)}
                  onAddComment={handleAddComment}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                />
              ) : (
                <Card
                  display="flex"
                  flexDirection="column"
                  maxHeight={`calc(100vh - 6rem)`}
                >
                  <CardHeader>
                    <Text as="span" display="inline-flex" alignItems="center">
                      <ListIcon fontSize="18px" marginRight={2} />
                      <FormattedMessage
                        id="petition.contents"
                        defaultMessage="Contents"
                      />
                    </Text>
                  </CardHeader>
                  <Box overflow="auto">
                    <PetitionFieldsIndex
                      fields={petition.fields}
                      onFieldClick={handleIndexFieldClick}
                    />
                  </Box>
                </Card>
              )}
            </Box>
          }
        >
          <Stack flex="2" spacing={4} padding={4} id="petition-replies">
            {petition.fields.map((field, index) => (
              <PetitionRepliesField
                id={`field-${field.id}`}
                key={field.id}
                field={field}
                fieldRelativeIndex={fieldIndexValues[index]}
                index={index}
                onValidateToggle={() =>
                  handleValidateToggle([field.id], !field.validated)
                }
                onAction={handleAction}
                isActive={activeFieldId === field.id}
                commentCount={index}
                newCommentCount={index > 1 ? index - 1 : 0}
                onToggleComments={() =>
                  setActiveFieldId(activeFieldId === field.id ? null : field.id)
                }
                onUpdateReplyStatus={(replyId, status) =>
                  handleUpdateRepliesStatus(field.id, [replyId], status)
                }
              />
            ))}
          </Stack>
        </PaneWithFlyout>
      </Box>
    </PetitionLayout>
  );
}

PetitionReplies.fragments = {
  get Petition() {
    return gql`
      fragment PetitionReplies_Petition on Petition {
        id
        ...PetitionLayout_PetitionBase
        events(limit: 1000) {
          items {
            id
            __typename
          }
        }
        fields {
          ...PetitionReplies_PetitionField
        }
      }
      ${PetitionLayout.fragments.PetitionBase}
      ${this.PetitionField}
    `;
  },
  get PetitionField() {
    return gql`
      fragment PetitionReplies_PetitionField on PetitionField {
        isReadOnly
        ...PetitionRepliesField_PetitionField
        ...PetitionFieldsIndex_PetitionField
        ...PetitionRepliesFieldComments_PetitionField
        ...DownloadAllDialog_PetitionField
      }
      ${PetitionRepliesField.fragments.PetitionField}
      ${PetitionRepliesFieldComments.fragments.PetitionField}
      ${DownloadAllDialog.fragments.PetitionField}
      ${PetitionFieldsIndex.fragments.PetitionField}
    `;
  },
  get User() {
    return gql`
      fragment PetitionReplies_User on User {
        ...PetitionLayout_User
      }
      ${PetitionLayout.fragments.User}
    `;
  },
};

PetitionReplies.mutations = [
  gql`
    mutation PetitionReplies_updatePetition(
      $petitionId: GID!
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
      $petitionId: GID!
      $fieldIds: [GID!]!
      $value: Boolean!
      $validateRepliesWith: PetitionFieldReplyStatus
    ) {
      validatePetitionFields(
        petitionId: $petitionId
        fieldIds: $fieldIds
        value: $value
        validateRepliesWith: $validateRepliesWith
      ) {
        petition {
          id
          status
        }
        fields {
          id
          validated
          replies {
            id
            status
          }
        }
      }
    }
  `,
  gql`
    mutation PetitionReplies_fileUploadReplyDownloadLink(
      $petitionId: GID!
      $replyId: GID!
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
      $petitionId: GID!
      $petitionFieldId: GID!
      $petitionFieldReplyId: GID
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
    mutation PetitionReplies_updatePetitionFieldComment(
      $petitionId: GID!
      $petitionFieldId: GID!
      $petitionFieldCommentId: GID!
      $content: String!
    ) {
      updatePetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
        content: $content
      ) {
        ...PetitionRepliesFieldComments_PetitionFieldComment
      }
    }
    ${PetitionRepliesFieldComments.fragments.PetitionFieldComment}
  `,
  gql`
    mutation PetitionReplies_deletePetitionFieldComment(
      $petitionId: GID!
      $petitionFieldId: GID!
      $petitionFieldCommentId: GID!
    ) {
      deletePetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
      )
    }
  `,
  gql`
    mutation PetitionReplies_submitUnpublishedComments($petitionId: GID!) {
      submitUnpublishedComments(petitionId: $petitionId) {
        id
        publishedAt
      }
    }
  `,
  gql`
    mutation PetitionReplies_markPetitionFieldCommentsAsRead(
      $petitionId: GID!
      $petitionFieldCommentIds: [GID!]!
    ) {
      markPetitionFieldCommentsAsRead(
        petitionId: $petitionId
        petitionFieldCommentIds: $petitionFieldCommentIds
      ) {
        id
        isUnread
      }
    }
  `,
  gql`
    mutation PetitionReplies_updatePetitionFieldRepliesStatus(
      $petitionId: GID!
      $petitionFieldId: GID!
      $petitionFieldReplyIds: [GID!]!
      $status: PetitionFieldReplyStatus!
    ) {
      updatePetitionFieldRepliesStatus(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldReplyIds: $petitionFieldReplyIds
        status: $status
      ) {
        petition {
          id
          status
        }
        field {
          id
          validated
        }
        replies {
          id
          status
        }
      }
    }
  `,
  gql`
    mutation PetitionReplies_sendPetitionClosedNotification(
      $petitionId: GID!
      $emailBody: JSON!
      $force: Boolean
    ) {
      sendPetitionClosedNotification(
        petitionId: $petitionId
        emailBody: $emailBody
        force: $force
      ) {
        id
        events(limit: 1000) {
          items {
            id
            __typename
          }
        }
      }
    }
  `,
  gql`
    mutation PetitionReplies_presendPetitionClosedNotification(
      $petitionId: GID!
    ) {
      presendPetitionClosedNotification(petitionId: $petitionId)
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

function useUpdatePetitionFieldComment() {
  const [
    updatePetitionFieldComment,
  ] = usePetitionReplies_updatePetitionFieldCommentMutation();
  const apollo = useApolloClient();
  return useCallback(
    async (
      variables: PetitionReplies_updatePetitionFieldCommentMutationVariables
    ) => {
      await updatePetitionFieldComment({
        variables,
        optimisticResponse: () => {
          const comment = apollo.readFragment<
            PetitionRepliesFieldComments_PetitionFieldCommentFragment
          >({
            fragment:
              PetitionRepliesFieldComments.fragments.PetitionFieldComment,
            id: variables.petitionFieldCommentId,
            fragmentName: "PetitionRepliesFieldComments_PetitionFieldComment",
          });
          return {
            updatePetitionFieldComment: {
              ...comment!,
              content: variables.content,
            },
          };
        },
      });
    },
    [updatePetitionFieldComment]
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

function useUpdatePetitionFieldRepliesStatus() {
  const [
    updatePetitionFieldRepliesStatus,
  ] = usePetitionReplies_updatePetitionFieldRepliesStatusMutation();
  return useCallback(
    async (
      variables: PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables,
      petitionStatus: PetitionStatus,
      optimisticValidated: boolean
    ) =>
      await updatePetitionFieldRepliesStatus({
        variables,
        optimisticResponse: (({
          petitionFieldId,
          petitionFieldReplyIds,
          status,
        }: PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables) => ({
          updatePetitionFieldRepliesStatus: {
            __typename: "PetitionWithFieldAndReplies",
            petition: {
              id: variables.petitionId,
              status: petitionStatus, // TODO predict correct status
              __typename: "Petition",
            },
            field: {
              __typename: "PetitionField",
              id: petitionFieldId,
              validated: optimisticValidated,
            },
            replies: petitionFieldReplyIds.map((id) => ({
              __typename: "PetitionFieldReply",
              id,
              status,
            })),
          },
        })) as any,
      }),
    [updatePetitionFieldRepliesStatus]
  );
}

PetitionReplies.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery<PetitionRepliesQuery, PetitionRepliesQueryVariables>(
      gql`
        query PetitionReplies($id: GID!) {
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
          <>
            <Text>
              <FormattedMessage
                id="tour.petition-replies.control"
                defaultMessage="Here you can control and verify the information that your recipients have submitted."
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="tour.petition-replies.completed-items"
                defaultMessage="Keep track of the documents and replies you review by using the <b>approve and reject</b> buttons."
                values={{
                  b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                }}
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="tour.petition-replies.download"
                defaultMessage="If the information is correct and you need them, you can <b>download</b> the files, or <b>copy the text</b> responses."
                values={{
                  b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                }}
              />
            </Text>
          </>
        ),
        placement: "right-start",
        target: "#petition-replies",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-replies.conversations"
            defaultMessage="Conversations"
          />
        ),
        content: (
          <>
            <Text>
              <FormattedMessage
                id="tour.petition-replies.conversations.unclear"
                defaultMessage="Is there anything not clear? Is the submitted document incorrect?"
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="tour.petition-replies.conversations.keep"
                defaultMessage="Avoid back and forth emails, and keep track of the conversations around documents or information here."
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="tour.petition-replies.conversations.send"
                defaultMessage="Take your time to include your comments and send them when they are ready."
              />
            </Text>
          </>
        ),
        placement: "right-start",
        target: "#comment-0",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-replies.download.organize"
            defaultMessage="Organize your downloads"
          />
        ),
        content: (
          <>
            <Text>
              <FormattedMessage
                id="tour.petition-replies.download.save-time"
                defaultMessage="Save time downloading and renaming all the files from here."
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="tour.petition-replies.download.variables"
                defaultMessage="Try using <b>variables</b> to set how you want your filenames to appear."
                values={{
                  b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                }}
              />
            </Text>
          </>
        ),
        placement: "left-start",
        target: "#download-all",
      },
    ],
  }),
  withApolloData
)(PetitionReplies);
