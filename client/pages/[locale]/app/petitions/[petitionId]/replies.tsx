import { gql, useApolloClient } from "@apollo/client";
import { Box, Button, Stack, Text, useToast } from "@chakra-ui/react";
import {
  CheckIcon,
  CommentIcon,
  ConditionIcon,
  DownloadIcon,
  ListIcon,
  RepeatIcon,
  ThumbUpIcon,
} from "@parallel/chakra/icons";
import { Card, GenericCardHeader } from "@parallel/components/common/Card";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
  withDialogs,
} from "@parallel/components/common/DialogProvider";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import { RichTextEditorValue } from "@parallel/components/common/RichTextEditor";
import { ShareButton } from "@parallel/components/common/ShareButton";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { PaneWithFlyout } from "@parallel/components/layout/PaneWithFlyout";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { PetitionContents } from "@parallel/components/petition-common/PetitionContents";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/PetitionSharingDialog";
import { useClosePetitionDialog } from "@parallel/components/petition-replies/ClosePetitionDialog";
import { useConfirmResendCompletedNotificationDialog } from "@parallel/components/petition-replies/ConfirmResendCompletedNotificationDialog";
import {
  ExportRepliesDialog,
  useExportRepliesDialog,
} from "@parallel/components/petition-replies/ExportRepliesDialog";
import { useExportRepliesProgressDialog } from "@parallel/components/petition-replies/ExportRepliesProgressDialog";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition-replies/FailureGeneratingLinkDialog";
import {
  PetitionRepliesField,
  PetitionRepliesFieldProps,
} from "@parallel/components/petition-replies/PetitionRepliesField";
import { PetitionRepliesFieldComments } from "@parallel/components/petition-replies/PetitionRepliesFieldComments";
import { PetitionRepliesFilterButton } from "@parallel/components/petition-replies/PetitionRepliesFilterButton";
import { PetitionRepliesFilteredFields } from "@parallel/components/petition-replies/PetitionRepliesFilteredFields";
import { PetitionSignaturesCard } from "@parallel/components/petition-replies/PetitionSignaturesCard";
import { useSolveUnreviewedRepliesDialog } from "@parallel/components/petition-replies/SolveUnreviewedRepliesDialog";
import { RecipientViewCommentsBadge } from "@parallel/components/recipient-view/RecipientViewCommentsBadge";
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
  PetitionReplies_PetitionFieldFragment,
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
  usePetitionReplies_sendPetitionClosedNotificationMutation,
  usePetitionReplies_submitUnpublishedCommentsMutation,
  usePetitionReplies_updatePetitionFieldCommentMutation,
  usePetitionReplies_updatePetitionFieldRepliesStatusMutation,
  usePetitionReplies_updatePetitionMutation,
  usePetitionReplies_validatePetitionFieldsMutation,
  usePetitionSettings_cancelPetitionSignatureRequestMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import {
  defaultFieldsFilter,
  filterPetitionFields,
  PetitionFieldFilter,
} from "@parallel/utils/filterPetitionFields";
import { Maybe, unMaybeArray, UnwrapPromise } from "@parallel/utils/types";
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
    usePetitionRepliesQuery({
      variables: {
        id: petitionId,
        hasPetitionSignature: me.hasPetitionSignature,
        hasInternalComments: me.hasInternalComments,
      },
    })
  );
  const petition = data!.petition as PetitionReplies_PetitionFragment;

  const fieldVisibility = useFieldVisibility(petition.fields);
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

  const handleAction: PetitionRepliesFieldProps["onAction"] = async function (
    action,
    reply
  ) {
    switch (action) {
      case "DOWNLOAD_FILE":
      case "PREVIEW_FILE":
        try {
          await downloadReplyFile(petitionId, reply, action === "PREVIEW_FILE");
        } catch {}
        break;
    }
  };
  const showExportRepliesDialog = useExportRepliesDialog();
  const showExportRepliesProgressDialog = useExportRepliesProgressDialog();
  const handleDownloadAllClick = useCallback(async () => {
    const hasFiles =
      petition.fields.some(
        (field) => field.type === "FILE_UPLOAD" && field.replies.length > 0
      ) || petition.currentSignatureRequest?.status === "COMPLETED";
    try {
      if (hasFiles) {
        const res = await showExportRepliesDialog({
          user: me,
          fields: petition.fields,
        });
        if (res.type === "DOWNLOAD_ZIP") {
          window.open(
            `/api/downloads/petition/${petitionId}/files?pattern=${encodeURIComponent(
              res.pattern
            )}`,
            "_blank"
          );
        } else {
          const { pattern, externalClientId } = res;
          await showExportRepliesProgressDialog({
            petitionId: petition.id,
            pattern,
            externalClientId,
          });
        }
      } else {
        window.open(`/api/downloads/petition/${petitionId}/files`, "_blank");
      }
    } catch {}
  }, [petitionId, petition.fields]);

  const showDownloadAll = petition.fields.some(
    (f) =>
      ["FILE_UPLOAD", "TEXT", "SELECT"].includes(f.type) && f.replies.length > 0
  );

  let pendingComments = 0;
  for (const field of petition.fields) {
    for (const comment of field.comments) {
      pendingComments += comment.publishedAt ? 0 : 1;
    }
  }

  const createPetitionFieldComment = useCreatePetitionFieldComment();
  async function handleAddComment(content: string, isInternal?: boolean) {
    await createPetitionFieldComment({
      petitionId,
      petitionFieldId: activeFieldId!,
      content,
      isInternal,
      hasInternalComments: me.hasInternalComments,
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
      hasInternalComments: me.hasInternalComments,
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
      await scrollIntoView(fieldElement, {
        scrollMode: "if-needed",
        behavior: "smooth",
      });
      fieldElement.setAttribute("data-highlighted", "true");
      setTimeout(() => {
        fieldElement.removeAttribute("data-highlighted");
      }, 1000);
    }
  }, []);

  const indices = useFieldIndices(petition.fields);

  const showClosePetitionDialog = useClosePetitionDialog();
  const [
    sendPetitionClosedNotification,
  ] = usePetitionReplies_sendPetitionClosedNotificationMutation();
  const petitionAlreadyNotifiedDialog = useConfirmResendCompletedNotificationDialog();
  const handleFinishPetition = useCallback(
    async ({ requiredMessage }: { requiredMessage: boolean }) => {
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
      let message: Maybe<RichTextEditorValue> = null;
      let pdfExportTitle: Maybe<string> = null;
      try {
        const data = await showClosePetitionDialog({
          locale: petition.locale,
          petitionName: petition.name ?? null,
          hasPetitionPdfExport: me.hasPetitionPdfExport,
          requiredMessage,
        });
        message = data.message;
        pdfExportTitle = data.pdfExportTitle;

        if (message) {
          await sendPetitionClosedNotification({
            variables: {
              petitionId: petition.id,
              emailBody: message,
              attachPdfExport: !!pdfExportTitle,
              pdfExportTitle,
            },
          });
          toast(petitionClosedNotificationToast);
        }
      } catch (error) {
        // rethrow error to avoid continuing flow on function handleClosePetition
        if (["CANCEL", "CLOSE"].includes(error.reason)) {
          throw error;
        }
        if (
          error?.graphQLErrors?.[0]?.extensions.code ===
          "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR"
        ) {
          await petitionAlreadyNotifiedDialog({});
          await sendPetitionClosedNotification({
            variables: {
              petitionId: petition.id,
              emailBody: message,
              attachPdfExport: !!pdfExportTitle,
              pdfExportTitle,
              force: true,
            },
          });
          toast(petitionClosedNotificationToast);
        }
      }
    },
    [petition, intl.locale]
  );

  const showSolveUnreviewedRepliesDialog = useSolveUnreviewedRepliesDialog();

  const showConfirmCancelOngoingSignature = useDialog(
    ConfirmCancelOngoingSignature
  );

  const [
    cancelSignatureRequest,
  ] = usePetitionSettings_cancelPetitionSignatureRequestMutation();

  const handleClosePetition = useCallback(async () => {
    try {
      const hasPendingSignature =
        (petition.currentSignatureRequest &&
          ["ENQUEUED", "PROCESSING"].includes(
            petition.currentSignatureRequest.status
          )) ??
        false;
      if (hasPendingSignature || petition.signatureConfig) {
        await showConfirmCancelOngoingSignature({});
        if (hasPendingSignature) {
          await cancelSignatureRequest({
            variables: {
              petitionSignatureRequestId: petition.currentSignatureRequest!.id,
            },
          });
        }
        await updatePetition({
          variables: {
            petitionId: petition.id,
            data: { signatureConfig: null },
          },
        });
        refetch();
      }

      const hasUnreviewedReplies = petition.fields.some((f) =>
        f.replies.some((r) => r.status === "PENDING")
      );
      const option = hasUnreviewedReplies
        ? await showSolveUnreviewedRepliesDialog({})
        : "APPROVE";

      await handleFinishPetition({ requiredMessage: false });

      await handleValidateToggle(
        petition.fields.map((f) => f.id),
        true,
        option === "APPROVE" ? "APPROVED" : "REJECTED"
      );
    } catch {}
  }, [
    petition,
    handleValidateToggle,
    handleFinishPetition,
    cancelSignatureRequest,
  ]);

  const showPetitionSharingDialog = usePetitionSharingDialog();
  const handlePetitionSharingClick = async function () {
    try {
      await showPetitionSharingDialog({
        userId: me.id,
        petitionId: petition.id,
      });
    } catch {}
  };

  const [filter, setFilter] = useState<PetitionFieldFilter>(
    defaultFieldsFilter
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
      headerActions={
        <Box display={{ base: "none", lg: "block" }}>
          <ShareButton
            petition={petition}
            userId={me.id}
            onClick={handlePetitionSharingClick}
          />
        </Box>
      }
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

        <Button
          hidden={petition.status === "CLOSED"}
          colorScheme="green"
          leftIcon={<CheckIcon />}
          onClick={handleClosePetition}
        >
          <FormattedMessage
            id="petition-replies.finalize-petition.button"
            defaultMessage="Finish petition"
          />
        </Button>
        <Button
          hidden={petition.status !== "CLOSED"}
          colorScheme="blue"
          leftIcon={<ThumbUpIcon fontSize="lg" display="block" />}
          onClick={async () => {
            try {
              await handleFinishPetition({ requiredMessage: true });
            } catch {}
          }}
        >
          <FormattedMessage
            id="petition-replies.notify-petition-reviewed.button"
            defaultMessage="Notify that it is correct"
          />
        </Button>
        {showDownloadAll ? (
          <Button
            colorScheme="purple"
            leftIcon={<DownloadIcon fontSize="lg" display="block" />}
            onClick={handleDownloadAllClick}
            id="download-all"
          >
            <FormattedMessage
              id="petition-replies.export-replies"
              defaultMessage="Export replies"
            />
          </Button>
        ) : null}
        <Spacer />
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
                  petitionId={petition.id}
                  hasCommentsEnabled={petition.hasCommentsEnabled}
                  field={activeField!}
                  user={me}
                  onClose={() => setActiveFieldId(null)}
                  onAddComment={handleAddComment}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                />
              ) : (
                <Card
                  display="flex"
                  flexDirection="column"
                  maxHeight={`calc(100vh - 153px)`}
                >
                  <GenericCardHeader
                    rightAction={
                      <PetitionRepliesFilterButton
                        value={filter}
                        onChange={setFilter}
                      />
                    }
                  >
                    <Text as="span" display="flex" alignItems="center">
                      <ListIcon fontSize="18px" marginRight={2} />
                      <FormattedMessage
                        id="petition.contents"
                        defaultMessage="Contents"
                      />
                    </Text>
                  </GenericCardHeader>
                  <Box overflow="auto">
                    <PetitionContents
                      fields={petition.fields}
                      filter={filter}
                      fieldIndices={indices}
                      fieldVisibility={fieldVisibility}
                      onFieldClick={handleIndexFieldClick}
                      fieldIndicators={PetitionContentsIndicators}
                    />
                  </Box>
                </Card>
              )}
            </Box>
          }
        >
          <Box padding={4}>
            <Stack flex="2" spacing={4} id="petition-replies">
              {filterPetitionFields(
                petition.fields,
                indices,
                fieldVisibility ?? [],
                filter
              ).map((x, index) =>
                x.type === "FIELD" ? (
                  <PetitionRepliesField
                    id={`field-${x.field.id}`}
                    key={x.field.id}
                    field={x.field}
                    isVisible={true}
                    fieldIndex={x.fieldIndex}
                    onValidateToggle={() =>
                      handleValidateToggle([x.field.id], !x.field.validated)
                    }
                    onAction={handleAction}
                    isActive={activeFieldId === x.field.id}
                    onToggleComments={() =>
                      setActiveFieldId(
                        activeFieldId === x.field.id ? null : x.field.id
                      )
                    }
                    onUpdateReplyStatus={(replyId, status) =>
                      handleUpdateRepliesStatus(x.field.id, [replyId], status)
                    }
                  />
                ) : (
                  <PetitionRepliesFilteredFields key={index} count={x.count} />
                )
              )}
            </Stack>
            {me.hasPetitionSignature ? (
              <PetitionSignaturesCard
                petition={petition}
                user={me}
                marginTop={8}
                onRefetchPetition={refetch}
              />
            ) : null}
          </Box>
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
        hasCommentsEnabled
        ...PetitionLayout_PetitionBase
        fields {
          ...PetitionReplies_PetitionField
        }
        ...ShareButton_PetitionBase
        currentSignatureRequest @include(if: $hasPetitionSignature) {
          id
          status
        }
        ...PetitionSignaturesCard_Petition @include(if: $hasPetitionSignature)
      }
      ${PetitionLayout.fragments.PetitionBase}
      ${this.PetitionField}
      ${ShareButton.fragments.PetitionBase}
      ${PetitionSignaturesCard.fragments.Petition}
    `;
  },
  get PetitionField() {
    return gql`
      fragment PetitionReplies_PetitionField on PetitionField {
        isReadOnly
        ...PetitionRepliesField_PetitionField
        ...PetitionContents_PetitionField
        ...PetitionRepliesFieldComments_PetitionField
        ...ExportRepliesDialog_PetitionField
        ...useFieldVisibility_PetitionField
      }
      ${PetitionRepliesField.fragments.PetitionField}
      ${PetitionRepliesFieldComments.fragments.PetitionField}
      ${ExportRepliesDialog.fragments.PetitionField}
      ${PetitionContents.fragments.PetitionField}
      ${useFieldVisibility.fragments.PetitionField}
    `;
  },
  get User() {
    return gql`
      fragment PetitionReplies_User on User {
        hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
        hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
        ...PetitionLayout_User
        ...PetitionRepliesFieldComments_User
        ...ExportRepliesDialog_User
        ...PetitionSignaturesCard_User
      }
      ${PetitionLayout.fragments.User}
      ${PetitionRepliesFieldComments.fragments.User}
      ${ExportRepliesDialog.fragments.User}
      ${PetitionSignaturesCard.fragments.User}
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
        ...PetitionLayout_PetitionBase
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
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
      $isInternal: Boolean
      $hasInternalComments: Boolean!
    ) {
      createPetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldReplyId: $petitionFieldReplyId
        content: $content
        isInternal: $isInternal
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
      $hasInternalComments: Boolean!
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
      $attachPdfExport: Boolean!
      $pdfExportTitle: String
      $force: Boolean
    ) {
      sendPetitionClosedNotification(
        petitionId: $petitionId
        emailBody: $emailBody
        attachPdfExport: $attachPdfExport
        pdfExportTitle: $pdfExportTitle
        force: $force
      ) {
        id
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
            variables: pick(variables, ["hasInternalComments"]),
          };
          const field = client.readFragment<PetitionReplies_createPetitionFieldComment_PetitionFieldFragment>(
            options
          );
          client.writeFragment<PetitionReplies_createPetitionFieldComment_PetitionFieldFragment>(
            {
              ...options,
              data: {
                ...field,
                comments: [
                  ...field!.comments,
                  data!.createPetitionFieldComment,
                ],
              },
            }
          );
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
          const comment = apollo.readFragment<PetitionRepliesFieldComments_PetitionFieldCommentFragment>(
            {
              fragment:
                PetitionRepliesFieldComments.fragments.PetitionFieldComment,
              id: variables.petitionFieldCommentId,
              fragmentName: "PetitionRepliesFieldComments_PetitionFieldComment",
              variables: pick(variables, ["hasInternalComments"]),
            }
          );
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
          const field = client.readFragment<PetitionReplies_deletePetitionFieldComment_PetitionFieldFragment>(
            options
          );
          client.writeFragment<PetitionReplies_deletePetitionFieldComment_PetitionFieldFragment>(
            {
              ...options,
              data: {
                ...field,
                comments: field!.comments.filter(
                  (c) => c.id !== variables.petitionFieldCommentId
                ),
              },
            }
          );
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
            replies: unMaybeArray(petitionFieldReplyIds).map((id) => ({
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

function ConfirmCancelOngoingSignature(props: DialogProps<{}, void>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-disable-ongoing-signature.header"
          defaultMessage="Ongoing eSignature"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-disable-ongoing-signature-petition-close.body"
          defaultMessage="There is an ongoing eSignature process. If you close this petition now, the process will be cancelled."
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-disable-ongoing-signature-petition-close.confirm"
            defaultMessage="Cancel eSignature and continue"
          />
        </Button>
      }
      {...props}
    />
  );
}

function PetitionContentsIndicators({
  field,
  isVisible,
}: {
  field: PetitionReplies_PetitionFieldFragment;
  isVisible: boolean;
}) {
  const intl = useIntl();
  return (
    <>
      {field.comments.length ? (
        <Stack
          as="span"
          direction="row-reverse"
          display="inline-flex"
          alignItems="center"
        >
          <Stack
            as="span"
            direction="row-reverse"
            spacing={1}
            display="inline-flex"
            alignItems="flex-end"
            color="gray.600"
          >
            <CommentIcon fontSize="sm" opacity="0.8" />
            <Text
              as="span"
              fontSize="xs"
              role="img"
              aria-label={intl.formatMessage(
                {
                  id: "generic.comments-button-label",
                  defaultMessage:
                    "{commentCount, plural, =0 {No comments} =1 {# comment} other {# comments}}",
                },
                { commentCount: field.comments.length }
              )}
            >
              {intl.formatNumber(field.comments.length)}
            </Text>
          </Stack>
          <RecipientViewCommentsBadge
            hasUnreadComments={field.comments.some((c) => c.isUnread)}
            hasUnpublishedComments={field.comments.some((c) => !c.publishedAt)}
          />
        </Stack>
      ) : null}
      {field.visibility ? (
        <ConditionIcon color={isVisible ? "purple.500" : "gray.500"} />
      ) : null}
    </>
  );
}
PetitionReplies.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const {
    data: { me },
  } = await fetchQuery<PetitionRepliesUserQuery>(
    gql`
      query PetitionRepliesUser {
        me {
          ...PetitionReplies_User
        }
      }
      ${PetitionReplies.fragments.User}
    `
  );
  await fetchQuery<PetitionRepliesQuery, PetitionRepliesQueryVariables>(
    gql`
      query PetitionReplies(
        $id: GID!
        $hasPetitionSignature: Boolean!
        $hasInternalComments: Boolean!
      ) {
        petition(id: $id) {
          ...PetitionReplies_Petition
        }
      }
      ${PetitionReplies.fragments.Petition}
    `,
    {
      variables: {
        id: query.petitionId as string,
        hasPetitionSignature: me.hasPetitionSignature,
        hasInternalComments: me.hasInternalComments,
      },
    }
  );
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
            id="tour.petition-replies.page-title"
            defaultMessage="Here you have your information on the requests"
          />
        ),
        content: (
          <FormattedMessage
            id="tour.petition-replies.page-content"
            defaultMessage="On this page, you can see all the items that you requested to the recipients."
          />
        ),
        placement: "center",
        target: "#__next",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-replies.review-items-title"
            defaultMessage="Replies"
          />
        ),
        content: (
          <Stack>
            <Text>
              <FormattedMessage
                id="tour.petition-replies.review-items-content-1"
                defaultMessage="Here you can control and verify the information that your recipients have submitted."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="tour.petition-replies.review-items-content-2"
                defaultMessage="Keep track of the documents and replies you review by using the <b>approve and reject</b> buttons."
                values={{
                  b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                }}
              />
            </Text>
            <Text>
              <FormattedMessage
                id="tour.petition-replies.review-items-content-3"
                defaultMessage="If the information is correct and you need them, you can <b>download</b> the files, or <b>copy the text</b> responses."
                values={{
                  b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                }}
              />
            </Text>
          </Stack>
        ),
        placement: "right-start",
        target: "#petition-replies",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-replies.conversations-title"
            defaultMessage="Conversations"
          />
        ),
        content: (
          <Stack>
            <Text>
              <FormattedMessage
                id="tour.petition-replies.conversations-content-1"
                defaultMessage="Is there anything not clear? Is the submitted document incorrect?"
              />
            </Text>
            <Text>
              <FormattedMessage
                id="tour.petition-replies.conversations-content-2"
                defaultMessage="Avoid back and forth emails, and keep track of the conversations around documents or information here."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="tour.petition-replies.conversations-content-3"
                defaultMessage="Take your time to include your comments and send them when they are ready."
              />
            </Text>
          </Stack>
        ),
        placement: "right-start",
        target: "#comment-0",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-replies.download-title"
            defaultMessage="Organize your downloads"
          />
        ),
        content: (
          <Stack>
            <Text>
              <FormattedMessage
                id="tour.petition-replies.download-content-1"
                defaultMessage="Save time downloading and renaming all the files from here."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="tour.petition-replies.download-content-2"
                defaultMessage="Try using <b>variables</b> to set how you want your filenames to appear."
                values={{
                  b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                }}
              />
            </Text>
          </Stack>
        ),
        placement: "bottom-end",
        target: "#download-all",
      },
    ],
  }),
  withDialogs,
  withApolloData
)(PetitionReplies);
