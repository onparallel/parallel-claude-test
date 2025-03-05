import { gql, useMutation } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { VariablesOf } from "@graphql-typed-document-node/core";
import {
  CheckIcon,
  CommentIcon,
  DownloadIcon,
  FilePdfIcon,
  ListIcon,
  ProfilesIcon,
  RepeatIcon,
  SparklesIcon,
} from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ProfileSelectInstance } from "@parallel/components/common/ProfileSelect";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { ShareButton } from "@parallel/components/common/ShareButton";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  DialogProps,
  isDialogError,
  useDialog,
  withDialogs,
} from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import {
  PetitionLayout,
  usePetitionStateWrapper,
  withPetitionLayoutContext,
} from "@parallel/components/layout/PetitionLayout";
import { useAssociateProfileToPetitionDialog } from "@parallel/components/petition-common/dialogs/AssociateProfileToPetitionDialog";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/dialogs/PetitionSharingDialog";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import { PetitionApprovalsCard } from "@parallel/components/petition-replies/PetitionApprovalsCard";
import { PetitionComments } from "@parallel/components/petition-replies/PetitionComments";
import { PetitionRepliesContents } from "@parallel/components/petition-replies/PetitionRepliesContents";
import {
  PetitionRepliesField,
  PetitionRepliesFieldProps,
} from "@parallel/components/petition-replies/PetitionRepliesField";
import { PetitionRepliesFieldComments } from "@parallel/components/petition-replies/PetitionRepliesFieldComments";
import { PetitionRepliesFieldReply } from "@parallel/components/petition-replies/PetitionRepliesFieldReply";
import { PetitionRepliesFilterButton } from "@parallel/components/petition-replies/PetitionRepliesFilterButton";
import { PetitionRepliesFilteredFields } from "@parallel/components/petition-replies/PetitionRepliesFilteredFields";
import { PetitionRepliesSummary } from "@parallel/components/petition-replies/PetitionRepliesSummary";
import { PetitionSignaturesCard } from "@parallel/components/petition-replies/PetitionSignaturesCard";
import { PetitionVariablesCard } from "@parallel/components/petition-replies/PetitionVariablesCard";
import { ProfileDrawer } from "@parallel/components/petition-replies/ProfileDrawer";
import { useArchiveFieldGroupReplyIntoProfileDialog } from "@parallel/components/petition-replies/dialogs/ArchiveFieldGroupReplyIntoProfileDialog";
import { useClosePetitionDialog } from "@parallel/components/petition-replies/dialogs/ClosePetitionDialog";
import { useConfirmResendCompletedNotificationDialog } from "@parallel/components/petition-replies/dialogs/ConfirmResendCompletedNotificationDialog";
import {
  ExportRepliesDialog,
  useExportRepliesDialog,
} from "@parallel/components/petition-replies/dialogs/ExportRepliesDialog";
import { useExportRepliesProgressDialog } from "@parallel/components/petition-replies/dialogs/ExportRepliesProgressDialog";
import { useSolveUnreviewedRepliesDialog } from "@parallel/components/petition-replies/dialogs/SolveUnreviewedRepliesDialog";
import {
  PetitionFieldReplyStatus,
  PetitionReplies_PetitionFragment,
  PetitionReplies_approveOrRejectPetitionFieldRepliesDocument,
  PetitionReplies_associateProfileToPetitionDocument,
  PetitionReplies_cancelPetitionApprovalRequestFlowDocument,
  PetitionReplies_closePetitionDocument,
  PetitionReplies_petitionDocument,
  PetitionReplies_sendPetitionClosedNotificationDocument,
  PetitionReplies_updatePetitionDocument,
  PetitionReplies_updatePetitionFieldRepliesStatusDocument,
  PetitionReplies_userDocument,
  PetitionSettings_cancelPetitionSignatureRequestDocument,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { Fragments } from "@parallel/utils/apollo/fragments";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import {
  PetitionFieldFilter,
  defaultFieldsFilter,
  filterPetitionFields,
} from "@parallel/utils/filterPetitionFields";
import { getPetitionSignatureEnvironment } from "@parallel/utils/getPetitionSignatureEnvironment";
import { getPetitionSignatureStatus } from "@parallel/utils/getPetitionSignatureStatus";
import { LiquidPetitionScopeProvider } from "@parallel/utils/liquid/LiquidPetitionScopeProvider";
import { LiquidPetitionVariableProvider } from "@parallel/utils/liquid/LiquidPetitionVariableProvider";
import {
  useCreatePetitionComment,
  useDeletePetitionComment,
  useUpdatePetitionComment,
} from "@parallel/utils/mutations/comments";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { string, useQueryState, useQueryStateSlice } from "@parallel/utils/queryState";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { useExportRepliesTask } from "@parallel/utils/tasks/useExportRepliesTask";
import { useFileExportTask } from "@parallel/utils/tasks/useFileExportTask";
import { usePrintPdfTask } from "@parallel/utils/tasks/usePrintPdfTask";
import { Maybe, UnwrapPromise } from "@parallel/utils/types";
import { useDownloadReplyFile } from "@parallel/utils/useDownloadReplyFile";
import { useHasRemovePreviewFiles } from "@parallel/utils/useHasRemovePreviewFiles";
import { useHighlightElement } from "@parallel/utils/useHighlightElement";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { withMetadata } from "@parallel/utils/withMetadata";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, sumBy, zip } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
type PetitionRepliesProps = UnwrapPromise<ReturnType<typeof PetitionReplies.getInitialProps>>;

