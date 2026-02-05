import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Box, Button, Flex, HStack, Stack, useToast } from "@chakra-ui/react";
import { VariablesOf } from "@graphql-typed-document-node/core";
import {
  CheckIcon,
  DownloadIcon,
  FilePdfIcon,
  ProfilesIcon,
  RepeatIcon,
} from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { ProfileSelectInstance } from "@parallel/components/common/ProfileSelect";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { ShareButton } from "@parallel/components/common/ShareButton";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import {
  PetitionLayout,
  withPetitionLayoutContext,
} from "@parallel/components/layout/PetitionLayout";
import { useAssociateProfileToPetitionDialog } from "@parallel/components/petition-common/dialogs/AssociateProfileToPetitionDialog";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/dialogs/PetitionSharingDialog";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import { PetitionPermanentDeletionAlert } from "@parallel/components/petition-compose/PetitionPermanentDeletionAlert";
import { PetitionApprovalsCard } from "@parallel/components/petition-replies/PetitionApprovalsCard";
import {
  PetitionRepliesField,
  PetitionRepliesFieldProps,
} from "@parallel/components/petition-replies/PetitionRepliesField";
import { PetitionRepliesFieldComments } from "@parallel/components/petition-replies/PetitionRepliesFieldComments";
import { PetitionRepliesFilteredFields } from "@parallel/components/petition-replies/PetitionRepliesFilteredFields";
import { PetitionRepliesRightPaneTabs } from "@parallel/components/petition-replies/PetitionRepliesRightPaneTabs";
import { PetitionSignaturesCard } from "@parallel/components/petition-replies/PetitionSignaturesCard";
import { PetitionVariablesCard } from "@parallel/components/petition-replies/PetitionVariablesCard";
import { ProfileDrawer } from "@parallel/components/petition-replies/ProfileDrawer";
import { useArchiveRepliesIntoProfileDialog } from "@parallel/components/petition-replies/dialogs/ArchiveRepliesIntoProfileDialog";
import { useExportRepliesDialog } from "@parallel/components/petition-replies/dialogs/ExportRepliesDialog";
import { useExportRepliesProgressDialog } from "@parallel/components/petition-replies/dialogs/ExportRepliesProgressDialog";
import {
  AdverseMediaArticle,
  PetitionFieldReplyStatus,
  PetitionReplies_PetitionFragment,
  PetitionReplies_associateProfileToPetitionDocument,
  PetitionReplies_petitionDocument,
  PetitionReplies_updatePetitionFieldRepliesStatusDocument,
  PetitionReplies_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import {
  PetitionFieldFilter,
  defaultFieldsFilter,
  filterPetitionFields,
} from "@parallel/utils/filterPetitionFields";
import {
  countLinkedRows,
  countTotalRows,
  groupFieldsWithProfileTypes,
} from "@parallel/utils/groupFieldsWithProfileTypes";
import { useClosePetition } from "@parallel/utils/hooks/useClosePetition";
import { useManagedWindow } from "@parallel/utils/hooks/useManagedWindow";
import { LiquidPetitionScopeProvider } from "@parallel/utils/liquid/LiquidPetitionScopeProvider";
import { LiquidPetitionVariableProvider } from "@parallel/utils/liquid/LiquidPetitionVariableProvider";
import {
  useCreatePetitionComment,
  useDeletePetitionComment,
  useUpdatePetitionComment,
} from "@parallel/utils/mutations/comments";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { string, useQueryState, useQueryStateSlice } from "@parallel/utils/queryState";
import { useExportRepliesTask } from "@parallel/utils/tasks/useExportRepliesTask";
import { useFileExportTask } from "@parallel/utils/tasks/useFileExportTask";
import { usePrintPdfTask } from "@parallel/utils/tasks/usePrintPdfTask";
import { UnwrapPromise } from "@parallel/utils/types";
import { useDownloadReplyFile } from "@parallel/utils/useDownloadReplyFile";
import { useHasRemovePreviewFiles } from "@parallel/utils/useHasRemovePreviewFiles";
import { useHighlightElement } from "@parallel/utils/useHighlightElement";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { usePetitionEventsPolling } from "@parallel/utils/usePetitionEventsPolling";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, zip } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { Text } from "@parallel/components/ui";
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

  usePetitionEventsPolling(petitionId, () => {
    refetch();
  });

  const updateIsReadNotification = useUpdateIsReadNotification();
  useEffect(() => {
    updateIsReadNotification({ isRead: true, petitionIds: [petitionId] });
  }, [petitionId]);

  const petition = data!.petition as PetitionReplies_PetitionFragment;

  const allFields = useMemo(
    () => petition.fields.flatMap((f) => [f, ...(f.children ?? [])]),
    [petition.fields],
  );

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

  const activeField = activeFieldId ? petition.fields.find((f) => f.id === activeFieldId) : null;
  const fieldRefs = useMultipleRefs<HTMLElement>();
  const signaturesRef = useRef<HTMLElement>(null);
  const variablesRef = useRef<HTMLElement>(null);
  const associateProfileButtonRef = useRef<HTMLButtonElement>(null);
  const exportRepliesButtonRef = useRef<HTMLButtonElement>(null);
  const exportPdfButtonRef = useRef<HTMLButtonElement>(null);

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

  const { handleClosePetition } = useClosePetition({ onRefetch: () => refetch() });

  const { openWindow } = useManagedWindow({
    onRefreshField: refetch,
  });

  const handleAction: PetitionRepliesFieldProps["onAction"] = async function (action, reply) {
    const petitionStatus = petition.__typename === "Petition" && petition.status;
    const isReadOnly =
      petition.isAnonymized || reply.status === "APPROVED" || petitionStatus === "CLOSED";

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
      case "VIEW_DETAILS":
      case "VIEW_RESULTS":
        const parentReplyId = reply.parent?.id;
        const { name, date, type, country, birthCountry } = reply.content?.query ?? {};
        const tokenBase64 = btoa(
          JSON.stringify({
            fieldId: reply.field!.id,
            petitionId: petition.id,
            ...(parentReplyId ? { parentReplyId } : {}),
          }),
        );

        let url = `/${intl.locale}/app/background-check/`;

        if (action === "VIEW_RESULTS") {
          url += `/results`;
        } else {
          url += `/${reply.content?.entity?.id}`;
        }
        const urlParams = new URLSearchParams({
          token: tokenBase64,
          ...(name ? { name } : {}),
          ...(date ? { date } : {}),
          ...(type ? { type } : {}),
          ...(country ? { country } : {}),
          ...(birthCountry ? { birthCountry } : {}),
          ...(isReadOnly ? { readonly: "true" } : {}),
        });
        try {
          await openWindow(`${url}?${urlParams.toString()}`);
        } catch {}
        break;
      case "VIEW_ARTICLES": {
        let name: string | undefined = undefined;
        let encodedEntity: string | undefined = undefined;
        const parentReplyId = reply.parent?.id;

        const petitionField = allFields.find((f) => f.id === reply.field!.id);
        const options = petitionField!.options as FieldOptions["ADVERSE_MEDIA_SEARCH"];
        const visibleFields = zip(petition.fields, fieldLogic)
          .filter(([_, { isVisible }]) => isVisible)
          .map(([field, { groupChildrenLogic }]) => {
            if (field.type === "FIELD_GROUP") {
              return {
                ...field,
                replies: field.replies.map((r, groupIndex) => ({
                  ...r,
                  children: r.children?.filter(
                    (_, childReplyIndex) =>
                      groupChildrenLogic?.[groupIndex][childReplyIndex].isVisible ?? false,
                  ),
                })),
              };
            } else {
              return field;
            }
          });

        if (isNonNullish(options.autoSearchConfig)) {
          const fields = parentReplyId
            ? visibleFields.flatMap((f) => [f, ...(f.children ?? [])])
            : visibleFields;

          name = options
            .autoSearchConfig!.name?.map((id) => {
              const field = fields.find((f) => f.id === id);
              if (field) {
                const replies = field.replies;
                return field.parent && parentReplyId
                  ? replies.find((r) => r?.parent?.id === parentReplyId)?.content.value
                  : replies[0]?.content.value;
              }
              return null;
            })
            .filter(isNonNullish)
            .join(" ")
            .trim();

          const entity = fields.find((f) => f.id === options.autoSearchConfig!.backgroundCheck)
            ?.replies[0]?.content.entity;

          if (entity) {
            encodedEntity = btoa(
              JSON.stringify({
                id: entity.id,
                name: entity.name,
              }),
            );
          }
        }

        const adverseMediaTokenBase64 = btoa(
          JSON.stringify({
            fieldId: reply.field!.id,
            petitionId: petition.id,
            ...(parentReplyId ? { parentReplyId } : {}),
          }),
        );
        const adverseMediaUrl = `/${intl.locale}/app/adverse-media`;

        const adverseMediaUrlParams = new URLSearchParams({
          token: adverseMediaTokenBase64,
          defaultTabIndex:
            reply.content?.articles?.items.filter(
              (article: AdverseMediaArticle) => article.classification === "RELEVANT",
            ).length > 0
              ? "1"
              : "0",
          hasReply: "true",
          ...(name ? { name } : {}),
          ...(encodedEntity ? { entity: encodedEntity } : {}),
          ...(isReadOnly ? { readonly: "true" } : {}),
        });
        try {
          await openWindow(`${adverseMediaUrl}?${adverseMediaUrlParams.toString()}`);
        } catch {}
        break;
      }
    }
  };
  const showExportRepliesDialog = useExportRepliesDialog();
  const showExportRepliesProgressDialog = useExportRepliesProgressDialog();
  const handleExportRepliesTask = useExportRepliesTask();
  const handleFileExportTask = useFileExportTask();

  const handleDownloadAllClick = useCallback(async () => {
    try {
      const res = await showExportRepliesDialog({
        petitionId,
        modalProps: {
          finalFocusRef: exportRepliesButtonRef,
        },
      });

      if (res.type === "DOWNLOAD_ZIP") {
        handleExportRepliesTask(petition.id, res.pattern);
      } else if (res.type === "EXPORT_CUATRECASAS") {
        const { pattern, externalClientId } = res;
        await showExportRepliesProgressDialog({
          petitionId: petition.id,
          pattern,
          externalClientId,
          modalProps: {
            finalFocusRef: exportPdfButtonRef,
          },
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

  const hasLinkedToProfileTypeFields = allFields.some((f) => f.isLinkedToProfileTypeField);

  // Get filtered fields without grouping to maintain original count
  const repliesFieldGroupsWithProfileTypes = zip(petition.fields, fieldLogic)
    .filter(
      ([field, { isVisible }]) =>
        isVisible &&
        field.type === "FIELD_GROUP" &&
        field.isLinkedToProfileType &&
        field.replies.length > 0,
    )
    .map(([field]) => field);

  // Use helper to get grouped fields (array of arrays)
  const groupedFields = groupFieldsWithProfileTypes(repliesFieldGroupsWithProfileTypes);

  // Count using helper utilities
  const fieldGroupsWithProfileTypesTotal = countTotalRows(groupedFields);
  const fieldGroupsWithProfileTypesLinked = countLinkedRows(groupedFields);

  const showArchiveRepliesIntoProfileDialog = useArchiveRepliesIntoProfileDialog();
  const handleAssociateAndFillProfile = async () => {
    try {
      await showArchiveRepliesIntoProfileDialog({
        petitionId: petition.id,
        onRefetch: () => refetch(),
        modalProps: {
          finalFocusRef: associateProfileButtonRef,
        },
      });
    } catch {}
  };

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

  const displayPetitionLimitReachedAlert =
    me.organization.isPetitionUsageLimitReached &&
    petition.__typename === "Petition" &&
    petition.status === "DRAFT";

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

  const hasApprovals = petition.approvalFlowConfig && petition.approvalFlowConfig.length > 0;

  const isAnonymizedOrDeletionScheduled =
    petition.isAnonymized || isNonNullish(petition.permanentDeletionAt);

  return (
    <PetitionLayout
      key={petition.id}
      queryObject={queryObject}
      petition={petition}
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
            isReadOnly={isAnonymizedOrDeletionScheduled}
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
        <>
          <Flex
            display={{ base: "flex", lg: "none" }}
            flex="1"
            overflow="hidden"
            flexDirection="column"
          >
            {(activeFieldId && !!activeField) || activeFieldId === GENERAL_COMMENTS_FIELD_ID ? (
              <PetitionRepliesFieldComments
                key={activeFieldId}
                petition={petition}
                field={activeField}
                isDisabled={isAnonymizedOrDeletionScheduled}
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
            <PetitionRepliesRightPaneTabs
              me={me}
              petition={petition}
              fieldLogic={fieldLogic}
              onPetitionContentsFieldClick={handlePetitionContentsFieldClick}
              onAddComment={handleAddComment}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
              onMarkAsUnread={handleMarkAsUnread}
              activeFieldId={activeFieldId}
              filter={filter}
              setFilter={setFilter}
              setActiveFieldId={setActiveFieldId}
              onSignatureStatusClick={handlePetitionContentsSignatureClick}
              onVariablesClick={handlePetitionContentsVariablesClick}
              onRefetch={() => {
                refetch();
              }}
              isDisabled={isAnonymizedOrDeletionScheduled}
            />
          </Flex>
        </>
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
          isDisabled={isAnonymizedOrDeletionScheduled}
        />

        {petition.status === "CLOSED" ||
        myEffectivePermission === "READ" ||
        isAnonymizedOrDeletionScheduled ? null : (
          <Button
            data-action="close-petition"
            colorScheme="primary"
            leftIcon={<CheckIcon />}
            onClick={() => handleClosePetition(petition)}
          >
            <Text as="span" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              <FormattedMessage id="generic.close-petition" defaultMessage="Close parallel" />
            </Text>
          </Button>
        )}

        {me.hasProfilesAccess &&
        petition.status === "CLOSED" &&
        ((!petition.isAnonymized && myEffectivePermission !== "READ") ||
          petition.profiles.length > 0) ? (
          <ResponsiveButtonIcon
            ref={associateProfileButtonRef}
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
        {showDownloadAll && !isAnonymizedOrDeletionScheduled ? (
          <ResponsiveButtonIcon
            ref={exportRepliesButtonRef}
            icon={<DownloadIcon fontSize="lg" display="block" />}
            onClick={handleDownloadAllClick}
            label={intl.formatMessage({
              id: "page.replies.export-replies",
              defaultMessage: "Export replies",
            })}
          />
        ) : null}
        {petition.isDocumentGenerationEnabled && !isAnonymizedOrDeletionScheduled ? (
          <ResponsiveButtonIcon
            ref={exportPdfButtonRef}
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
          {isNonNullish(petition.permanentDeletionAt) ? (
            <PetitionPermanentDeletionAlert date={petition.permanentDeletionAt} />
          ) : displayPetitionLimitReachedAlert ? (
            <PetitionLimitReachedAlert limit={me.organization.petitionsPeriod?.limit ?? 0} />
          ) : null}
        </Box>
        <Box padding={4} zIndex={1}>
          {me.hasPetitionApprovalFlow && hasApprovals ? (
            <PetitionApprovalsCard
              ref={signaturesRef as any}
              petition={petition}
              user={me}
              onRefetchPetition={refetch}
              onToggleGeneralComments={handleToggleGeneralComments}
              isShowingGeneralComments={activeFieldId === GENERAL_COMMENTS_FIELD_ID}
              isDisabled={isAnonymizedOrDeletionScheduled}
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
              isDisabled={isAnonymizedOrDeletionScheduled || myEffectivePermission === "READ"}
            />
          ) : null}
          {petition.variables.some((v) => v.showInReplies) ? (
            <PetitionVariablesCard
              ref={variablesRef as any}
              layerStyle="highlightable"
              marginBottom={8}
              petition={petition}
              finalVariables={fieldLogic[0].finalVariables}
            />
          ) : null}
          <Stack flex="2" spacing={4} data-section="replies-fields">
            <ToneProvider value={petition.organization.brandTheme.preferredTone}>
              <LiquidPetitionScopeProvider petition={petition}>
                {filterPetitionFields(fieldsWithIndices, fieldLogic, filter).map((x, index) =>
                  x.type === "FIELD" ? (
                    <LiquidPetitionVariableProvider
                      key={x.field.id}
                      logic={x.fieldLogic}
                      variables={petition.variables}
                    >
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
                        isDisabled={
                          myEffectivePermission === "READ" ||
                          petition.status === "CLOSED" ||
                          isNonNullish(petition.permanentDeletionAt)
                        }
                        filter={filter}
                        fieldLogic={x.fieldLogic!}
                      />
                    </LiquidPetitionVariableProvider>
                  ) : (
                    <PetitionRepliesFilteredFields key={index} count={x.count} />
                  ),
                )}
              </LiquidPetitionScopeProvider>
            </ToneProvider>
          </Stack>
        </Box>
      </Box>
    </PetitionLayout>
  );
}

const _fragments = {
  Petition: gql`
    fragment PetitionReplies_Petition on Petition {
      id
      isDocumentGenerationEnabled
      organization {
        id
        brandTheme {
          preferredTone
        }
      }
      fields {
        id
        isLinkedToProfileType
        ...PetitionReplies_PetitionField
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
        showInReplies
        ...LiquidPetitionVariableProvider_PetitionVariable
      }
      approvalFlowConfig {
        ...Fragments_FullApprovalFlowConfig
      }
      permanentDeletionAt
      ...PetitionLayout_PetitionBase
      ...PetitionRepliesField_Petition
      ...PetitionVariablesCard_PetitionBase
      ...PetitionSignaturesCard_Petition
      ...useFieldLogic_PetitionBase
      ...LiquidPetitionScopeProvider_PetitionBase
      ...PetitionRepliesFieldComments_PetitionBase
      ...ProfileDrawer_PetitionBase
      ...ShareButton_PetitionBase
      ...useFieldsWithIndices_PetitionBase
      ...PetitionApprovalsCard_Petition
      ...useClosePetition_PetitionBase
      ...PetitionRepliesRightPaneTabs_Petition
    }
  `,
  PetitionField: gql`
    fragment PetitionReplies_PetitionField on PetitionField {
      id
      isReadOnly
      commentCount
      options
      isLinkedToProfileType
      isLinkedToProfileTypeField
      children {
        id
        isLinkedToProfileTypeField
      }
      replies {
        associatedProfile {
          id
        }
      }
      ...PetitionRepliesField_PetitionField
      ...PetitionRepliesFieldComments_PetitionField
      ...groupFieldsWithProfileTypes_PetitionField
    }
  `,
};

const _mutations = [
  gql`
    mutation PetitionReplies_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionLayout_PetitionBase
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
          ...PetitionRepliesFieldReply_PetitionFieldReply
        }
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

PetitionReplies.queries = [
  gql`
    query PetitionReplies_user {
      ...PetitionLayout_Query
      me {
        id
        organization {
          id
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
        ...PetitionSignaturesCard_User
        ...useUpdateIsReadNotification_User
        ...PetitionApprovalsCard_User
        ...PetitionRepliesRightPaneTabs_User
      }
    }
  `,
  gql`
    query PetitionReplies_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionReplies_Petition
      }
    }
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

export default compose(withPetitionLayoutContext, withDialogs, withApolloData)(PetitionReplies);
