import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { VariablesOf } from "@graphql-typed-document-node/core";
import {
  CheckIcon,
  ChevronDownIcon,
  CommentIcon,
  DownloadIcon,
  FilePdfIcon,
  ListIcon,
  RepeatIcon,
  ThumbUpIcon,
} from "@parallel/chakra/icons";
import { Card, GenericCardHeader } from "@parallel/components/common/Card";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  DialogProps,
  isDialogError,
  useDialog,
  withDialogs,
} from "@parallel/components/common/dialogs/DialogProvider";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ShareButton } from "@parallel/components/common/ShareButton";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { PaneWithFlyout } from "@parallel/components/layout/PaneWithFlyout";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/dialogs/PetitionSharingDialog";
import { PetitionContents } from "@parallel/components/petition-common/PetitionContents";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import {
  useCreatePetitionFieldComment,
  useDeletePetitionFieldComment,
  useUpdatePetitionFieldComment,
} from "@parallel/components/petition-preview/dialogs/PreviewPetitionFieldCommentsDialog";
import { useClosePetitionDialog } from "@parallel/components/petition-replies/dialogs/ClosePetitionDialog";
import { useConfirmResendCompletedNotificationDialog } from "@parallel/components/petition-replies/dialogs/ConfirmResendCompletedNotificationDialog";
import {
  ExportRepliesDialog,
  useExportRepliesDialog,
} from "@parallel/components/petition-replies/dialogs/ExportRepliesDialog";
import { useExportRepliesProgressDialog } from "@parallel/components/petition-replies/dialogs/ExportRepliesProgressDialog";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition-replies/dialogs/FailureGeneratingLinkDialog";
import { useSolveUnreviewedRepliesDialog } from "@parallel/components/petition-replies/dialogs/SolveUnreviewedRepliesDialog";
import { PetitionAttachmentsCard } from "@parallel/components/petition-replies/PetitionAttachmentsCard";
import {
  PetitionRepliesField,
  PetitionRepliesFieldProps,
} from "@parallel/components/petition-replies/PetitionRepliesField";
import { PetitionRepliesFieldComments } from "@parallel/components/petition-replies/PetitionRepliesFieldComments";
import { PetitionRepliesFilterButton } from "@parallel/components/petition-replies/PetitionRepliesFilterButton";
import { PetitionRepliesFilteredFields } from "@parallel/components/petition-replies/PetitionRepliesFilteredFields";
import { PetitionSignaturesCard } from "@parallel/components/petition-replies/PetitionSignaturesCard";
import { RecipientViewCommentsBadge } from "@parallel/components/recipient-view/RecipientViewCommentsBadge";
import {
  PetitionFieldReply,
  PetitionFieldReplyStatus,
  PetitionReplies_approveOrRejectPetitionFieldRepliesDocument,
  PetitionReplies_closePetitionDocument,
  PetitionReplies_fileUploadReplyDownloadLinkDocument,
  PetitionReplies_petitionDocument,
  PetitionReplies_PetitionFieldFragment,
  PetitionReplies_PetitionFragment,
  PetitionReplies_sendPetitionClosedNotificationDocument,
  PetitionReplies_updatePetitionDocument,
  PetitionReplies_updatePetitionFieldRepliesStatusDocument,
  PetitionReplies_userDocument,
  PetitionSettings_cancelPetitionSignatureRequestDocument,
  PetitionStatus,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import {
  defaultFieldsFilter,
  filterPetitionFields,
  PetitionFieldFilter,
} from "@parallel/utils/filterPetitionFields";
import { getPetitionSignatureEnvironment } from "@parallel/utils/getPetitionSignatureEnvironment";
import { getPetitionSignatureStatus } from "@parallel/utils/getPetitionSignatureStatus";
import { isUsageLimitsReached } from "@parallel/utils/isUsageLimitsReached";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { string, useQueryState, useQueryStateSlice } from "@parallel/utils/queryState";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { Maybe, UnwrapPromise } from "@parallel/utils/types";
import { useExportRepliesTask } from "@parallel/utils/useExportRepliesTask";
import { useHighlightElement } from "@parallel/utils/useHighlightElement";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { usePetitionStateWrapper, withPetitionState } from "@parallel/utils/usePetitionState";
import { usePrintPdfTask } from "@parallel/utils/usePrintPdfTask";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

type PetitionRepliesProps = UnwrapPromise<ReturnType<typeof PetitionReplies.getInitialProps>>;

const QUERY_STATE = {
  comments: string(),
};

function PetitionReplies({ petitionId }: PetitionRepliesProps) {
  const intl = useIntl();

  const {
    data: { me },
  } = useAssertQuery(PetitionReplies_userDocument);
  const { data, refetch } = useAssertQuery(PetitionReplies_petitionDocument, {
    variables: {
      id: petitionId,
    },
  });

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
  const [updatePetition] = useMutation(PetitionReplies_updatePetitionDocument);
  const downloadReplyFile = useDownloadReplyFile();

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
    await updatePetitionFieldRepliesStatus(
      {
        petitionId,
        petitionFieldId,
        petitionFieldReplyIds,
        status,
      },
      petition.status
    );
  }

  const handleUpdatePetition = useCallback(
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
  const handleExportRepliesTask = useExportRepliesTask();
  const handleDownloadAllClick = useCallback(async () => {
    const hasFiles = petition.fields.some(
      (field) => field.type === "FILE_UPLOAD" && field.replies.length > 0
    );
    const hasSignature = petition.currentSignatureRequest?.status === "COMPLETED";

    try {
      if (hasFiles || hasSignature) {
        const res = await showExportRepliesDialog({
          user: me,
          fields: petition.fields,
        });

        if (res.type === "DOWNLOAD_ZIP") {
          handleExportRepliesTask(petition.id, res.pattern);
        } else {
          const { pattern, externalClientId } = res;
          await showExportRepliesProgressDialog({
            petitionId: petition.id,
            pattern,
            externalClientId,
          });
        }
      } else {
        handleExportRepliesTask(petition.id);
      }
    } catch {}
  }, [petitionId, petition.fields]);

  const showDownloadAll = petition.fields.some(
    (f) => (!f.isReadOnly && f.replies.length > 0) || f.comments.length > 0
  );

  const handlePrintPdfTask = usePrintPdfTask();

  const createPetitionFieldComment = useCreatePetitionFieldComment();
  async function handleAddComment(content: string, isInternal?: boolean) {
    await createPetitionFieldComment({
      petitionId,
      petitionFieldId: activeFieldId!,
      content,
      isInternal,
    });
  }

  const updatePetitionFieldComment = useUpdatePetitionFieldComment();
  async function handleUpdateComment(petitionFieldCommentId: string, content: string) {
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
  const [sendPetitionClosedNotification] = useMutation(
    PetitionReplies_sendPetitionClosedNotificationDocument
  );
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
          showNotify: petition.accesses.length > 0,
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
        if (isApolloError(error, "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR")) {
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
  const [approveOrRejectReplies] = useMutation(
    PetitionReplies_approveOrRejectPetitionFieldRepliesDocument
  );
  const [closePetition] = useMutation(PetitionReplies_closePetitionDocument);

  const showConfirmCancelOngoingSignature = useDialog(ConfirmCancelOngoingSignature);

  const [cancelSignatureRequest] = useMutation(
    PetitionSettings_cancelPetitionSignatureRequestDocument
  );

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

      if (hasUnreviewedReplies)
        await approveOrRejectReplies({
          variables: {
            petitionId,
            status: option === "APPROVE" ? "APPROVED" : "REJECTED",
          },
        });

      await closePetition({
        variables: {
          petitionId,
        },
      });
    } catch {}
  }, [
    petition,
    approveOrRejectReplies,
    closePetition,
    handleFinishPetition,
    cancelSignatureRequest,
  ]);

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

  const petitionSignatureStatus = getPetitionSignatureStatus(petition);
  const petitionSignatureEnvironment = getPetitionSignatureEnvironment(petition);

  const displayPetitionLimitReachedAlert =
    isUsageLimitsReached(me.organization) &&
    petition.__typename === "Petition" &&
    petition.status === "DRAFT";

  return (
    <PetitionLayout
      key={petition.id}
      user={me}
      petition={petition}
      onUpdatePetition={handleUpdatePetition}
      section="replies"
      scrollBody
      headerActions={
        <Box display={{ base: "none", lg: "block" }}>
          <ShareButton petition={petition} userId={me.id} onClick={handlePetitionSharingClick} />
        </Box>
      }
      subHeader={
        <>
          {displayPetitionLimitReachedAlert ? (
            <PetitionLimitReachedAlert limit={me.organization.usageLimits.petitions.limit} />
          ) : null}
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
              hidden={petition.status !== "CLOSED" || petition.accesses.length === 0}
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
              <ButtonGroup isAttached colorScheme="purple">
                <Button
                  leftIcon={<DownloadIcon fontSize="lg" display="block" />}
                  onClick={handleDownloadAllClick}
                >
                  <FormattedMessage
                    id="petition-replies.export-replies"
                    defaultMessage="Export replies"
                  />
                </Button>
                <Divider isVertical color="purple.600" />
                <Menu placement="bottom-end">
                  <Tooltip
                    label={intl.formatMessage({
                      id: "generic.more-options",
                      defaultMessage: "More options...",
                    })}
                  >
                    <MenuButton
                      as={IconButton}
                      icon={<ChevronDownIcon fontSize="lg" />}
                      aria-label={intl.formatMessage({
                        id: "generic.more-options",
                        defaultMessage: "More options...",
                      })}
                      minWidth={8}
                    />
                  </Tooltip>
                  <MenuList>
                    <MenuItem
                      icon={<FilePdfIcon boxSize={5} />}
                      isDisabled={!me.hasPetitionPdfExport}
                      onClick={() => handlePrintPdfTask(petition.id)}
                      maxWidth={"260px"}
                    >
                      <Text>
                        <FormattedMessage
                          id="page.petition-replies.export-pdf"
                          defaultMessage="Export to PDF"
                        />
                      </Text>
                      {me.hasPetitionPdfExport ? null : (
                        <Text fontSize="sm">
                          <FormattedMessage
                            id="generic.upgrade-to-enable"
                            defaultMessage="Upgrade to enable this feature."
                          />
                        </Text>
                      )}
                    </MenuItem>
                  </MenuList>
                </Menu>
              </ButtonGroup>
            ) : null}
          </Stack>
          <Divider />
        </>
      }
    >
      <PaneWithFlyout
        isFlyoutActive={Boolean(activeFieldId)}
        alignWith={activeFieldId ? fieldRefs[activeFieldId].current : null}
        flyout={
          <Box padding={4} paddingLeft={{ md: 0 }}>
            {activeFieldId ? (
              <PetitionRepliesFieldComments
                key={activeFieldId!}
                petitionId={petition.id}
                hasCommentsEnabled={activeField?.options.hasCommentsEnabled}
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
                  rightAction={<PetitionRepliesFilterButton value={filter} onChange={setFilter} />}
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
                    signatureEnvironment={petitionSignatureEnvironment}
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

          {petition.attachments.length > 0 && (
            <PetitionAttachmentsCard
              id="attachments"
              petition={petition}
              layerStyle="highlightable"
              marginTop={8}
            />
          )}

          <PetitionSignaturesCard
            ref={signaturesRef as any}
            id="signatures"
            petition={petition}
            user={me}
            layerStyle="highlightable"
            marginTop={8}
            onRefetchPetition={refetch}
          />
        </Box>
      </PaneWithFlyout>
    </PetitionLayout>
  );
}

PetitionReplies.fragments = {
  get Petition() {
    return gql`
      fragment PetitionReplies_Petition on Petition {
        id
        accesses {
          id
          status
        }
        ...PetitionLayout_PetitionBase
        fields {
          ...PetitionReplies_PetitionField
        }
        ...ShareButton_PetitionBase
        currentSignatureRequest {
          id
          status
        }
        ...PetitionSignaturesCard_Petition
        ...getPetitionSignatureStatus_Petition
        ...getPetitionSignatureEnvironment_Petition
        ...PetitionAttachmentsCard_Petition
      }
      ${PetitionLayout.fragments.PetitionBase}
      ${this.PetitionField}
      ${ShareButton.fragments.PetitionBase}
      ${PetitionSignaturesCard.fragments.Petition}
      ${getPetitionSignatureStatus.fragments.Petition}
      ${getPetitionSignatureEnvironment.fragments.Petition}
      ${PetitionAttachmentsCard.fragments.Petition}
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
        organization {
          name
          ...isUsageLimitsReached_Organization
        }
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
      ${isUsageLimitsReached.fragments.Organization}
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
    mutation PetitionReplies_closePetition($petitionId: GID!) {
      closePetition(petitionId: $petitionId) {
        ...PetitionReplies_Petition
      }
    }
    ${PetitionReplies.fragments.Petition}
  `,
  gql`
    mutation PetitionReplies_approveOrRejectPetitionFieldReplies(
      $petitionId: GID!
      $status: PetitionFieldReplyStatus!
    ) {
      approveOrRejectPetitionFieldReplies(petitionId: $petitionId, status: $status) {
        ...PetitionReplies_Petition
      }
    }
    ${PetitionReplies.fragments.Petition}
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
        id
        petition {
          ... on Petition {
            id
            status
          }
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
  const [mutate] = useMutation(PetitionReplies_fileUploadReplyDownloadLinkDocument);
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
  const [updatePetitionFieldRepliesStatus] = useMutation(
    PetitionReplies_updatePetitionFieldRepliesStatusDocument
  );
  return useCallback(
    async (
      variables: VariablesOf<typeof PetitionReplies_updatePetitionFieldRepliesStatusDocument>,
      petitionStatus: PetitionStatus
    ) => await updatePetitionFieldRepliesStatus({ variables }),
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

PetitionReplies.queries = [
  gql`
    query PetitionReplies_user {
      me {
        ...PetitionReplies_User
      }
    }
    ${PetitionReplies.fragments.User}
  `,
  gql`
    query PetitionReplies_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionReplies_Petition
      }
    }
    ${PetitionReplies.fragments.Petition}
  `,
];

PetitionReplies.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  await fetchQuery(PetitionReplies_userDocument);
  await fetchQuery(PetitionReplies_petitionDocument, {
    variables: {
      id: petitionId,
    },
  });
  return { petitionId };
};

export default compose(withPetitionState, withDialogs, withApolloData)(PetitionReplies);
