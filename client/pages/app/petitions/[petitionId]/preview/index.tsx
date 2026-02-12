import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Center, useToast } from "@chakra-ui/react";
import { ChevronRightIcon, EditSimpleIcon, PaperPlaneIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import NextLink from "next/link";
import { OverrideWithOrganizationTheme } from "@parallel/components/common/OverrideWithOrganizationTheme";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { Spacer } from "@parallel/components/common/Spacer";
import { SupportButton } from "@parallel/components/common/SupportButton";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { isDialogError, withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { useFieldErrorDialog } from "@parallel/components/common/dialogs/FieldErrorDialog";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import {
  PetitionLayout,
  usePetitionStateWrapper,
  withPetitionLayoutContext,
} from "@parallel/components/layout/PetitionLayout";
import { PetitionComposeAndPreviewAlerts } from "@parallel/components/petition-common/alerts/PetitionComposeAndPreviewAlerts";
import { PetitionPreviewOnlyAlert } from "@parallel/components/petition-common/alerts/PetitionPreviewOnlyAlert";
import {
  ConfirmPetitionSignersDialogResult,
  useConfirmPetitionSignersDialog,
} from "@parallel/components/petition-common/dialogs/ConfirmPetitionSignersDialog";
import { useSendPetitionHandler } from "@parallel/components/petition-common/useSendPetitionHandler";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import { PetitionPermanentDeletionAlert } from "@parallel/components/petition-compose/PetitionPermanentDeletionAlert";
import { useHiddenFieldDialog } from "@parallel/components/petition-compose/dialogs/HiddenFieldDialog";
import { useHandledTestSignatureDialog } from "@parallel/components/petition-compose/dialogs/TestSignatureDialog";
import { PetitionPreviewRightPaneTabs } from "@parallel/components/petition-preview/PetitionPreviewRightPaneTabs";
import { PetitionPreviewStartSignatureButton } from "@parallel/components/petition-preview/PetitionPreviewStartSignatureButton";
import { PreviewPetitionField } from "@parallel/components/petition-preview/PreviewPetitionField";
import { PetitionRepliesFieldComments } from "@parallel/components/petition-replies/PetitionRepliesFieldComments";
import { RecipientViewPagination } from "@parallel/components/recipient-view/RecipientViewPagination";
import { RecipientViewProgressBar } from "@parallel/components/recipient-view/RecipientViewProgressBar";
import { RecipientViewSidebarContextProvider } from "@parallel/components/recipient-view/RecipientViewSidebarContextProvider";
import { RecipientViewRefreshRepliesAlert } from "@parallel/components/recipient-view/alerts/RecipientViewRefreshRepliesAlert";
import { Box, Button, Flex, Stack } from "@parallel/components/ui";
import {
  PetitionPreview_PetitionBaseFragment,
  PetitionPreview_cancelSignatureRequestDocument,
  PetitionPreview_completePetitionDocument,
  PetitionPreview_petitionDocument,
  PetitionPreview_updatePetitionDocument,
  PetitionPreview_userDocument,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useAllFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { focusPetitionField } from "@parallel/utils/focusPetitionField";
import { getPetitionSignatureStatus } from "@parallel/utils/getPetitionSignatureStatus";
import {
  useBuildUrlToPetitionSection,
  useGoToPetition,
  useGoToPetitionSection,
} from "@parallel/utils/goToPetition";
import { useCancelApprovalRequestFlow } from "@parallel/utils/hooks/useCancelApprovalRequestFlow";
import { useClosePetition } from "@parallel/utils/hooks/useClosePetition";
import { useStartApprovalRequestStep } from "@parallel/utils/hooks/useStartApprovalRequestStep";
import { LiquidPetitionScopeProvider } from "@parallel/utils/liquid/LiquidPetitionScopeProvider";
import { LiquidPetitionVariableProvider } from "@parallel/utils/liquid/LiquidPetitionVariableProvider";
import {
  useCreatePetitionComment,
  useDeletePetitionComment,
  useUpdatePetitionComment,
} from "@parallel/utils/mutations/comments";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { withError } from "@parallel/utils/promises/withError";
import { UnwrapPromise } from "@parallel/utils/types";
import { useFieldCommentsQueryState } from "@parallel/utils/useFieldCommentsQueryState";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useGetPetitionPages } from "@parallel/utils/useGetPetitionPages";
import { useHighlightElement } from "@parallel/utils/useHighlightElement";
import { usePetitionCanFinalize } from "@parallel/utils/usePetitionCanFinalize";
import { useStartSignatureRequest } from "@parallel/utils/useStartSignatureRequest";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { validatePetitionFields } from "@parallel/utils/validatePetitionFields";
import { waitForElement } from "@parallel/utils/waitForElement";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish, omit } from "remeda";

type PetitionPreviewProps = UnwrapPromise<ReturnType<typeof PetitionPreview.getInitialProps>>;

function PetitionPreview({ petitionId }: PetitionPreviewProps) {
  const intl = useIntl();
  const router = useRouter();
  const { query } = router;
  const toast = useToast();

  const { data: queryData } = useAssertQuery(PetitionPreview_userDocument);
  const { me } = queryData;
  const { data, refetch } = useAssertQuery(PetitionPreview_petitionDocument, {
    variables: { id: petitionId },
  });

  const [showErrors, setShowErrors] = useState(false);
  const [showRefreshRepliesAlert, setShowRefreshRepliesAlert] = useState(false);
  const wrapper = usePetitionStateWrapper();
  const [updatePetition] = useMutation(PetitionPreview_updatePetitionDocument);
  const handleUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId],
  );

  useEffect(() => {
    if (isNonNullish(query.fromTemplate)) {
      toast({
        id: "petition-created-toast",
        title: intl.formatMessage({
          id: "page.preview.petition-created-toast",
          defaultMessage: "Parallel created from a template.",
        }),
        status: "success",
        isClosable: true,
      });
    }
  }, []);

  const petition = data!.petition as PetitionPreview_PetitionBaseFragment;

  const [activeFieldId, setActiveFieldId] = useFieldCommentsQueryState();
  const activeField = activeFieldId ? petition.fields.find((f) => f.id === activeFieldId) : null;

  const allFields = useMemo(
    () => petition.fields.flatMap((f) => [f, ...(f.children ?? [])]),
    [petition.fields],
  );

  const isClosed =
    petition.__typename === "Petition" && ["COMPLETED", "CLOSED"].includes(petition.status);
  const isPetition = petition.__typename === "Petition";

  const myEffectivePermission = petition.myEffectivePermission!.permissionType;

  const pageCount =
    petition.fields.filter((f) => f.type === "HEADING" && f.options!.hasPageBreak).length + 1;

  const pages = useGetPetitionPages(petition, { usePreviewReplies: !isPetition });
  const currentPage = useMemo(() => {
    const { field: fieldId, reply: replyId } = query;
    let page = 0;
    if (query.page && !isNaN(Number(query.page))) {
      return Number(query.page);
    }
    if (fieldId) {
      page = pages.findIndex((fieldsWithLogic) =>
        fieldsWithLogic.some(
          ({ field: f }) => f.id === fieldId || f.children?.some((c) => c.id === fieldId),
        ),
      );
    }

    if (replyId && typeof replyId === "string") {
      const id = replyId.split("-")[0];
      page = pages.findIndex((fieldsWithLogic) =>
        fieldsWithLogic.some(({ field: f }) => f.id === id || f.children?.some((c) => c.id === id)),
      );
    }

    return Math.max(page + 1, 1);
  }, [query.page]);

  const fieldsWithLogic = pages[currentPage - 1];

  const highlight = useHighlightElement();
  useEffect(() => {
    if (isNonNullish(router.query.field)) {
      const { field: fieldId, parentReply: parentReplyId, sufix } = router.query;

      const field = allFields.find((f) => f.id === fieldId);
      if (field) {
        focusPetitionField({
          field,
          parentReplyId: parentReplyId as string | undefined,
          sufix: sufix as string | undefined,
        });
        const element = document.getElementById(`field-${field.id}`);
        highlight(element, true);
      }
    }

    if (isNonNullish(router.query.comments)) {
      // when navigating from comments email, it will always go to page 1 but field might be in another page
      const fieldId = router.query.comments as string;
      const page =
        pages.findIndex((p) =>
          p.some((f) => f.field.id === fieldId || f.field.children?.some((f) => f.id === fieldId)),
        ) + 1 || 1;
      if (currentPage !== page) {
        router.push(
          `/app/petitions/${petitionId}/preview?page=${page}&${new URLSearchParams(
            omit(router.query as Record<string, string>, ["petitionId", "page"]),
          )}`,
        );
      } else {
        waitForElement(`#field-${fieldId}`).then((element) => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    }
  }, [router.query]);

  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pageRef.current) {
      pageRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  const goToSection = useGoToPetitionSection();
  const buildUrlToSection = useBuildUrlToPetitionSection();

  const showHiddenFieldDialog = useHiddenFieldDialog();
  useTempQueryParam("field", async (fieldId) => {
    try {
      if (
        !fieldsWithLogic.some(
          ({ field: f }) => f.id === fieldId || f.children?.some((cf) => cf.id === fieldId),
        )
      ) {
        await showHiddenFieldDialog({
          field: petition.fields.find((f) => f.id === fieldId)!,
          petition,
        });
      }
    } catch (error) {
      if (isDialogError(error) && error.message === "CANCEL") {
        goToSection("compose", { query: { field: fieldId } });
      }
    }
  });

  const goToPetition = useGoToPetition();
  const showErrorDialog = useErrorDialog();
  const showFieldErrorDialog = useFieldErrorDialog();
  const allFieldsWithIndices = useAllFieldsWithIndices(petition);
  const _validatePetitionFields = async () => {
    const { error, message, footer, fieldsWithIndices } = validatePetitionFields(
      allFieldsWithIndices,
      petition,
    );
    if (error) {
      const petitionId = query.petitionId;
      if (fieldsWithIndices && fieldsWithIndices.length > 0) {
        if (error === "PAID_FIELDS_BLOCKED") {
          await withError(
            showFieldErrorDialog({
              header: (
                <FormattedMessage
                  id="generic.fields-not-available"
                  defaultMessage="Fields not available"
                />
              ),
              message,
              footer,
              fieldsWithIndices,
              cancel: (
                <SupportButton
                  variant="outline"
                  colorScheme="primary"
                  message={intl.formatMessage({
                    id: "generic.upgrade-plan-support-message",
                    defaultMessage:
                      "Hi, I would like to get more information about how to upgrade my plan.",
                  })}
                >
                  <FormattedMessage id="generic.contact" defaultMessage="Contact" />
                </SupportButton>
              ),
              confirmText: <FormattedMessage id="generic.continue" defaultMessage="Continue" />,
            }),
          );
          return true;
        } else {
          await withError(showFieldErrorDialog({ message, fieldsWithIndices }));
          const firstId = fieldsWithIndices[0][0].id;
          if (isNonNullish(petitionId) && typeof petitionId === "string") {
            goToPetition(petitionId, "compose", { query: { field: firstId } });
          }
        }
      } else {
        await withError(showErrorDialog({ message }));
        if (isNonNullish(petitionId) && typeof petitionId === "string") {
          goToPetition(petitionId, "compose");
        }
      }
      return false;
    }
    return true;
  };

  const handleNextClick = useSendPetitionHandler(
    me,
    isPetition ? petition : null,
    handleUpdatePetition,
    _validatePetitionFields,
  );

  const showConfirmPetitionSignersDialog = useConfirmPetitionSignersDialog();
  const [completePetition] = useMutation(PetitionPreview_completePetitionDocument);
  const showTestSignatureDialog = useHandledTestSignatureDialog();

  const { canFinalize, nextIncompleteField } = usePetitionCanFinalize(petition);
  const handleFinalize = useCallback(
    async function () {
      try {
        setShowErrors(true);
        if (canFinalize && isPetition) {
          let completeSignerInfoData: ConfirmPetitionSignersDialogResult | null = null;
          if (petition.signatureConfig?.isEnabled && petition.signatureConfig.review === false) {
            completeSignerInfoData = await showConfirmPetitionSignersDialog({
              signatureConfig: petition.signatureConfig,
              petitionId: petition.id,
              isInteractionWithRecipientsEnabled: petition.isInteractionWithRecipientsEnabled,
            });
          }

          if (petition.signatureConfig?.isEnabled) {
            await showTestSignatureDialog(
              petition.signatureConfig.integration?.environment,
              petition.signatureConfig.integration?.name,
            );
          }

          if (completeSignerInfoData !== null) {
            await updatePetition({
              variables: {
                petitionId,
                data: {
                  signatureConfig: {
                    ...omit(petition.signatureConfig!, ["integration", "signers", "__typename"]),
                    minSigners: Math.max(
                      petition.signatureConfig!.minSigners,
                      completeSignerInfoData!.signers.filter(
                        (s) =>
                          isNonNullish(s.signWithEmbeddedImage) ||
                          isNonNullish(s.signWithEmbeddedImageFileUploadId),
                      ).length + 1,
                    ),
                    timezone: petition.signatureConfig!.timezone,
                    orgIntegrationId: petition.signatureConfig!.integration!.id,
                    signersInfo: completeSignerInfoData!.signers,
                  },
                },
              },
            });
          }

          await completePetition({
            variables: {
              petitionId,
              message: completeSignerInfoData?.message,
            },
          });

          if (!petition.signatureConfig?.isEnabled) {
            if (!toast.isActive("petition-completed-toast")) {
              toast({
                id: "petition-completed-toast",
                title: intl.formatMessage({
                  id: "page.preview.toast-title-parallel-completed",
                  defaultMessage: "Parallel completed!",
                }),
                description: intl.formatMessage({
                  id: "page.preview.toast-description-parallel-completed",
                  defaultMessage: "Check that everything is OK to close the parallel.",
                }),
                status: "success",
                isClosable: true,
              });
            }
            router.push(`/app/petitions/${query.petitionId}/replies`);
          } else if (petition.signatureConfig.review) {
            if (!toast.isActive("petition-completed-toast")) {
              toast({
                id: "petition-completed-toast",
                title: intl.formatMessage({
                  id: "page.preview.toast-title-parallel-completed",
                  defaultMessage: "Parallel completed!",
                }),
                description: intl.formatMessage({
                  id: "page.preview.toast-description-review-send-signature",
                  defaultMessage:
                    "Review the replies and send the signature to close the parallel.",
                }),
                status: "success",
                isClosable: true,
              });
            }
            router.push(`/app/petitions/${query.petitionId}/replies`);
          } else {
            if (!toast.isActive("petition-completed-signature-sent-toast")) {
              toast({
                id: "petition-completed-signature-sent-toast",
                title: intl.formatMessage({
                  id: "page.preview.toast-title-signature-sent",
                  defaultMessage: "Signature sent",
                }),
                description: intl.formatMessage({
                  id: "page.preview.toast-description-signature-sent",
                  defaultMessage: "Your signature is on its way.",
                }),
                status: "success",
                isClosable: true,
              });
            }
            router.push(`/app/petitions/${query.petitionId}/replies`);
          }
        } else {
          if (nextIncompleteField) {
            router.push(
              `/app/petitions/${query.petitionId}/preview?${new URLSearchParams({
                page: nextIncompleteField.page.toString(),
                field: nextIncompleteField.id,
                ...(nextIncompleteField.parentReplyId
                  ? { parentReply: nextIncompleteField.parentReplyId }
                  : {}),
              })}`,
            );
          }
        }
      } catch {}
    },
    [
      canFinalize,
      nextIncompleteField?.id,
      nextIncompleteField?.parentReplyId,
      nextIncompleteField?.page,
      router,
      query,
    ],
  );

  const showErrorToast = useGenericErrorToast();

  const handleErrorFromFields = useCallback(async (error: any) => {
    if (isApolloError(error, "FIELD_ALREADY_REPLIED_ERROR")) {
      setShowRefreshRepliesAlert(true);
    } else if (
      isApolloError(error, "REPLY_ALREADY_DELETED_ERROR") ||
      isApolloError(error, "ONGOING_PROCESS_ERROR")
    ) {
      await refetch();
    } else if (
      isApolloError(error, "INVALID_REPLY_ERROR") ||
      isApolloError(error, "ID_VERIFICATION_FAILED")
    ) {
      // handled in field component
    } else if (isApolloError(error, "FORBIDDEN")) {
      showErrorToast(error);
    } else {
      throw error;
    }
  }, []);

  const isPetitionUsageLimitReached = me.organization.isPetitionUsageLimitReached;

  const showSendToButton =
    isPetition &&
    isNullish(petition.permanentDeletionAt) &&
    !petition.accesses?.find((a) => a.status === "ACTIVE" && !a.isContactless) &&
    petition.isInteractionWithRecipientsEnabled;

  const showStartSignatureButton =
    isPetition &&
    isNullish(petition.permanentDeletionAt) &&
    !!petition.signatureConfig?.isEnabled &&
    petition.signatureConfig.review === false &&
    !petition.isInteractionWithRecipientsEnabled &&
    petition.isDocumentGenerationEnabled &&
    (petition.signatureRequests.length === 0 ||
      ["COMPLETED", "CANCELLING", "CANCELLED"].includes(petition.signatureRequests[0].status) ||
      petition.status !== "COMPLETED");

  const createPetitionComment = useCreatePetitionComment();
  async function handleAddComment(content: any, isNote: boolean) {
    await createPetitionComment({
      petitionId,
      petitionFieldId: activeFieldId === "general" ? null : activeFieldId,
      content,
      isInternal: isNote,
    });
  }

  const updatePetitionComment = useUpdatePetitionComment();
  async function handleUpdateComment(
    petitionFieldCommentId: string,
    content: string,
    isNote: boolean,
  ) {
    await updatePetitionComment({
      petitionId,
      petitionFieldCommentId,
      content,
      isInternal: isNote,
    });
  }

  const deletePetitionComment = useDeletePetitionComment();
  async function handleDeleteComment(petitionFieldCommentId: string) {
    await deletePetitionComment({
      petitionId,
      petitionFieldCommentId,
    });
  }
  const updateIsReadNotification = useUpdateIsReadNotification();
  async function handleMarkAsUnread(petitionFieldCommentId: string) {
    await updateIsReadNotification({
      petitionFieldCommentIds: [petitionFieldCommentId],
      isRead: false,
    });
  }

  const showPetitionLimitReachedAlert =
    petition.__typename === "Petition" &&
    me.organization.isPetitionUsageLimitReached &&
    petition.status === "DRAFT";

  const limitValue = me.organization.petitionsPeriod?.limit ?? 0;

  const signatureStatus =
    petition.__typename === "Petition" ? getPetitionSignatureStatus(petition) : "NO_SIGNATURE";

  const { handleStartSignature } = useStartSignatureRequest({
    petition: petition as any,
  });

  const { handleCancelApprovals } = useCancelApprovalRequestFlow(petition.id);

  const { handleStartApprovalFlow, hasNotStartedApprovals } = useStartApprovalRequestStep({
    petition,
  });

  const { handleClosePetition } = useClosePetition({
    onRefetch: () => refetch(),
  });

  const [cancelSignatureRequest] = useMutation(PetitionPreview_cancelSignatureRequestDocument);

  const handleCancelSignature = useCallback(async () => {
    if (petition.__typename === "Petition" && petition.currentSignatureRequest) {
      await cancelSignatureRequest({
        variables: {
          petitionSignatureRequestId: petition.currentSignatureRequest.id,
        },
      });
    }
  }, [petition]);

  const hasStartedProcess = isPetition && petition.hasStartedProcess;
  const isAllowedToEditReplies =
    isPetition &&
    hasStartedProcess &&
    petition.currentApprovalRequestSteps?.some(
      (s) => s.status === "PENDING" && s.allowEdit && s.approvers.some((a) => a.user?.id === me.id),
    );
  return (
    <RecipientViewSidebarContextProvider>
      <ToneProvider value={petition.organization.brandTheme.preferredTone}>
        <PetitionLayout
          key={petition.id}
          queryObject={queryData}
          petition={petition}
          onRefetch={() => refetch()}
          section="preview"
          headerActions={
            showSendToButton ? (
              <ResponsiveButtonIcon
                data-action="preview-next"
                id="petition-next"
                colorScheme="primary"
                icon={<PaperPlaneIcon fontSize="18px" />}
                disabled={
                  petition.isAnonymized ||
                  myEffectivePermission === "READ" ||
                  isNonNullish(petition.permanentDeletionAt)
                }
                label={intl.formatMessage({
                  id: "generic.send-to",
                  defaultMessage: "Send to...",
                })}
                onClick={handleNextClick}
              />
            ) : showStartSignatureButton ? (
              <PetitionPreviewStartSignatureButton
                data-action="preview-start-signature"
                id="petition-start-signature"
                colorScheme="primary"
                petition={petition}
                disabled={
                  petition.isAnonymized ||
                  myEffectivePermission === "READ" ||
                  isNonNullish(petition.permanentDeletionAt)
                }
              />
            ) : null
          }
          hasRightPane
          isRightPaneActive={Boolean(activeFieldId)}
          rightPane={
            <>
              <Flex
                display={{ base: "flex", lg: "none" }}
                flex="1"
                overflow="hidden"
                flexDirection="column"
              >
                {activeFieldId && !!activeField ? (
                  <PetitionRepliesFieldComments
                    key={activeFieldId}
                    petition={petition}
                    field={activeField}
                    isDisabled={
                      petition.isAnonymized ||
                      petition.__typename === "PetitionTemplate" ||
                      isNonNullish(petition.permanentDeletionAt)
                    }
                    onClose={() => setActiveFieldId(null)}
                    onAddComment={handleAddComment}
                    onUpdateComment={handleUpdateComment}
                    onDeleteComment={handleDeleteComment}
                    onMarkAsUnread={handleMarkAsUnread}
                    onlyReadPermission={myEffectivePermission === "READ"}
                  />
                ) : null}
              </Flex>
              <Flex display={{ base: "none", lg: "flex" }} flex="1" overflow="hidden">
                <PetitionPreviewRightPaneTabs
                  petition={petition}
                  currentPage={currentPage}
                  activeFieldId={activeFieldId}
                  setActiveFieldId={setActiveFieldId}
                  onAddComment={handleAddComment}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                  onMarkAsUnread={handleMarkAsUnread}
                  activeField={activeField}
                  onlyReadPermission={myEffectivePermission === "READ"}
                  isDisabled={
                    petition.isAnonymized ||
                    petition.__typename === "PetitionTemplate" ||
                    isNonNullish(petition.permanentDeletionAt)
                  }
                />
              </Flex>
            </>
          }
        >
          {isPetition && petition.status !== "CLOSED" && (
            <RecipientViewProgressBar
              petition={petition}
              canFinalize={canFinalize}
              onFinalize={handleFinalize}
              isDisabled={
                isPetitionUsageLimitReached ||
                petition.isAnonymized ||
                myEffectivePermission === "READ" ||
                isNonNullish(petition.permanentDeletionAt)
              }
              fontFamily="body"
              width="100%"
              height="53px"
              borderBottom="1px solid"
              borderBottomColor="gray.200"
            />
          )}
          {/* Alerts box */}
          <Box>
            {isNonNullish(petition.permanentDeletionAt) ? (
              <PetitionPermanentDeletionAlert
                date={petition.permanentDeletionAt}
                isTemplate={petition.__typename === "PetitionTemplate"}
              />
            ) : (
              <>
                {showRefreshRepliesAlert ? (
                  <RecipientViewRefreshRepliesAlert
                    onRefetch={async () => {
                      await refetch();
                      setShowRefreshRepliesAlert(false);
                    }}
                  />
                ) : null}

                {showPetitionLimitReachedAlert ? (
                  <PetitionLimitReachedAlert limit={limitValue} />
                ) : null}

                {isPetition ? (
                  <PetitionComposeAndPreviewAlerts
                    onCancelApprovals={handleCancelApprovals}
                    onStartApprovals={() => handleStartApprovalFlow()}
                    onStartSignature={handleStartSignature}
                    onClosePetition={() => {
                      handleClosePetition(petition);
                    }}
                    onCancelSignature={handleCancelSignature}
                    petitionStatus={petition.status}
                    signatureStatus={signatureStatus}
                    approvalsStatus={petition.currentApprovalRequestStatus}
                    signatureAfterApprovals={petition.signatureConfig?.reviewAfterApproval}
                    hasNotStartedApprovals={hasNotStartedApprovals}
                  />
                ) : (
                  <PetitionPreviewOnlyAlert />
                )}
              </>
            )}
          </Box>
          {/* End of alerts box */}
          <OverrideWithOrganizationTheme
            cssVarsRoot=".with-organization-brand-theme"
            brandTheme={me.organization.brandTheme}
          >
            <Box
              ref={pageRef}
              flex={1}
              paddingX={4}
              backgroundColor="primary.50"
              className="with-organization-brand-theme"
              position="relative"
              overflow="auto"
            >
              <Flex
                width="100%"
                margin="auto"
                maxWidth="container.sm"
                fontFamily="body"
                gap={4}
                zIndex={1}
                position="relative"
              >
                <Flex
                  data-section="preview-fields"
                  paddingY={6}
                  flexDirection="column"
                  flex="2"
                  minWidth={0}
                >
                  <Stack gap={4} key={0}>
                    <LiquidPetitionScopeProvider
                      petition={petition}
                      usePreviewReplies={petition.__typename === "PetitionTemplate"}
                    >
                      {fieldsWithLogic.map(({ field, logic }) => {
                        const fieldHasReplies = field.replies.length !== 0;

                        const reviewReplyProps = {
                          icon: <ChevronRightIcon boxSize={5} />,
                          size: "sm" as const,
                          variant: "outline" as const,
                          backgroundColor: "white",
                          placement: "bottom" as const,
                          color: "gray.600",
                          isDisabled: !fieldHasReplies,
                          label: intl.formatMessage({
                            id: "page.preview.review-reply",
                            defaultMessage: "Review reply",
                          }),
                        };

                        return (
                          <LiquidPetitionVariableProvider
                            key={field.id}
                            logic={logic}
                            variables={petition.variables}
                          >
                            <Box
                              position="relative"
                              _focusWithin={{
                                ".edit-preview-field-buttons": {
                                  display: "flex",
                                },
                              }}
                              _hover={{
                                ".edit-preview-field-buttons": {
                                  display: "inline-flex",
                                },
                              }}
                            >
                              <PreviewPetitionField
                                key={field.id}
                                user={me}
                                petition={petition}
                                field={field}
                                isDisabled={
                                  (isPetition && petition.status === "CLOSED") ||
                                  petition.isAnonymized ||
                                  isPetitionUsageLimitReached ||
                                  (hasStartedProcess && !isAllowedToEditReplies) ||
                                  isNonNullish(petition.permanentDeletionAt)
                                }
                                isCacheOnly={!isPetition}
                                myEffectivePermission={myEffectivePermission}
                                showErrors={showErrors && !canFinalize}
                                fieldLogic={logic}
                                onError={handleErrorFromFields}
                                onCommentsButtonClick={() => setActiveFieldId(field.id)}
                              />
                              {field.type !== "FIELD_GROUP" ? (
                                <Flex
                                  display={{ base: "none", xl: "flex" }}
                                  position="absolute"
                                  alignItems="flex-start"
                                  top="0px"
                                  insetEnd="-48px"
                                  height="100%"
                                  width="auto"
                                  minWidth="48px"
                                  padding={2}
                                >
                                  <Stack
                                    className={"edit-preview-field-buttons"}
                                    display="none"
                                    position="sticky"
                                    top={2}
                                  >
                                    <IconButtonWithTooltip
                                      as={NextLink}
                                      href={buildUrlToSection("compose", { field: field.id })}
                                      size="sm"
                                      variant="outline"
                                      backgroundColor="white"
                                      placement="bottom"
                                      color="gray.600"
                                      icon={<EditSimpleIcon boxSize={4} />}
                                      label={intl.formatMessage({
                                        id: "page.preview.edit-field",
                                        defaultMessage: "Edit field",
                                      })}
                                    />
                                    {field.type === "HEADING" ||
                                    !isPetition ? null : fieldHasReplies ? (
                                      <IconButtonWithTooltip
                                        as={NextLink}
                                        href={buildUrlToSection("replies", { field: field.id })}
                                        {...reviewReplyProps}
                                      />
                                    ) : (
                                      <IconButtonWithTooltip {...reviewReplyProps} />
                                    )}
                                  </Stack>
                                </Flex>
                              ) : null}
                            </Box>
                          </LiquidPetitionVariableProvider>
                        );
                      })}
                    </LiquidPetitionScopeProvider>
                    {pages.length === currentPage && isPetition ? (
                      <Center paddingTop={4}>
                        <Button
                          colorPalette="primary"
                          onClick={handleFinalize}
                          disabled={
                            petition.isAnonymized ||
                            isClosed ||
                            myEffectivePermission === "READ" ||
                            isNonNullish(petition.permanentDeletionAt)
                          }
                        >
                          {petition.signatureConfig?.isEnabled &&
                          petition.signatureConfig?.review === false ? (
                            <FormattedMessage
                              id="generic.finalize-and-sign-button"
                              defaultMessage="Finalize and sign"
                            />
                          ) : (
                            <FormattedMessage
                              id="generic.finalize-button"
                              defaultMessage="Finalize"
                            />
                          )}
                        </Button>
                      </Center>
                    ) : null}
                  </Stack>
                  <Spacer minHeight={8} />
                  {pages.length > 1 ? (
                    <RecipientViewPagination currentPage={currentPage} pageCount={pageCount} />
                  ) : null}
                </Flex>
              </Flex>
            </Box>
          </OverrideWithOrganizationTheme>
        </PetitionLayout>
      </ToneProvider>
    </RecipientViewSidebarContextProvider>
  );
}

const _fragments = {
  PetitionField: gql`
    fragment PetitionPreview_PetitionField on PetitionField {
      id
      unreadCommentCount
      children {
        id
        alias
        ...validatePetitionFields_PetitionField
        ...FieldErrorDialog_PetitionField
        replies {
          id
          parent {
            id
          }
        }
      }
      replies {
        id
        parent {
          id
        }
      }
      ...PreviewPetitionField_PetitionField
      ...validatePetitionFields_PetitionField
      ...FieldErrorDialog_PetitionField
      ...HiddenFieldDialog_PetitionField
      ...focusPetitionField_PetitionField
      ...PetitionPreviewRightPaneTabs_PetitionField
      ...PetitionRepliesFieldComments_PetitionField
    }
  `,
  PetitionBase: gql`
    fragment PetitionPreview_PetitionBase on PetitionBase {
      id
      isInteractionWithRecipientsEnabled
      isDocumentGenerationEnabled
      organization {
        id
        brandTheme {
          preferredTone
        }
      }
      isAnonymized
      myEffectivePermission {
        permissionType
      }
      ... on Petition {
        status
        hasStartedProcess
        ...PetitionPreviewStartSignatureButton_Petition
        unreadGeneralCommentCount
        accesses {
          id
          status
          isContactless
        }
        signatureRequests {
          id
          status
        }
        currentSignatureRequest {
          id
          status
        }
        currentApprovalRequestStatus
        currentApprovalRequestSteps {
          id
          status
          allowEdit
          approvers {
            id
            user {
              id
            }
          }
        }
        ...RecipientViewProgressBar_Petition
        ...useSendPetitionHandler_Petition
        ...getPetitionSignatureStatus_Petition
        ...useStartSignatureRequest_Petition
      }
      ... on PetitionTemplate {
        publicLink {
          id
          isActive
        }
      }
      fields {
        id
        ...PetitionPreview_PetitionField
      }
      signatureConfig {
        isEnabled
        review
        reviewAfterApproval
        timezone
        ...ConfirmPetitionSignersDialog_SignatureConfig
      }
      variables {
        ...LiquidPetitionVariableProvider_PetitionVariable
      }
      permanentDeletionAt
      ...useAllFieldsWithIndices_PetitionBase
      ...useGetPetitionPages_PetitionBase
      ...PetitionLayout_PetitionBase
      ...LiquidPetitionScopeProvider_PetitionBase
      ...PreviewPetitionField_PetitionBase
      ...usePetitionCanFinalize_PetitionBase
      ...HiddenFieldDialog_PetitionBase
      ...validatePetitionFields_PetitionBase
      ...useStartApprovalRequestStep_PetitionBase
      ...useClosePetition_PetitionBase
      ...PetitionPreviewRightPaneTabs_PetitionBase
      ...PetitionRepliesFieldComments_PetitionBase
    }
  `,
  Query: gql`
    fragment PetitionPreview_Query on Query {
      ...PetitionLayout_Query
      me {
        id
        organization {
          id
          isPetitionUsageLimitReached: isUsageLimitReached(limitName: PETITION_SEND)
          petitionsPeriod: currentUsagePeriod(limitName: PETITION_SEND) {
            limit
          }
          brandTheme {
            ...OverrideWithOrganizationTheme_OrganizationBrandThemeData
          }
        }
        ...useSendPetitionHandler_User
        ...ConfirmPetitionSignersDialog_User
        ...PreviewPetitionField_User
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation PetitionPreview_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionPreview_PetitionBase
      }
    }
  `,
  gql`
    mutation PetitionPreview_completePetition($petitionId: GID!, $message: String) {
      completePetition(petitionId: $petitionId, message: $message) {
        ...PetitionPreview_PetitionBase
      }
    }
  `,
  gql`
    mutation PetitionPreview_cancelSignatureRequest($petitionSignatureRequestId: GID!) {
      cancelSignatureRequest(petitionSignatureRequestId: $petitionSignatureRequestId) {
        id
        status
        cancelReason
        petition {
          id
          hasStartedProcess
        }
      }
    }
  `,
];

const _queries = [
  gql`
    query PetitionPreview_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionPreview_PetitionBase
      }
    }
  `,
  gql`
    query PetitionPreview_user {
      ...PetitionPreview_Query
    }
  `,
];

PetitionPreview.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  await Promise.all([
    fetchQuery(PetitionPreview_userDocument),
    fetchQuery(PetitionPreview_petitionDocument, {
      variables: { id: petitionId },
      fetchPolicy: "network-only",
    }),
  ]);
  return { petitionId };
};

export default compose(withPetitionLayoutContext, withDialogs, withApolloData)(PetitionPreview);