const GENERAL_COMMENTS_FIELD_ID = "general";

const QUERY_STATE = {
  comments: string(),
  profile: string(),
};

function PetitionReplies({ petitionId }: PetitionRepliesProps) {
  const intl = useIntl();
  const router = useRouter();
  const { data: queryObject } = useAssertQuery(PetitionReplies_userDocument);
  const { me } = queryObject;
  const { data, refetch } = useAssertQuery(PetitionReplies_petitionDocument, {
    variables: {
      id: petitionId,
    },
  });

  const updateIsReadNotification = useUpdateIsReadNotification();
  useEffect(() => {
    updateIsReadNotification({ isRead: true, petitionIds: [petitionId] });
  }, [petitionId]);

  const petition = data!.petition as PetitionReplies_PetitionFragment;
  const allFieldsUnreadCommentCount =
    sumBy(petition.fields, (f) => f.unreadCommentCount) + petition.unreadGeneralCommentCount;
  const myEffectivePermission = petition.myEffectivePermission!.permissionType;

  const fieldLogic = useFieldLogic(petition);
  const toast = useToast();

  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const [activeFieldId, setActiveFieldId] = useQueryStateSlice(
    queryState,
    setQueryState,
    "comments",
  );
  const [profileId, setProfileId] = useQueryStateSlice(queryState, setQueryState, "profile");

  const [tabIndex, setTabIndex] = useState(activeFieldId ? 1 : 0);

  useEffect(() => {
    if (activeFieldId) {
      setTabIndex(1);
    }
  }, [activeFieldId]);

  const activeField = activeFieldId ? petition.fields.find((f) => f.id === activeFieldId) : null;
  const fieldRefs = useMultipleRefs<HTMLElement>();
  const signaturesRef = useRef<HTMLElement>(null);
  const variablesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // force a rerender when active field is coming from url so the flyout repositions
    if (activeFieldId) {
      setActiveFieldId(activeFieldId);
      const field = document.getElementById(`field-${activeFieldId}`);
      if (field) {
        scrollIntoView(field, { block: "center", behavior: "smooth" });
      }
    }
  }, []);

  useEffect(() => {
    if (isNonNullish(activeFieldId)) {
      const field = document.getElementById(`field-${activeFieldId}`);
      if (field) {
        scrollIntoView(field, { block: "center", behavior: "smooth" });
      }
    }
  }, [activeFieldId]);

  useTempQueryParam("field", (fieldId) => {
    setTimeout(() => handlePetitionContentsFieldClick(fieldId));
  });

  useTempQueryParam("parentReply", (replyId) => {
    const element = document.getElementById(`reply-${replyId}`);
    setTimeout(() => highlight(element));
  });

  const wrapper = usePetitionStateWrapper();
  const [updatePetition] = useMutation(PetitionReplies_updatePetitionDocument);
  const downloadReplyFile = useDownloadReplyFile();
  const userHasRemovePreviewFiles = useHasRemovePreviewFiles();
  const updatePetitionFieldRepliesStatus = useUpdatePetitionFieldRepliesStatus();
  async function handleUpdateRepliesStatus(
    petitionFieldId: string,
    petitionFieldReplyIds: string[],
    status: PetitionFieldReplyStatus,
    parentFieldId: string,
  ) {
    if (status === "REJECTED") {
      setActiveFieldId(parentFieldId);
      setTimeout(() => {
        const input = document.querySelector<HTMLTextAreaElement>(
          "#petition-replies-comments-input",
        );
        if (input) {
          scrollIntoView(input, { block: "center", behavior: "smooth" });
          input.focus();
        }
      }, 150);
    }
    await updatePetitionFieldRepliesStatus({
      petitionId,
      petitionFieldId,
      petitionFieldReplyIds,
      status,
    });
  }

  const handleUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId],
  );

  const handleAction: PetitionRepliesFieldProps["onAction"] = async function (action, reply) {
    switch (action) {
      case "DOWNLOAD_FILE":
      case "PREVIEW_FILE":
        try {
          await downloadReplyFile(
            petitionId,
            reply,
            userHasRemovePreviewFiles ? false : action === "PREVIEW_FILE",
          );
        } catch {}
        break;
    }
  };
  const showExportRepliesDialog = useExportRepliesDialog();
  const showExportRepliesProgressDialog = useExportRepliesProgressDialog();
  const handleExportRepliesTask = useExportRepliesTask();
  const handleFileExportTask = useFileExportTask();

  const handleDownloadAllClick = useCallback(async () => {
    try {
      const res = await showExportRepliesDialog({
        user: me,
        petition,
      });

      if (res.type === "DOWNLOAD_ZIP") {
        handleExportRepliesTask(petition.id, res.pattern);
      } else if (res.type === "EXPORT_CUATRECASAS") {
        const { pattern, externalClientId } = res;
        await showExportRepliesProgressDialog({
          petitionId: petition.id,
          pattern,
          externalClientId,
        });
      } else if (res.type === "FILE_EXPORT_PROVIDER") {
        const integrationId = me.organization.fileExportIntegrations.items[0].id;
        handleFileExportTask(petition.id, integrationId, res.pattern);
      }
    } catch {}
  }, [petitionId, petition.fields]);

  const showDownloadAll = petition.fields.some(
    (f) =>
      (!f.isReadOnly &&
        ((f.type === "FIELD_GROUP" && f.children?.some((child) => child.replies.length > 0)) ||
          (f.type !== "FIELD_GROUP" && f.replies.length > 0))) ||
      f.commentCount > 0,
  );

  const handlePrintPdfTask = usePrintPdfTask();

  const createPetitionComment = useCreatePetitionComment();
  async function handleAddComment(content: any, isNote: boolean) {
    await createPetitionComment({
      petitionId,
      petitionFieldId: activeFieldId === GENERAL_COMMENTS_FIELD_ID ? null : activeFieldId,
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

  async function handleMarkAsUnread(petitionFieldCommentId: string) {
    await updateIsReadNotification({
      petitionFieldCommentIds: [petitionFieldCommentId],
      isRead: false,
    });
  }

  const highlight = useHighlightElement();
  const handlePetitionContentsFieldClick = useCallback((fieldId: string) => {
    setTimeout(() => highlight(fieldRefs[fieldId].current));
  }, []);
  const handlePetitionContentsSignatureClick = useCallback(() => {
    highlight(signaturesRef.current);
  }, []);
  const handlePetitionContentsVariablesClick = useCallback(() => {
    highlight(variablesRef.current);
  }, []);

  const fieldsWithIndices = useFieldsWithIndices(petition);
  const allFields = useMemo(
    () => petition.fields.flatMap((f) => [f, ...(f.children ?? [])]),
    [petition.fields],
  );
  const hasLinkedToProfileTypeFields = allFields.some((f) => f.isLinkedToProfileTypeField);

  const showClosePetitionDialog = useClosePetitionDialog();
  const [sendPetitionClosedNotification] = useMutation(
    PetitionReplies_sendPetitionClosedNotificationDocument,
  );
  const petitionAlreadyNotifiedDialog = useConfirmResendCompletedNotificationDialog();
  const handleFinishPetition = useCallback(
    async ({ requiredMessage }: { requiredMessage: boolean }) => {
      const showToast = (includeDescription?: boolean) => {
        toast({
          title: intl.formatMessage({
            id: "page.replies.parallel-closed-toast-header",
            defaultMessage: "Parallel closed",
          }),
          description: includeDescription
            ? intl.formatMessage({
                id: "page.replies.parallel-closed-toast-description",
                defaultMessage: "The recipient has been notified.",
              })
            : undefined,
          status: "success" as const,
          duration: 3000,
          isClosable: true,
        });
      };

      let message: Maybe<RichTextEditorValue> = null;
      let pdfExportTitle: Maybe<string> = null;
      let attachPdfExport = false;

      try {
        const data = await showClosePetitionDialog({
          petition,
          hasLinkedToProfileTypeFields,
          requiredMessage,
        });

        message = data.message;
        pdfExportTitle = data.pdfExportTitle;
        attachPdfExport = data.attachPdfExport;

        if (message) {
          await sendPetitionClosedNotification({
            variables: {
              petitionId: petition.id,
              emailBody: message,
              attachPdfExport,
              pdfExportTitle,
            },
          });
        }
        showToast(!!message);
      } catch (error) {
        // rethrow error to avoid continuing flow on function handleClosePetition
        if (isDialogError(error)) {
          throw error;
        }
        if (isApolloError(error, "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR")) {
          await petitionAlreadyNotifiedDialog();
          await sendPetitionClosedNotification({
            variables: {
              petitionId: petition.id,
              emailBody: message,
              attachPdfExport,
              pdfExportTitle,
              force: true,
            },
          });
          showToast(!!message);
        }
      }
    },
    [petition, intl.locale, hasLinkedToProfileTypeFields],
  );

  const repliesFieldGroupsWithProfileTypes = zip(petition.fields, fieldLogic)
    .filter(
      ([field, { isVisible }]) =>
        isVisible &&
        field.type === "FIELD_GROUP" &&
        field.isLinkedToProfileType &&
        field.replies.length > 0,
    )
    .flatMap(([f]) => f.replies);

  const fieldGroupsWithProfileTypesTotal = repliesFieldGroupsWithProfileTypes.length;

  const fieldGroupsWithProfileTypesLinked = repliesFieldGroupsWithProfileTypes.filter((r) =>
    isNonNullish(r.associatedProfile),
  ).length;

  const showArchiveFieldGroupReplyIntoProfileDialog = useArchiveFieldGroupReplyIntoProfileDialog();
  const handleAssociateAndFillProfile = async () => {
    try {
      await showArchiveFieldGroupReplyIntoProfileDialog({
        petitionId: petition.id,
        groupsWithProfileTypesCount: fieldGroupsWithProfileTypesTotal,
        onRefetch: () => refetch(),
      });
    } catch {}
  };

  const showSolveUnreviewedRepliesDialog = useSolveUnreviewedRepliesDialog();
  const [approveOrRejectReplies] = useMutation(
    PetitionReplies_approveOrRejectPetitionFieldRepliesDocument,
  );
  const [closePetition] = useMutation(PetitionReplies_closePetitionDocument);

  const showConfirmCancelOngoingSignature = useDialog(ConfirmCancelOngoingSignature);

  const showConfirmCancelOngoingApprovals = useDialog(ConfirmCancelOngoingApprovals);

  const [cancelSignatureRequest] = useMutation(
    PetitionSettings_cancelPetitionSignatureRequestDocument,
  );

  const [cancelPetitionApprovalRequestFlow] = useMutation(
    PetitionReplies_cancelPetitionApprovalRequestFlowDocument,
  );

  const handleClosePetition = useCallback(async () => {
    try {
      const hasPendingSignature =
        (petition.currentSignatureRequest &&
          ["ENQUEUED", "PROCESSING", "PROCESSED"].includes(
            petition.currentSignatureRequest.status,
          )) ??
        false;

      const hasRejectedApproval = petition.currentApprovalRequestSteps?.some(
        (s) => s.status === "REJECTED",
      );

      const pendingApproval = hasRejectedApproval
        ? null
        : petition.currentApprovalRequestSteps?.find((s) => s.status === "PENDING");

      if (isNonNullish(pendingApproval)) {
        await showConfirmCancelOngoingApprovals();
        await cancelPetitionApprovalRequestFlow({
          variables: {
            petitionId: petition.id,
          },
        });
      } else if (hasPendingSignature || petition.signatureConfig) {
        await showConfirmCancelOngoingSignature();
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
        f.replies.some((r) => r.status === "PENDING" && f.requireApproval),
      );

      const option =
        petition.isReviewFlowEnabled && hasUnreviewedReplies
          ? await showSolveUnreviewedRepliesDialog()
          : "NOTHING";

      await handleFinishPetition({ requiredMessage: false });

      if (hasUnreviewedReplies && option !== "NOTHING") {
        await approveOrRejectReplies({
          variables: {
            petitionId,
            status: option === "APPROVE" ? "APPROVED" : "REJECTED",
          },
        });
      }

      await closePetition({
        variables: {
          petitionId,
        },
      });

      if (hasLinkedToProfileTypeFields) {
        await handleAssociateAndFillProfile();
      }
    } catch {}
  }, [
    petition,
    approveOrRejectReplies,
    closePetition,
    handleFinishPetition,
    cancelSignatureRequest,
    handleAssociateAndFillProfile,
    hasLinkedToProfileTypeFields,
  ]);

  const showPetitionSharingDialog = usePetitionSharingDialog();
  const handlePetitionSharingClick = async function () {
    try {
      const res = await showPetitionSharingDialog({
        userId: me.id,
        petitionIds: [petition.id],
        type: "PETITION",
      });
      if (res?.close) {
        router.push("/app/petitions");
      }
    } catch {}
  };

  const [filter, setFilter] = useState<PetitionFieldFilter>(defaultFieldsFilter);

  const petitionSignatureStatus = getPetitionSignatureStatus(petition);
  const petitionSignatureEnvironment = getPetitionSignatureEnvironment(petition);

  const displayPetitionLimitReachedAlert =
    me.organization.isPetitionUsageLimitReached &&
    petition.__typename === "Petition" &&
    petition.status === "DRAFT";

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  const [associateProfileToPetition] = useMutation(
    PetitionReplies_associateProfileToPetitionDocument,
  );
  const showAssociateProfileToPetitionDialog = useAssociateProfileToPetitionDialog();
  const handleAssociateProfile = async () => {
    try {
      const profileId = await showAssociateProfileToPetitionDialog({
        excludeProfiles: petition.profiles?.map((p) => p.id),
      });
      await associateProfileToPetition({
        variables: { petitionId, profileId },
      });
      toast({
        isClosable: true,
        status: "success",
        title: intl.formatMessage({
          id: "component.petition-header.profile-asociated-toast-title",
          defaultMessage: "Profile associated",
        }),
        description: intl.formatMessage({
          id: "component.petition-header.profile-asociated-toast-description",
          defaultMessage: "You can include the information you need",
        }),
      });

      setProfileId(profileId);
    } catch {}
  };

  const handleToggleGeneralComments = useCallback(() => {
    setActiveFieldId(
      activeFieldId === GENERAL_COMMENTS_FIELD_ID ? null : GENERAL_COMMENTS_FIELD_ID,
    );
  }, [activeFieldId]);
  const drawerInitialRef = useRef<ProfileSelectInstance<false>>(null);
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const hasApprovals =
    (petition.currentApprovalRequestSteps && petition.currentApprovalRequestSteps.length > 0) ||
    (petition.approvalFlowConfig && petition.approvalFlowConfig.length > 0);

  return (
    <PetitionLayout
      key={petition.id}
      queryObject={queryObject}
      petition={petition}
      onUpdatePetition={handleUpdatePetition}
      onRefetch={() => refetch()}
      section="replies"
      headerActions={
        <Box display={{ base: "none", lg: "block" }}>
          <ShareButton petition={petition} userId={me.id} onClick={handlePetitionSharingClick} />
        </Box>
      }
      drawer={
        profileId ? (
          <ProfileDrawer
            ref={drawerInitialRef}
            profileId={profileId}
            profiles={petition.profiles}
            onChangeProfile={setProfileId}
            onAssociateProfile={handleAssociateProfile}
            isReadOnly={petition.isAnonymized}
            canAddProfiles={petition.myEffectivePermission?.permissionType !== "READ"}
            petitionId={petitionId}
            petition={petition}
          />
        ) : null
      }
      drawerInitialFocusRef={drawerInitialRef}
      hasRightPane
      isRightPaneActive={Boolean(activeFieldId)}
      rightPane={
        isMobile ? (
          (activeFieldId && !!activeField) || activeFieldId === GENERAL_COMMENTS_FIELD_ID ? (
            <Flex flex="1" flexDirection="column">
              <PetitionRepliesFieldComments
                key={activeFieldId}
                petition={petition}
                field={activeField}
                isDisabled={petition.isAnonymized}
                onClose={() => setActiveFieldId(null)}
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onMarkAsUnread={handleMarkAsUnread}
                onlyReadPermission={myEffectivePermission === "READ"}
              />
            </Flex>
          ) : null
        ) : (
          <Tabs
            index={tabIndex}
            onChange={(index) => setTabIndex(index)}
            variant="enclosed"
            overflow="hidden"
            {...extendFlexColumn}
          >
            <TabList marginX="-1px" marginTop="-1px" flex="none">
              <Tab
                paddingY={4}
                paddingX={3.5}
                lineHeight={5}
                fontWeight="bold"
                borderTopRadius={0}
                _focusVisible={{ boxShadow: "inline" }}
              >
                <ListIcon fontSize="18px" marginEnd={1} aria-hidden="true" />
                <FormattedMessage id="generic.contents" defaultMessage="Contents" />
              </Tab>

              <Tab
                paddingY={4}
                paddingX={3.5}
                lineHeight={5}
                fontWeight="bold"
                borderTopRadius={0}
                _focusVisible={{ boxShadow: "inline" }}
              >
                <CommentIcon fontSize="18px" marginEnd={1} aria-hidden="true" />
                <FormattedMessage id="generic.comments" defaultMessage="Comments" />
                {allFieldsUnreadCommentCount ? (
                  <Badge
                    marginStart={1}
                    background="primary.500"
                    color="white"
                    fontSize="xs"
                    borderRadius="full"
                    minW="18px"
                    minH="18px"
                    lineHeight="18px"
                    pointerEvents="none"
                    textAlign="center"
                  >
                    {allFieldsUnreadCommentCount < 100 ? allFieldsUnreadCommentCount : "99+"}
                  </Badge>
                ) : null}
              </Tab>
              <Tab
                paddingY={4}
                paddingX={3.5}
                lineHeight={5}
                fontWeight="bold"
                borderTopRadius={0}
                _focusVisible={{ boxShadow: "inline" }}
              >
                <SparklesIcon fontSize="18px" marginEnd={1} role="presentation" />
                <FormattedMessage id="page.replies.summary-header" defaultMessage="Mike AI" />
              </Tab>
            </TabList>
            <TabPanels {...extendFlexColumn}>
              <TabPanel {...extendFlexColumn} padding={0} overflow="auto" paddingBottom="64px">
                <HStack padding={4} paddingTop={3} paddingBottom={0} justify="space-between">
                  <Heading fontWeight={500} fontSize="xl">
                    <FormattedMessage
                      id="page.replies.list-of-contents"
                      defaultMessage="List of contents"
                    />
                  </Heading>
                  <PetitionRepliesFilterButton value={filter} onChange={setFilter} />
                </HStack>
                <PetitionRepliesContents
                  fieldsWithIndices={fieldsWithIndices}
                  filter={filter}
                  fieldLogic={fieldLogic}
                  onFieldClick={handlePetitionContentsFieldClick}
                  signatureStatus={
                    petition.isDocumentGenerationEnabled ? petitionSignatureStatus : undefined
                  }
                  signatureEnvironment={petitionSignatureEnvironment}
                  onSignatureStatusClick={handlePetitionContentsSignatureClick}
                  onVariablesClick={
                    petition.variables.length ? handlePetitionContentsVariablesClick : undefined
                  }
                />
              </TabPanel>
              <TabPanel {...extendFlexColumn} padding={0} overflow="auto" position="relative">
                {activeFieldId ? (
                  <PetitionRepliesFieldComments
                    key={activeFieldId}
                    petition={petition}
                    field={activeField}
                    isDisabled={petition.isAnonymized}
                    onClose={() => setActiveFieldId(null)}
                    onAddComment={handleAddComment}
                    onUpdateComment={handleUpdateComment}
                    onDeleteComment={handleDeleteComment}
                    onMarkAsUnread={handleMarkAsUnread}
                    onlyReadPermission={myEffectivePermission === "READ"}
                  />
                ) : (
                  <PetitionComments
                    petition={petition}
                    onSelectField={(fieldId: string) => setActiveFieldId(fieldId)}
                  />
                )}
              </TabPanel>
              <TabPanel {...extendFlexColumn} padding={0} overflow="auto" position="relative">
                <PetitionRepliesSummary petition={petition} user={me} onRefetch={refetch} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )
      }
    >
      <HStack
        paddingX={4}
        backgroundColor="white"
        height="53px"
        borderBottom="1px solid"
        borderBottomColor="gray.200"
      >
        <IconButtonWithTooltip
          display={{ base: "none", md: "inline" }}
          onClick={() => refetch()}
          icon={<RepeatIcon />}
          placement="bottom"
          variant="outline"
          label={intl.formatMessage({
            id: "generic.reload-data",
            defaultMessage: "Reload",
          })}
        />
        {petition.status === "CLOSED" ||
        petition.isAnonymized ||
        myEffectivePermission === "READ" ? null : (
          <Button
            data-action="close-petition"
            colorScheme="primary"
            leftIcon={<CheckIcon />}
            onClick={handleClosePetition}
          >
            <Text as="span" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              <FormattedMessage
                id="page.replies.finalize-petition-button"
                defaultMessage="Close parallel"
              />
            </Text>
          </Button>
        )}
        {me.hasProfilesAccess &&
        petition.status === "CLOSED" &&
        ((!petition.isAnonymized && myEffectivePermission !== "READ") ||
          petition.profiles.length > 0) ? (
          <ResponsiveButtonIcon
            colorScheme="primary"
            data-action="associate-profile"
            icon={<ProfilesIcon />}
            onClick={() => {
              if (hasLinkedToProfileTypeFields) {
                handleAssociateAndFillProfile();
              } else {
                handleAssociateProfile();
              }
            }}
            label={
              hasLinkedToProfileTypeFields
                ? intl.formatMessage(
                    {
                      id: "page.replies.associate-profile-button-linked-groups",
                      defaultMessage:
                        "Associate {total, plural, =1{profile} other{profiles}} {current}/{total}",
                    },
                    {
                      current: fieldGroupsWithProfileTypesLinked,
                      total: fieldGroupsWithProfileTypesTotal,
                    },
                  )
                : intl.formatMessage({
                    id: "page.replies.associate-profile-button",
                    defaultMessage: "Associate profile",
                  })
            }
          />
        ) : null}
        {showDownloadAll && !petition.isAnonymized ? (
          <ResponsiveButtonIcon
            icon={<DownloadIcon fontSize="lg" display="block" />}
            onClick={handleDownloadAllClick}
            label={intl.formatMessage({
              id: "page.replies.export-replies",
              defaultMessage: "Export replies",
            })}
          />
        ) : null}
        {petition.isDocumentGenerationEnabled && !petition.isAnonymized ? (
          <ResponsiveButtonIcon
            icon={<FilePdfIcon fontSize="lg" display="block" />}
            onClick={() => setTimeout(() => handlePrintPdfTask(petition.id), 100)}
            label={intl.formatMessage({
              id: "page.petition-replies.export-pdf",
              defaultMessage: "Export to PDF",
            })}
          />
        ) : null}
      </HStack>
      <Box flex={1} overflow="auto" minHeight={0}>
        <Box position="sticky" top={0} zIndex={2}>
          {displayPetitionLimitReachedAlert ? (
            <PetitionLimitReachedAlert limit={me.organization.petitionsPeriod?.limit ?? 0} />
          ) : null}
        </Box>
        <Box padding={4} zIndex={1}>
          {me.hasPetitionApprovalFlow && hasApprovals ? (
            <PetitionApprovalsCard
              petition={petition}
              user={me}
              onRefetchPetition={refetch}
              onToggleGeneralComments={handleToggleGeneralComments}
              isShowingGeneralComments={activeFieldId === GENERAL_COMMENTS_FIELD_ID}
              isDisabled={petition.isAnonymized || myEffectivePermission === "READ"}
            />
          ) : petition.isDocumentGenerationEnabled ? (
            <PetitionSignaturesCard
              ref={signaturesRef as any}
              id="signatures"
              petition={petition}
              user={me}
              layerStyle="highlightable"
              marginBottom={4}
              onRefetchPetition={refetch}
              onToggleGeneralComments={handleToggleGeneralComments}
              isShowingGeneralComments={activeFieldId === GENERAL_COMMENTS_FIELD_ID}
              isDisabled={petition.isAnonymized || myEffectivePermission === "READ"}
            />
          ) : null}
          {petition.variables.length ? (
            <PetitionVariablesCard
              ref={variablesRef as any}
              layerStyle="highlightable"
              marginBottom={8}
              petition={petition}
              finalVariables={fieldLogic[0].finalVariables}
            />
          ) : null}
          <Stack flex="2" spacing={4} data-section="replies-fields">
            <LiquidPetitionScopeProvider petition={petition}>
              {filterPetitionFields(fieldsWithIndices, fieldLogic, filter).map((x, index) =>
                x.type === "FIELD" ? (
                  <LiquidPetitionVariableProvider key={x.field.id} logic={x.fieldLogic}>
                    <PetitionRepliesField
                      ref={fieldRefs[x.field.id]}
                      id={`field-${x.field.id}`}
                      data-section="replies-field"
                      data-field-type={x.field.type}
                      petition={petition}
                      field={x.field}
                      childrenFieldIndices={x.childrenFieldIndices}
                      fieldIndex={x.fieldIndex}
                      onAction={handleAction}
                      isActive={activeFieldId === x.field.id}
                      onToggleComments={() => {
                        setQueryState({
                          comments: activeFieldId === x.field.id ? null : x.field.id,
                          profile: null,
                        });
                      }}
                      onUpdateReplyStatus={(fieldId, replyId, status) =>
                        handleUpdateRepliesStatus(fieldId, [replyId], status, x.field.id)
                      }
                      isDisabled={myEffectivePermission === "READ" || petition.status === "CLOSED"}
                      filter={filter}
                      fieldLogic={x.fieldLogic!}
                    />
                  </LiquidPetitionVariableProvider>
                ) : (
                  <PetitionRepliesFilteredFields key={index} count={x.count} />
                ),
              )}
            </LiquidPetitionScopeProvider>
          </Stack>
        </Box>
      </Box>
    </PetitionLayout>
  );
}

PetitionReplies.fragments = {
  get Petition() {
    return gql`
      fragment PetitionReplies_Petition on Petition {
        id
        isDocumentGenerationEnabled
        isReviewFlowEnabled
        unreadGeneralCommentCount
        accesses {
          id
          status
        }
        ...PetitionLayout_PetitionBase
        fields {
          id
          isReadOnly
          requireApproval
          unreadCommentCount
          commentCount
          ...PetitionRepliesField_PetitionField
          ...PetitionRepliesContents_PetitionField
          ...PetitionRepliesFieldComments_PetitionField

          isLinkedToProfileType
          isLinkedToProfileTypeField
          children {
            id
            isLinkedToProfileTypeField
          }
        }
        currentSignatureRequest {
          id
          status
        }
        myEffectivePermission {
          permissionType
        }
        isAnonymized
        profiles {
          id
          ...ProfileDrawer_Profile
        }
        variables {
          name
        }
        approvalFlowConfig {
          ...Fragments_FullApprovalFlowConfig
        }
        currentApprovalRequestSteps {
          id
          status
        }
        ...PetitionRepliesField_Petition
        ...PetitionVariablesCard_PetitionBase
        ...PetitionSignaturesCard_Petition
        ...getPetitionSignatureStatus_Petition
        ...getPetitionSignatureEnvironment_Petition
        ...useClosePetitionDialog_Petition
        ...useFieldLogic_PetitionBase
        ...LiquidPetitionScopeProvider_PetitionBase
        ...PetitionRepliesSummary_Petition
        ...PetitionRepliesFieldComments_PetitionBase
        ...useArchiveFieldGroupReplyIntoProfileDialog_Petition
        ...ProfileDrawer_PetitionBase
        ...ShareButton_PetitionBase
        ...ExportRepliesDialog_Petition
        ...useFieldsWithIndices_PetitionBase
        ...PetitionComments_PetitionBase
        ...PetitionApprovalsCard_Petition
      }
      ${Fragments.FullApprovalFlowConfig}
      ${PetitionLayout.fragments.PetitionBase}
      ${PetitionRepliesField.fragments.Petition}
      ${ShareButton.fragments.PetitionBase}
      ${PetitionSignaturesCard.fragments.Petition}
      ${getPetitionSignatureStatus.fragments.Petition}
      ${getPetitionSignatureEnvironment.fragments.Petition}
      ${useClosePetitionDialog.fragments.Petition}
      ${useFieldLogic.fragments.PetitionBase}
      ${LiquidPetitionScopeProvider.fragments.PetitionBase}
      ${ProfileDrawer.fragments.Profile}
      ${ProfileDrawer.fragments.PetitionBase}
      ${PetitionVariablesCard.fragments.PetitionBase}
      ${PetitionRepliesSummary.fragments.Petition}
      ${PetitionRepliesFieldComments.fragments.PetitionBase}
      ${useArchiveFieldGroupReplyIntoProfileDialog.fragments.Petition}
      ${ExportRepliesDialog.fragments.Petition}
      ${useFieldsWithIndices.fragments.PetitionBase}
      ${PetitionComments.fragments.PetitionBase}
      ${PetitionApprovalsCard.fragments.Petition}
    `;
  },
  get PetitionField() {
    return gql`
      fragment PetitionReplies_PetitionField on PetitionField {
        id
        isReadOnly
        requireApproval
        ...PetitionRepliesField_PetitionField
        ...PetitionRepliesContents_PetitionField
        ...PetitionRepliesFieldComments_PetitionField
        ...useFieldLogic_PetitionField
      }
      ${PetitionRepliesField.fragments.PetitionField}
      ${PetitionRepliesFieldComments.fragments.PetitionField}
      ${PetitionRepliesContents.fragments.PetitionField}
    `;
  },
};

const _mutations = [
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
          ...PetitionRepliesFieldReply_PetitionFieldReply
        }
        
      }
      ${PetitionRepliesFieldReply.fragments.PetitionFieldReply}
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
  gql`
    mutation PetitionReplies_associateProfileToPetition($petitionId: GID!, $profileId: GID!) {
      associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
        petition {
          id
          profiles {
            id
          }
        }
      }
    }
  `,
  gql`
    mutation PetitionReplies_cancelPetitionApprovalRequestFlow($petitionId: GID!) {
      cancelPetitionApprovalRequestFlow(petitionId: $petitionId) {
        id
        petition {
          id
          currentApprovalRequestSteps {
            id
            status
          }
        }
      }
    }
  `,
];

