import { gql } from "@apollo/client";
import { Box, Button, Stack, Text, useToast } from "@chakra-ui/react";
import {
  CheckIcon,
  CommentIcon,
  DownloadIcon,
  ListIcon,
  RepeatIcon,
  ThumbUpIcon,
} from "@parallel/chakra/icons";
import { Card, GenericCardHeader } from "@parallel/components/common/Card";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  isDialogError,
  useDialog,
  withDialogs,
} from "@parallel/components/common/DialogProvider";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ShareButton } from "@parallel/components/common/ShareButton";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
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
  PetitionRepliesQuery,
  PetitionRepliesQueryVariables,
  PetitionRepliesUserQuery,
  PetitionReplies_PetitionFieldFragment,
  PetitionReplies_PetitionFragment,
  PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables,
  PetitionStatus,
  UpdatePetitionInput,
  usePetitionRepliesQuery,
  usePetitionRepliesUserQuery,
  usePetitionReplies_createPetitionFieldCommentMutation,
  usePetitionReplies_deletePetitionFieldCommentMutation,
  usePetitionReplies_fileUploadReplyDownloadLinkMutation,
  usePetitionReplies_sendPetitionClosedNotificationMutation,
  usePetitionReplies_updatePetitionFieldCommentMutation,
  usePetitionReplies_updatePetitionFieldRepliesStatusMutation,
  usePetitionReplies_updatePetitionMutation,
  usePetitionReplies_validatePetitionFieldsMutation,
  usePetitionSettings_cancelPetitionSignatureRequestMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { compose } from "@parallel/utils/compose";
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import {
  defaultFieldsFilter,
  filterPetitionFields,
  PetitionFieldFilter,
} from "@parallel/utils/filterPetitionFields";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { string, useQueryState, useQueryStateSlice } from "@parallel/utils/queryState";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { Maybe, unMaybeArray, UnwrapPromise } from "@parallel/utils/types";
import { useHighlightElement } from "@parallel/utils/useHighlightElement";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { usePetitionCurrentSignatureStatus } from "@parallel/utils/usePetitionCurrentSignatureStatus";
import { usePetitionStateWrapper, withPetitionState } from "@parallel/utils/usePetitionState";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

type PetitionRepliesProps = UnwrapPromise<ReturnType<typeof PetitionReplies.getInitialProps>>;

