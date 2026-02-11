import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { getOperationName } from "@apollo/client/utilities/internal";
import {
  Badge,
  Box,
  Center,
  Flex,
  Grid,
  GridItem,
  HStack,
  List,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Stack,
  useToast,
} from "@chakra-ui/react";
import {
  ArchiveIcon,
  ArrowDiagonalRightIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  FolderIcon,
  ImportIcon,
  LockClosedIcon,
  ProfilesIcon,
  TableIcon,
  TagIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import {
  usePetitionShouldConfirmNavigation,
  usePetitionState,
} from "@parallel/components/layout/PetitionLayout";
import { Button, Text } from "@parallel/components/ui";
import {
  PetitionActivity_petitionDocument,
  PetitionHeader_PetitionBaseFragment,
  PetitionHeader_QueryFragment,
  PetitionHeader_reopenPetitionDocument,
  PetitionHeader_updatePetitionPermissionSubscriptionDocument,
  PetitionsHeader_associateProfileToPetitionDocument,
  PetitionsHeader_movePetitionDocument,
} from "@parallel/graphql/__types";
import { assertTypename } from "@parallel/utils/apollo/typename";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useUpdatePetitionName } from "@parallel/utils/hooks/useUpdatePetitionName";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { useRecoverPetition } from "@parallel/utils/mutations/useRecoverPetition";
import { usePrintPdfTask } from "@parallel/utils/tasks/usePrintPdfTask";
import { useTemplateRepliesReportTask } from "@parallel/utils/tasks/useTemplateRepliesReportTask";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useRouter } from "next/router";
import { ReactNode, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { ButtonWithMoreOptions } from "../common/ButtonWithMoreOptions";
import { Divider } from "../common/Divider";
import { MoreOptionsMenuButton } from "../common/MoreOptionsMenuButton";
import { PathName } from "../common/PathName";
import { PetitionStatusLabel } from "../common/PetitionStatusLabel";
import { RestrictedFeaturePopover } from "../common/RestrictedFeaturePopover";
import { SmallPopover } from "../common/SmallPopover";
import { Tag } from "../common/Tag";
import { isDialogError } from "../common/dialogs/DialogProvider";
import { useAssociateProfileToPetitionDialog } from "../petition-common/dialogs/AssociateProfileToPetitionDialog";
import { useEditTagsDialog } from "../petition-common/dialogs/EditTagsDialog";
import { useImportRepliesDialog } from "../petition-common/dialogs/ImportRepliesDialog";
import { useMoveToFolderDialog } from "../petition-common/dialogs/MoveToFolderDialog";
import { usePetitionSharingDialog } from "../petition-common/dialogs/PetitionSharingDialog";
import { useConfirmReopenPetitionDialog } from "../petition-replies/dialogs/ConfirmReopenPetitionDialog";
import { HeaderNameEditable, HeaderNameEditableInstance } from "./HeaderNameEditable";
import { PetitionHeaderTab } from "./PetitionHeaderTab";
import { PetitionSection } from "./PetitionLayout";

export interface PetitionHeaderProps extends PetitionHeader_QueryFragment {
  petition: PetitionHeader_PetitionBaseFragment;
  section: PetitionSection;
  actions?: ReactNode;
  onRefetch?: () => void;
}

export interface PetitionHeaderInstance {
  focusName(): void;
}

export const PetitionHeader = chakraComponent<"div", PetitionHeaderProps, PetitionHeaderInstance>(
  function PetitionHeader({ ref, petition, me, section: current, actions, onRefetch, ...props }) {
    const intl = useIntl();
    const router = useRouter();
    const toast = useToast();
    const [state] = usePetitionState();
    const [shouldConfirmNavigation, setShouldConfirmNavigation] =
      usePetitionShouldConfirmNavigation();
    const userCanDownloadResults = useHasPermission("REPORTS:TEMPLATE_REPLIES");
    const userCanChangePath = useHasPermission("PETITIONS:CHANGE_PATH");
    const userCanCreateTemplate = useHasPermission("PETITIONS:CREATE_TEMPLATES");
    const userCanCreatePetition = useHasPermission("PETITIONS:CREATE_PETITIONS");

    const isPetition = petition.__typename === "Petition";

    const status = petition.__typename === "Petition" ? petition.status : "DRAFT";
    const isAnonymized = petition.__typename === "Petition" ? petition.isAnonymized : false;
    const isSubscribed =
      petition.__typename === "Petition" ? petition.myEffectivePermission!.isSubscribed : false;
    const myEffectivePermission = petition.myEffectivePermission!;

    const moreOptionsRef = useRef<HTMLButtonElement>(null);

    const updatePetitionName = useUpdatePetitionName();

    const deletePetitions = useDeletePetitions();
    const handleDeleteClick = async function (deletePermanently: boolean) {
      try {
        setShouldConfirmNavigation(false);
        await deletePetitions(
          [petition],
          petition.__typename === "Petition" ? "PETITION" : "TEMPLATE",
          undefined,
          undefined,
          deletePermanently,
        );
        router.push("/app/petitions/");
      } catch {}
    };

    const clonePetitions = useClonePetitions();
    const goToPetition = useGoToPetition();
    const handleCloneClick = async function () {
      try {
        const [petitionId] = await clonePetitions({
          petitionIds: [petition.id],
        });
        goToPetition(petitionId, "compose", { query: { new: "" } });
      } catch {}
    };

    const createPetition = useCreatePetition();
    const handleSaveAsTemplate = async function () {
      try {
        const templateId = await createPetition({
          petitionId: petition.id,
          type: "TEMPLATE",
        });
        if (templateId) {
          goToPetition(templateId, "compose", { query: { new: "" } });
        }
      } catch {}
    };

    const handleUseTemplate = async function () {
      try {
        const petitionId = await createPetition({
          petitionId: petition.id,
        });
        if (petitionId) {
          goToPetition(petitionId, "preview", {
            query: { new: "", fromTemplate: "" },
          });
        }
      } catch {}
    };

    const [updatePetitionPermissionSubscription] = useMutation(
      PetitionHeader_updatePetitionPermissionSubscriptionDocument,
    );
    const handleUpdatePetitionPermissionSubscription = async function (isSubscribed: boolean) {
      await updatePetitionPermissionSubscription({
        variables: {
          petitionId: petition.id,
          isSubscribed,
        },
      });
    };

    const showPetitionSharingDialog = usePetitionSharingDialog();
    const handlePetitionSharingClick = async function () {
      try {
        const res = await showPetitionSharingDialog({
          userId: me.id,
          petitionIds: [petition.id],
          type: isPetition ? "PETITION" : "TEMPLATE",
          modalProps: { finalFocusRef: moreOptionsRef },
        });
        if (res?.close) {
          router.push(isPetition ? "/app/petitions" : "/app/petitions/new");
        }
      } catch {}
    };

    const [movePetition] = useMutation(PetitionsHeader_movePetitionDocument);
    const showMoveFolderDialog = useMoveToFolderDialog();
    const handleMovePetition = async (fromMenu?: boolean) => {
      try {
        const destination = await showMoveFolderDialog({
          type: isPetition ? "PETITION" : "TEMPLATE",
          currentPath: petition.path,
          modalProps: fromMenu ? { finalFocusRef: moreOptionsRef } : undefined,
        });
        await movePetition({
          variables: {
            id: petition.id,
            source: petition.path,
            type: isPetition ? "PETITION" : "TEMPLATE",
            destination,
          },
        });
        onRefetch?.();
      } catch {}
    };

    const sections = useMemo(
      () =>
        petition.__typename === "Petition"
          ? [
              {
                rightIcon: petition.isRestricted ? (
                  <SmallPopover
                    content={
                      <Text fontSize="sm">
                        <FormattedMessage
                          id="component.petition-header.compose-tab-readonly"
                          defaultMessage="Edition restricted. To make changes, you can disable the protection on the Settings tab."
                        />
                      </Text>
                    }
                  >
                    <LockClosedIcon color="gray.600" _hover={{ color: "gray.700" }} />
                  </SmallPopover>
                ) : undefined,
                section: "compose",
                label: intl.formatMessage({
                  id: "component.petition-header.compose-tab",
                  defaultMessage: "Compose",
                }),
                attributes: {
                  "data-action": "petition-compose",
                  "data-testid": "petition-section-compose",
                },
              },
              {
                section: "preview",
                label: intl.formatMessage({
                  id: "component.petition-header.input-tab",
                  defaultMessage: "Input",
                }),
                attributes: {
                  "data-action": "petition-preview",
                  "data-testid": "petition-section-preview",
                },
              },
              {
                section: "replies",
                label: intl.formatMessage({
                  id: "component.petition-header.replies-tab",
                  defaultMessage: "Review",
                }),
                attributes: {
                  "data-action": "petition-replies",
                  "data-testid": "petition-section-replies",
                },
              },
              {
                section: "activity",
                label: intl.formatMessage({
                  id: "component.petition-header.activity-tab",
                  defaultMessage: "Activity",
                }),
                attributes: {
                  "data-action": "petition-activity",
                  "data-testid": "petition-section-activity",
                },
              },
            ]
          : [
              {
                rightIcon: petition.isRestricted ? <EditionRestrictedPopover /> : undefined,
                section: "compose",
                label: intl.formatMessage({
                  id: "component.petition-header.compose-tab",
                  defaultMessage: "Compose",
                }),
                attributes: {
                  "data-action": "template-compose",
                  "data-testid": "petition-section-compose",
                },
              },
              petition.isInteractionWithRecipientsEnabled
                ? {
                    rightIcon: petition.isRestricted ? <EditionRestrictedPopover /> : undefined,
                    section: "messages",
                    label: intl.formatMessage({
                      id: "component.petition-header.messages-tab",
                      defaultMessage: "Messages",
                    }),
                    attributes: {
                      "data-action": "template-messages",
                      "data-testid": "petition-section-messages",
                    },
                  }
                : null,
              {
                section: "preview",
                label: intl.formatMessage({
                  id: "component.petition-header.preview-tab",
                  defaultMessage: "Preview",
                }),
                attributes: {
                  "data-action": "template-preview",
                  "data-testid": "petition-section-preview",
                },
              },
            ].filter(isNonNullish),
      [status, petition.isRestricted, petition.isInteractionWithRecipientsEnabled, intl.locale],
    );

    const [reopenPetition] = useMutation(PetitionHeader_reopenPetitionDocument);
    const confirmReopenPetitionDialog = useConfirmReopenPetitionDialog();

    const handleReopenPetition = useCallback(async () => {
      try {
        await confirmReopenPetitionDialog({ modalProps: { finalFocusRef: moreOptionsRef } });
        await reopenPetition({
          variables: {
            petitionId: petition.id,
          },
          refetchQueries: [getOperationName(PetitionActivity_petitionDocument)!],
        });
      } catch {}
    }, [petition.id]);

    const handlePrintPdfTask = usePrintPdfTask();

    const handleTemplateRepliesReportTask = useTemplateRepliesReportTask();

    const editableRef = useRef<HeaderNameEditableInstance>(null);
    useImperativeHandle(ref, () => ({ focusName: () => editableRef.current?.focus() }));

    const showErrorToast = useGenericErrorToast(
      intl.formatMessage({
        id: "component.petition-header.import-replies-error",
        defaultMessage: "Failed to import data",
      }),
    );

    const showImportRepliesDialog = useImportRepliesDialog();
    const handleImportRepliesClick = async () => {
      try {
        await showImportRepliesDialog({
          petitionId: petition.id,
          modalProps: { finalFocusRef: moreOptionsRef },
        });
        onRefetch?.();
        toast({
          title: intl.formatMessage({
            id: "component.petition-header.import-replies-success-title",
            defaultMessage: "Replies successfully imported",
          }),
          status: "success",
          isClosable: true,
        });
      } catch (error) {
        if (isDialogError(error)) {
          return;
        } else {
          showErrorToast(error);
        }
      }
    };

    const [associateProfileToPetition] = useMutation(
      PetitionsHeader_associateProfileToPetitionDocument,
    );
    const showAssociateProfileToPetitionDialog = useAssociateProfileToPetitionDialog();
    const handleProfilesClick = async (forceAssociateNewProfile?: boolean, fromMenu?: boolean) => {
      assertTypename(petition, "Petition");
      try {
        if (forceAssociateNewProfile) {
          const profileId = await showAssociateProfileToPetitionDialog({
            excludeProfiles: petition.profiles.map((p) => p.id),
            modalProps: fromMenu ? { finalFocusRef: moreOptionsRef } : undefined,
          });

          await associateProfileToPetition({
            variables: { petitionId: petition.id, profileId },
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
          goToPetition(petition.id, "replies", {
            query: { profile: profileId },
          });
        } else {
          goToPetition(petition.id, "replies", {
            query: petition.profiles.length > 0 ? { profile: petition.profiles.at(-1)!.id } : {},
          });
        }
      } catch {}
    };

    const showEditTagsDialog = useEditTagsDialog();

    const handleEditTags = async () => {
      try {
        await showEditTagsDialog({
          petitionId: petition.id,
        });
      } catch {}
    };

    const recoverPetition = useRecoverPetition();
    const handleRecoverClick = useCallback(async () => {
      try {
        const needRefetch = await recoverPetition(
          [petition],
          petition.__typename === "Petition" ? "PETITION" : "TEMPLATE",
        );
        if (needRefetch) {
          onRefetch?.();
        }
      } catch {}
    }, []);

    return (
      <Grid
        backgroundColor="white"
        borderBottom="1px solid"
        borderBottomColor="gray.200"
        position="relative"
        paddingX={4}
        gridTemplateColumns={{ base: "1fr min-content", lg: "1fr min-content 1fr" }}
        gridTemplateRows={{ base: "4rem 2.5rem", lg: "4rem" }}
        gridTemplateAreas={{ base: '"a b" "c c"', lg: '"a c b"' }}
        sx={{
          "@media print": {
            gridTemplateRows: "auto auto !important",
          },
        }}
        {...props}
      >
        <GridItem area="a" as={Flex} flexDirection="column" justifyContent="center" minWidth={0}>
          <Flex>
            <HeaderNameEditable
              ref={editableRef}
              flex="1"
              paddingEnd={4}
              petition={petition}
              state={state}
              onNameChange={(name) => updatePetitionName(petition.id, name)}
              isDisabled={isNonNullish(petition.permanentDeletionAt)}
            />
          </Flex>
          <HStack spacing={1}>
            {petition.__typename === "Petition" ? (
              <Center
                data-testid="petition-status"
                data-section="petition-status-icon"
                data-status={status}
                paddingX={1}
              >
                <PetitionStatusLabel status={status} />
              </Center>
            ) : (
              <Badge colorScheme="primary" marginEnd={2}>
                <FormattedMessage id="generic.template" defaultMessage="Template" />
              </Badge>
            )}

            <Divider isVertical height={3.5} color="gray.500" />
            <PathName
              type={isPetition ? "PETITION" : "TEMPLATE"}
              path={petition.path}
              minWidth={0}
              display="flex"
              render={({ children, ...props }) => (
                <>
                  {!userCanChangePath ||
                  myEffectivePermission.permissionType === "READ" ||
                  isNonNullish(petition.permanentDeletionAt) ? (
                    <HStack minWidth={0} paddingX={1.5} color="gray.600" fontSize="sm" {...props}>
                      <FolderIcon boxSize={4} />
                      <Box whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">
                        {children}
                      </Box>
                    </HStack>
                  ) : (
                    <Button
                      leftIcon={<FolderIcon boxSize={4} />}
                      color="gray.600"
                      size="xs"
                      variant="ghost"
                      paddingX={1.5}
                      fontSize="sm"
                      fontWeight="normal"
                      onClick={handleMovePetition}
                      {...props}
                    >
                      <Box whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">
                        {children}
                      </Box>
                    </Button>
                  )}
                </>
              )}
            />

            {me.hasProfilesAccess &&
            petition.__typename === "Petition" &&
            ((!petition.isAnonymized && myEffectivePermission.permissionType !== "READ") ||
              petition.profiles.length > 0) ? (
              <>
                <Divider isVertical height={3.5} color="gray.500" />
                <Button
                  leftIcon={<ProfilesIcon boxSize={4} />}
                  color="gray.600"
                  size="xs"
                  variant="ghost"
                  paddingX={1.5}
                  fontSize="sm"
                  fontWeight="normal"
                  onClick={() =>
                    handleProfilesClick(
                      petition.profiles.length === 0 &&
                        myEffectivePermission.permissionType !== "READ",
                    )
                  }
                  disabled={isAnonymized || isNonNullish(petition.permanentDeletionAt)}
                >
                  <Box whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">
                    <FormattedMessage
                      id="component.petition-header.x-profiles"
                      defaultMessage="{count, plural, =1 {# profile} other {# profiles}}"
                      values={{
                        count: petition.profiles.length,
                      }}
                    />
                  </Box>
                </Button>
              </>
            ) : null}
            <Divider isVertical height={3.5} color="gray.500" />
            <SmallPopover
              width="auto"
              content={
                petition.tags.length ? (
                  <Stack alignItems="flex-start" maxWidth="300px">
                    {petition.tags.map((tag) => (
                      <Tag key={tag.id} tag={tag} maxWidth="100%" />
                    ))}
                  </Stack>
                ) : (
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.petition-header.add-tags"
                      defaultMessage="Add tags"
                    />
                  </Text>
                )
              }
            >
              <Button
                leftIcon={<TagIcon boxSize={4} />}
                color="gray.600"
                size="xs"
                variant="ghost"
                paddingX={1.5}
                fontSize="sm"
                fontWeight="normal"
                onClick={handleEditTags}
                disabled={isAnonymized || isNonNullish(petition.permanentDeletionAt)}
              >
                <Box whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">
                  <FormattedMessage
                    id="component.petition-header.x-tags"
                    defaultMessage="{count, plural, =1 {# tag} other {# tags}}"
                    values={{
                      count: petition.tags.length,
                    }}
                  />
                </Box>
              </Button>
            </SmallPopover>
          </HStack>
        </GridItem>
        <GridItem area="c" as={List} display="flex" alignItems="stretch" justifyContent="center">
          {sections.map(({ section, label, rightIcon, attributes }) => {
            let href = `/app/petitions/${petition.id}/${section}`;

            if (isNonNullish(router.query.fromTemplate) || shouldConfirmNavigation) {
              href += `?${new URLSearchParams({
                ...(isNonNullish(router.query.fromTemplate) ? { fromTemplate: "" } : {}),
                ...(shouldConfirmNavigation ? { new: "" } : {}),
              })}`;
            }

            return (
              <PetitionHeaderTab
                key={section}
                href={href}
                isActive={current === section}
                rightIcon={rightIcon}
                {...attributes}
              >
                {label}
              </PetitionHeaderTab>
            );
          })}
        </GridItem>
        <GridItem area="b" as={HStack} justifyContent="flex-end" className="no-print">
          {isNullish(petition.permanentDeletionAt) ? (
            <>
              {!isPetition ? (
                <RestrictedFeaturePopover isRestricted={!userCanCreatePetition}>
                  <Button
                    flexShrink={0}
                    onClick={handleUseTemplate}
                    data-action="use-template"
                    disabled={!userCanCreatePetition}
                  >
                    <FormattedMessage
                      id="generic.create-petition"
                      defaultMessage="Create parallel"
                    />
                  </Button>
                </RestrictedFeaturePopover>
              ) : (
                (actions ?? null)
              )}

              <Box>
                <MoreOptionsMenuButton
                  ref={moreOptionsRef}
                  data-testid="petition-layout-header-menu-options"
                  variant="outline"
                  options={
                    <MenuList width="min-content" minWidth="16rem">
                      <>
                        <MenuItem
                          onClick={handlePetitionSharingClick}
                          icon={<UserArrowIcon display="block" boxSize={4} />}
                        >
                          {isPetition ? (
                            <FormattedMessage
                              id="component.petition-header.share-label-petition"
                              defaultMessage="Share parallel"
                            />
                          ) : (
                            <FormattedMessage
                              id="component.petition-header.share-label-template"
                              defaultMessage="Share template"
                            />
                          )}
                        </MenuItem>
                        {isPetition ? (
                          <MenuItem
                            onClick={handleImportRepliesClick}
                            isDisabled={
                              isAnonymized || myEffectivePermission.permissionType === "READ"
                            }
                            icon={<ImportIcon display="block" boxSize={4} />}
                          >
                            <FormattedMessage
                              id="component.petition-header.import-replies"
                              defaultMessage="Import replies"
                            />
                          </MenuItem>
                        ) : null}
                        {petition.isDocumentGenerationEnabled ? (
                          <MenuItem
                            onClick={() =>
                              handlePrintPdfTask(petition.id, {
                                modalProps: { finalFocusRef: moreOptionsRef },
                              })
                            }
                            isDisabled={isAnonymized}
                            icon={<DownloadIcon display="block" boxSize={4} />}
                          >
                            <FormattedMessage
                              id="component.petition-header.export-pdf"
                              defaultMessage="Export to PDF"
                            />
                          </MenuItem>
                        ) : null}
                        {me.hasProfilesAccess &&
                        petition.__typename === "Petition" &&
                        !petition.isAnonymized &&
                        myEffectivePermission.permissionType !== "READ" ? (
                          <MenuItem
                            onClick={() => handleProfilesClick(true, true)}
                            isDisabled={isAnonymized}
                            icon={<ArrowDiagonalRightIcon display="block" boxSize={4} />}
                          >
                            <FormattedMessage
                              id="component.petition-header.associate-profile"
                              defaultMessage="Associate profile"
                            />
                          </MenuItem>
                        ) : null}
                        {userCanDownloadResults && !isPetition ? (
                          <MenuItem
                            onClick={() =>
                              handleTemplateRepliesReportTask(petition.id, null, null, {
                                modalProps: { finalFocusRef: moreOptionsRef },
                              })
                            }
                            icon={<TableIcon display="block" boxSize={4} />}
                          >
                            <FormattedMessage
                              id="component.petition-header.download-results"
                              defaultMessage="Download results"
                            />
                          </MenuItem>
                        ) : null}
                        {isPetition ? null : (
                          <MenuItem
                            onClick={handleCloneClick}
                            icon={<CopyIcon display="block" boxSize={4} />}
                            isDisabled={!userCanCreateTemplate}
                          >
                            <FormattedMessage
                              id="component.petition-header.duplicate-label-template"
                              defaultMessage="Duplicate template"
                            />
                          </MenuItem>
                        )}

                        {isPetition ? (
                          <MenuItem
                            onClick={handleSaveAsTemplate}
                            icon={<CopyIcon display="block" boxSize={4} />}
                            isDisabled={!userCanCreateTemplate || isAnonymized}
                          >
                            <FormattedMessage
                              id="component.petition-header.save-as-template-button"
                              defaultMessage="Save as template"
                            />
                          </MenuItem>
                        ) : null}

                        <MenuItem
                          onClick={() => handleMovePetition(true)}
                          icon={<FolderIcon display="block" boxSize={4} />}
                          isDisabled={!userCanChangePath}
                        >
                          <FormattedMessage id="generic.move-to" defaultMessage="Move to..." />
                        </MenuItem>

                        {isPetition &&
                        myEffectivePermission.permissionType !== "READ" &&
                        status === "CLOSED" ? (
                          <MenuItem
                            onClick={handleReopenPetition}
                            isDisabled={isAnonymized}
                            icon={<EditIcon display="block" boxSize={4} />}
                          >
                            <FormattedMessage
                              id="component.petition-header.reopen-button"
                              defaultMessage="Reopen parallel"
                            />
                          </MenuItem>
                        ) : null}
                      </>

                      {petition.__typename === "PetitionTemplate" && !petition.isPublic ? (
                        <>
                          <MenuDivider />
                          <MenuItem
                            data-testid="delete-button"
                            color="red.500"
                            onClick={() => handleDeleteClick(false)}
                            icon={<DeleteIcon display="block" boxSize={4} />}
                          >
                            <FormattedMessage id="generic.delete" defaultMessage="Delete" />
                          </MenuItem>
                        </>
                      ) : null}
                      {isPetition ? (
                        <>
                          <MenuDivider />
                          <MenuOptionGroup
                            type="radio"
                            title={intl.formatMessage({
                              id: "generic.notifications",
                              defaultMessage: "Notifications",
                            })}
                            onChange={(value) => {
                              handleUpdatePetitionPermissionSubscription(value === "FOLLOW");
                            }}
                            value={isSubscribed ? "FOLLOW" : "IGNORE"}
                          >
                            <MenuItemOption
                              value="FOLLOW"
                              isDisabled={petition.myEffectivePermission?.isBypassed}
                            >
                              <Box flex="1">
                                <Text fontWeight="bold">
                                  <FormattedMessage
                                    id="generic.subscribed"
                                    defaultMessage="Subscribed"
                                  />
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  <FormattedMessage
                                    id="component.petition-header.subscribed-description"
                                    defaultMessage="Get email notifications about activity in this parallel."
                                  />
                                </Text>
                              </Box>
                            </MenuItemOption>
                            <MenuItemOption
                              value="IGNORE"
                              isDisabled={petition.myEffectivePermission?.isBypassed}
                            >
                              <Box flex="1">
                                <Text fontWeight="bold">
                                  <FormattedMessage
                                    id="generic.unsubscribed"
                                    defaultMessage="Unsubscribed"
                                  />
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  <FormattedMessage
                                    id="component.petition-header.not-subscribed-description"
                                    defaultMessage="Don't get notifications about this parallel."
                                  />
                                </Text>
                              </Box>
                            </MenuItemOption>
                          </MenuOptionGroup>
                          <MenuDivider />
                          <MenuItem
                            data-testid="delete-button"
                            color="red.500"
                            onClick={() => handleDeleteClick(false)}
                            icon={<DeleteIcon display="block" boxSize={4} />}
                          >
                            <FormattedMessage id="generic.delete" defaultMessage="Delete" />
                          </MenuItem>
                        </>
                      ) : null}
                    </MenuList>
                  }
                />
              </Box>
            </>
          ) : (
            <>
              <ButtonWithMoreOptions
                leftIcon={<ArchiveIcon />}
                flexShrink={0}
                isDisabled={
                  myEffectivePermission.permissionType !== "OWNER" &&
                  (!isPetition || !petition.myEffectivePermission?.isBypassed)
                }
                onClick={handleRecoverClick}
                data-action="recover-petition"
                options={
                  <MenuList>
                    <MenuItem
                      data-testid="delete-button"
                      icon={<DeleteIcon display="block" boxSize={4} />}
                      onClick={() => handleDeleteClick(true)}
                      color="red.500"
                    >
                      <FormattedMessage
                        id="generic.delete-permanently"
                        defaultMessage="Delete permanently"
                      />
                    </MenuItem>
                  </MenuList>
                }
              >
                <FormattedMessage id="generic.recover" defaultMessage="Recover" />
              </ButtonWithMoreOptions>
            </>
          )}
        </GridItem>
      </Grid>
    );
  },
);

const _fragments = {
  Petition: gql`
    fragment PetitionHeader_Petition on Petition {
      id
      locale
      deadline
      status
      isRestricted
      isAnonymized
      profiles {
        id
      }
      myEffectivePermission {
        isSubscribed
        isBypassed
        permissionType
      }

      ...HeaderNameEditable_PetitionBase
      ...useDeletePetitions_PetitionBase
      ...useRecoverPetition_PetitionBase
    }
  `,
  PetitionTemplate: gql`
    fragment PetitionHeader_PetitionTemplate on PetitionTemplate {
      id
      locale
      isPublic
      isRestricted
      ...HeaderNameEditable_PetitionBase
      ...useDeletePetitions_PetitionBase
    }
  `,
  PetitionBase: gql`
    fragment PetitionHeader_PetitionBase on PetitionBase {
      id
      isDocumentGenerationEnabled
      isInteractionWithRecipientsEnabled
      permanentDeletionAt
      path
      ... on Petition {
        ...PetitionHeader_Petition
      }
      ... on PetitionTemplate {
        ...PetitionHeader_PetitionTemplate
      }
      tags {
        id
        ...Tag_Tag
      }
      ...useEditTagsDialog_PetitionBase
    }
  `,
  Query: gql`
    fragment PetitionHeader_Query on Query {
      me {
        id
        hasProfilesAccess: hasFeatureFlag(featureFlag: PROFILES)
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation PetitionHeader_reopenPetition($petitionId: GID!) {
      reopenPetition(petitionId: $petitionId) {
        id
        status
        lastChangeAt
      }
    }
  `,
  gql`
    mutation PetitionHeader_updatePetitionPermissionSubscription(
      $petitionId: GID!
      $isSubscribed: Boolean!
    ) {
      updatePetitionPermissionSubscription(petitionId: $petitionId, isSubscribed: $isSubscribed) {
        id
        myEffectivePermission {
          isSubscribed
        }
      }
    }
  `,
  gql`
    mutation PetitionsHeader_movePetition(
      $id: GID!
      $source: String!
      $destination: String!
      $type: PetitionBaseType!
    ) {
      movePetitions(ids: [$id], source: $source, destination: $destination, type: $type)
    }
  `,
  gql`
    mutation PetitionsHeader_associateProfileToPetition($petitionId: GID!, $profileId: GID!) {
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

function EditionRestrictedPopover() {
  return (
    <SmallPopover
      content={
        <Text fontSize="sm">
          <FormattedMessage
            id="component.petition-header.compose-tab-readonly"
            defaultMessage="Edition restricted. To make changes, you can disable the protection on the Settings tab."
          />
        </Text>
      }
    >
      <LockClosedIcon color="gray.600" _hover={{ color: "gray.700" }} />
    </SmallPopover>
  );
}