function useUpdatePetitionFieldRepliesStatus() {
  const [updatePetitionFieldRepliesStatus] = useMutation(
    PetitionReplies_updatePetitionFieldRepliesStatusDocument,
  );
  return useCallback(
    async (
      variables: VariablesOf<typeof PetitionReplies_updatePetitionFieldRepliesStatusDocument>,
    ) => await updatePetitionFieldRepliesStatus({ variables }),
    [updatePetitionFieldRepliesStatus],
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
          defaultMessage="There is an ongoing eSignature process. If you close this parallel now, the process will be cancelled."
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

function ConfirmCancelOngoingApprovals(props: DialogProps<{}, void>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-disable-ongoing-approvals.header"
          defaultMessage="Ongoing approvals"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-disable-ongoing-approvals-petition-close.body"
          defaultMessage="There is an ongoing approval process. If you close this parallel now, the process will be cancelled."
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-disable-ongoing-approvals-petition-close.confirm"
            defaultMessage="Cancel approvals and continue"
          />
        </Button>
      }
      {...props}
    />
  );
}

PetitionReplies.queries = [
  gql`
    query PetitionReplies_user {
      ...PetitionLayout_Query
      me {
        id
        organization {
          id
          name
          isPetitionUsageLimitReached: isUsageLimitReached(limitName: PETITION_SEND)
          petitionsPeriod: currentUsagePeriod(limitName: PETITION_SEND) {
            limit
          }
          fileExportIntegrations: integrations(offset: 0, limit: 10, type: FILE_EXPORT) {
            items {
              id
              type
              name
            }
          }
        }
        hasPetitionApprovalFlow: hasFeatureFlag(featureFlag: PETITION_APPROVAL_FLOW)
        hasProfilesAccess: hasFeatureFlag(featureFlag: PROFILES)
        ...ExportRepliesDialog_User
        ...PetitionSignaturesCard_User
        ...useUpdateIsReadNotification_User
        ...PetitionRepliesSummary_User
        ...PetitionApprovalsCard_User
      }
      metadata {
        country
        browserName
      }
    }
    ${PetitionLayout.fragments.Query}
    ${ExportRepliesDialog.fragments.User}
    ${PetitionSignaturesCard.fragments.User}
    ${useUpdateIsReadNotification.fragments.User}
    ${PetitionRepliesSummary.fragments.User}
    ${PetitionApprovalsCard.fragments.User}
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
  const {
    data: { metadata },
  } = await fetchQuery(PetitionReplies_userDocument);
  await fetchQuery(PetitionReplies_petitionDocument, {
    variables: {
      id: petitionId,
    },
  });

  return { petitionId, metadata };
};

export default compose(
  withPetitionLayoutContext,
  withDialogs,
  withMetadata,
  withApolloData,
)(PetitionReplies);