const QUERY_STATE = {
  comments: string(),
};

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

  const updateIsReadNotification = useUpdateIsReadNotification();
  useEffect(() => {
    updateIsReadNotification({ isRead: true, petitionIds: [petitionId] });
  }, []);

  const petition = data!.petition as PetitionReplies_PetitionFragment;

  const fieldVisibility = useFieldVisibility(petition.fields);
  const toast = useToast();

  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const [activeFieldId, setActiveFieldId] = useQueryStateSlice(
    queryState,
    setQueryState,
    "comments"
  );
  const activeField = activeFieldId ? petition.fields.find((f) => f.id === activeFieldId) : null;
  const fieldRefs = useMultipleRefs<HTMLElement>();
  const signaturesRef = useRef<HTMLElement>(null);
  useEffect(() => {
    // force a rerender when active field is coming from url so the flyout repositions
    if (activeFieldId) {
      setActiveFieldId(activeFieldId);
    }
  }, []);

  useEffect(() => {
    if (activeFieldId) {
      document.body.classList.add("hide-hubspot");
    } else {
      document.body.classList.remove("hide-hubspot");
    }
    return () => document.body.classList.remove("hide-hubspot");
  }, [Boolean(activeFieldId)]);

  useEffect(() => {
    if (activeFieldId) {
      const timeout = setTimeout(async () => {
        const petitionFieldCommentIds = activeField!.comments
          .filter((c) => c.isUnread)
          .map((c) => c.id);
        if (petitionFieldCommentIds.length > 0) {
          await updateIsReadNotification({
            petitionFieldCommentIds,
            isRead: true,
          });
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [activeFieldId]);

  const wrapper = usePetitionStateWrapper();
  const [updatePetition] = usePetitionReplies_updatePetitionMutation();
  const [validatePetitionFields] = usePetitionReplies_validatePetitionFieldsMutation();
  const downloadReplyFile = useDownloadReplyFile();

  const handleValidateToggle = useCallback(
    async (fieldIds: string[], value: boolean, validateRepliesWith?: PetitionFieldReplyStatus) => {
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
                    reply.status === "PENDING" ? validateRepliesWith ?? reply.status : reply.status,
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
              (r) => petitionFieldReplyIds.includes(r.id) || r.status !== "PENDING"
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

  const handleAction: PetitionRepliesFieldProps["onAction"] = async function (action, reply) {
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
      petition.fields.some((field) => field.type === "FILE_UPLOAD" && field.replies.length > 0) ||
      petition.currentSignatureRequest?.status === "COMPLETED";
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
    (f) => (!f.isReadOnly && f.replies.length > 0) || f.comments.length > 0
  );

  const [createPetitionFieldComment] = usePetitionReplies_createPetitionFieldCommentMutation();
  async function handleAddComment(content: string, isInternal?: boolean) {
    await createPetitionFieldComment({
      variables: {
        petitionId,
        petitionFieldId: activeFieldId!,
        content,
        isInternal,
        hasInternalComments: me.hasInternalComments,
      },
    });
  }

  const [updatePetitionFieldComment] = usePetitionReplies_updatePetitionFieldCommentMutation();
  async function handleUpdateComment(petitionFieldCommentId: string, content: string) {
    await updatePetitionFieldComment({
      variables: {
        petitionId,
        petitionFieldId: activeFieldId!,
        petitionFieldCommentId,
        content,
        hasInternalComments: me.hasInternalComments,
      },
    });
  }

  const [deletePetitionFieldComment] = usePetitionReplies_deletePetitionFieldCommentMutation();
  async function handleDeleteComment(petitionFieldCommentId: string) {
    await deletePetitionFieldComment({
      variables: {
        petitionId,
        petitionFieldId: activeFieldId!,
        petitionFieldCommentId,
        hasInternalComments: me.hasInternalComments,
      },
    });
  }

  async function handleMarkAsUnread(petitionFieldCommentId: string) {
    await updateIsReadNotification({
      petitionFieldCommentIds: [petitionFieldCommentId],
      isRead: false,
    });
  }

  const highlight = useHighlightElement();
  const handlePetitionContentsFieldClick = useCallback((fieldId: string) => {
    highlight(fieldRefs[fieldId].current);
  }, []);
  const handlePetitionContentsSignatureClick = useCallback(() => {
    highlight(signaturesRef.current);
  }, []);

  const indices = useFieldIndices(petition.fields);

  const showClosePetitionDialog = useClosePetitionDialog();
  const [sendPetitionClosedNotification] =
    usePetitionReplies_sendPetitionClosedNotificationMutation();
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
        if (isDialogError(error)) {
          throw error;
        }
        if (
          isApolloError(error) &&
          error.graphQLErrors[0]?.extensions?.code === "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR"
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

  const showConfirmCancelOngoingSignature = useDialog(ConfirmCancelOngoingSignature);

  const [cancelSignatureRequest] = usePetitionSettings_cancelPetitionSignatureRequestMutation();

  const handleClosePetition = useCallback(async () => {
    try {
      const hasPendingSignature =
        (petition.currentSignatureRequest &&
          ["ENQUEUED", "PROCESSING"].includes(petition.currentSignatureRequest.status)) ??
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
      const option = hasUnreviewedReplies ? await showSolveUnreviewedRepliesDialog({}) : "APPROVE";

      await handleFinishPetition({ requiredMessage: false });

      await handleValidateToggle(
        petition.fields.map((f) => f.id),
        true,
        option === "APPROVE" ? "APPROVED" : "REJECTED"
      );
    } catch {}
  }, [petition, handleValidateToggle, handleFinishPetition, cancelSignatureRequest]);

  const showPetitionSharingDialog = usePetitionSharingDialog();
  const handlePetitionSharingClick = async function () {
    try {
      await showPetitionSharingDialog({
        userId: me.id,
        petitionIds: [petition.id],
      });
    } catch {}
  };

  const [filter, setFilter] = useState<PetitionFieldFilter>(defaultFieldsFilter);

  const petitionSignatureStatus = usePetitionCurrentSignatureStatus(petition);

  return (
    <PetitionLayout
      key={petition.id}
      user={me}
      petition={petition}
      onUpdatePetition={handleOnUpdatePetition}
      section="replies"
      scrollBody={false}
      display="flex"
      flexDirection="column"
      minHeight={0}
      overflow="visible"
      headerActions={
        <Box display={{ base: "none", lg: "block" }}>
          <ShareButton petition={petition} userId={me.id} onClick={handlePetitionSharingClick} />
        </Box>
      }
    >
      <Stack direction="row" paddingX={4} paddingY={2}>
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
          data-action="close-petition"
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
      </Stack>
      <Divider />
      <Box flex="1" overflow="auto">
        <PaneWithFlyout
          isFlyoutActive={Boolean(activeFieldId)}
          alignWith={activeFieldId ? fieldRefs[activeFieldId].current : null}
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
                  onMarkAsUnread={handleMarkAsUnread}
                />
              ) : (
                <Card display="flex" flexDirection="column" maxHeight={`calc(100vh - 153px)`}>
                  <GenericCardHeader
                    rightAction={
                      <PetitionRepliesFilterButton value={filter} onChange={setFilter} />
                    }
                  >
                    <Text as="span" display="flex" alignItems="center">
                      <ListIcon fontSize="18px" marginRight={2} />
                      <FormattedMessage id="petition.contents" defaultMessage="Contents" />
                    </Text>
                  </GenericCardHeader>
                  <Box overflow="auto">
                    <PetitionContents
                      fields={petition.fields}
                      filter={filter}
                      fieldIndices={indices}
                      fieldVisibility={fieldVisibility}
                      onFieldClick={handlePetitionContentsFieldClick}
                      fieldIndicators={PetitionContentsIndicators}
                      signatureStatus={petitionSignatureStatus}
                      onSignatureStatusClick={handlePetitionContentsSignatureClick}
                    />
                  </Box>
                </Card>
              )}
            </Box>
          }
        >
          <Box padding={4}>
            <Stack flex="2" spacing={4} id="petition-replies">
              {filterPetitionFields(petition.fields, indices, fieldVisibility ?? [], filter).map(
                (x, index) =>
                  x.type === "FIELD" ? (
                    <PetitionRepliesField
                      ref={fieldRefs[x.field.id]}
                      id={`field-${x.field.id}`}
                      key={x.field.id}
                      petitionId={petition.id}
                      field={x.field}
                      isVisible={true}
                      fieldIndex={x.fieldIndex}
                      onValidateToggle={() =>
                        handleValidateToggle([x.field.id], !x.field.validated)
                      }
                      onAction={handleAction}
                      isActive={activeFieldId === x.field.id}
                      onToggleComments={() =>
                        setActiveFieldId(activeFieldId === x.field.id ? null : x.field.id)
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
                ref={signaturesRef as any}
                id="signatures"
                petition={petition}
                user={me}
                layerStyle="highlightable"
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
        ...usePetitionCurrentSignatureStatus_Petition @include(if: $hasPetitionSignature)
      }
      ${PetitionLayout.fragments.PetitionBase}
      ${this.PetitionField}
      ${ShareButton.fragments.PetitionBase}
      ${PetitionSignaturesCard.fragments.Petition}
      ${usePetitionCurrentSignatureStatus.fragments.Petition}
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
        ...useUpdateIsReadNotification_User
      }
      ${PetitionLayout.fragments.User}
      ${PetitionRepliesFieldComments.fragments.User}
      ${ExportRepliesDialog.fragments.User}
      ${PetitionSignaturesCard.fragments.User}
      ${useUpdateIsReadNotification.fragments.User}
    `;
  },
};

PetitionReplies.mutations = [
  gql`
    mutation PetitionReplies_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
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
      fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId, preview: $preview) {
        result
        url
      }
    }
  `,
  gql`
    mutation PetitionReplies_createPetitionFieldComment(
      $petitionId: GID!
      $petitionFieldId: GID!
      $content: String!
      $isInternal: Boolean
      $hasInternalComments: Boolean!
    ) {
      createPetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        content: $content
        isInternal: $isInternal
      ) {
        ...PetitionRepliesFieldComments_PetitionField
      }
    }
    ${PetitionRepliesFieldComments.fragments.PetitionField}
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
        ...PetitionRepliesFieldComments_PetitionField
      }
    }
    ${PetitionRepliesFieldComments.fragments.PetitionField}
  `,
  gql`
    mutation PetitionReplies_deletePetitionFieldComment(
      $petitionId: GID!
      $petitionFieldId: GID!
      $petitionFieldCommentId: GID!
      $hasInternalComments: Boolean!
    ) {
      deletePetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
      ) {
        ...PetitionRepliesFieldComments_PetitionField
      }
    }
    ${PetitionRepliesFieldComments.fragments.PetitionField}
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
    function downloadReplyFile(
      petitionId: string,
      reply: Pick<PetitionFieldReply, "id" | "content">,
      preview: boolean
    ) {
      openNewWindow(async () => {
        const { data } = await mutate({
          variables: { petitionId, replyId: reply.id, preview },
        });
        const { url, result } = data!.fileUploadReplyDownloadLink;
        if (result !== "SUCCESS") {
          await withError(showFailure({ filename: reply.content.filename }));
          throw new Error();
        }
        return url!;
      });
    },
    [mutate]
  );
}

function useUpdatePetitionFieldRepliesStatus() {
  const [updatePetitionFieldRepliesStatus] =
    usePetitionReplies_updatePetitionFieldRepliesStatusMutation();
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

function PetitionContentsIndicators({ field }: { field: PetitionReplies_PetitionFieldFragment }) {
  const intl = useIntl();
  return (
    <>
      {field.comments.length ? (
        <Stack as="span" direction="row-reverse" display="inline-flex" alignItems="center">
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
          <RecipientViewCommentsBadge hasUnreadComments={field.comments.some((c) => c.isUnread)} />
        </Stack>
      ) : null}
    </>
  );
}
PetitionReplies.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
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

export default compose(withPetitionState, withDialogs, withApolloData)(PetitionReplies);
