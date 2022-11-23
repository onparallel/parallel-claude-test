import { gql, useMutation } from "@apollo/client";
import { getOperationName } from "@apollo/client/utilities";
import {
  Badge,
  Box,
  Button,
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
  Text,
} from "@chakra-ui/react";
import {
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  FolderIcon,
  LockClosedIcon,
  TableIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  usePetitionShouldConfirmNavigation,
  usePetitionState,
} from "@parallel/components/layout/PetitionLayout";
import {
  PetitionActivity_petitionDocument,
  PetitionHeader_PetitionBaseFragment,
  PetitionHeader_PetitionBase_updatePathFragmentDoc,
  PetitionHeader_QueryFragment,
  PetitionHeader_reopenPetitionDocument,
  PetitionHeader_updatePetitionPermissionSubscriptionDocument,
  PetitionsHeader_movePetitionDocument,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { isAtLeast } from "@parallel/utils/roles";
import { usePrintPdfTask } from "@parallel/utils/usePrintPdfTask";
import { useTemplateRepliesReportTask } from "@parallel/utils/useTemplateRepliesReportTask";
import { useRouter } from "next/router";
import { ReactNode, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { Divider } from "../common/Divider";
import { NakedLink } from "../common/Link";
import { MoreOptionsMenuButton } from "../common/MoreOptionsMenuButton";
import { PathName } from "../common/PathName";
import { PetitionStatusIcon } from "../common/PetitionStatusIcon";
import { SmallPopover } from "../common/SmallPopover";
import { useMoveToFolderDialog } from "../petition-common/dialogs/MoveToFolderDialog";
import { usePetitionSharingDialog } from "../petition-common/dialogs/PetitionSharingDialog";
import { useConfirmReopenPetitionDialog } from "../petition-replies/dialogs/ConfirmReopenPetitionDialog";
import { HeaderNameEditable, HeaderNameEditableInstance } from "./HeaderNameEditable";
import { PetitionHeaderTab } from "./PetitionHeaderTab";
import { PetitionSection } from "./PetitionLayout";

export interface PetitionHeaderProps extends PetitionHeader_QueryFragment {
  petition: PetitionHeader_PetitionBaseFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: PetitionSection;
  actions?: ReactNode;
}

export interface PetitionHeaderInstance {
  focusName(): void;
}

export const PetitionHeader = Object.assign(
  chakraForwardRef<"div", PetitionHeaderProps, PetitionHeaderInstance>(function PetitionHeader(
    { petition, me, onUpdatePetition, section: current, actions, ...props },
    ref
  ) {
    const intl = useIntl();
    const router = useRouter();
    const [state] = usePetitionState();
    const [shouldConfirmNavigation, setShouldConfirmNavigation] =
      usePetitionShouldConfirmNavigation();
    const hasAdminRole = isAtLeast("ADMIN", me.role);

    const isPetition = petition.__typename === "Petition";

    const status = petition.__typename === "Petition" ? petition.status : "DRAFT";
    const isAnonymized = petition.__typename === "Petition" ? petition.isAnonymized : false;
    const isSubscribed =
      petition.__typename === "Petition" ? petition.myEffectivePermission!.isSubscribed : false;
    const myEffectivePermission = petition.myEffectivePermission!.permissionType;

    const deletePetitions = useDeletePetitions();
    const handleDeleteClick = async function () {
      try {
        setShouldConfirmNavigation(false);
        await deletePetitions([petition], "PETITION");
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
        goToPetition(templateId, "compose", { query: { new: "" } });
      } catch {}
    };

    const handleUseTemplate = async function () {
      try {
        const petitionId = await createPetition({
          petitionId: petition.id,
        });
        goToPetition(petitionId, "preview", {
          query: { new: "", fromTemplate: "" },
        });
      } catch {}
    };

    const [updatePetitionPermissionSubscription] = useMutation(
      PetitionHeader_updatePetitionPermissionSubscriptionDocument
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
        });
        if (res?.close) {
          router.push(isPetition ? "/app/petitions" : "/app/petitions/new");
        }
      } catch {}
    };

    const [movePetition] = useMutation(PetitionsHeader_movePetitionDocument);
    const showMoveFolderDialog = useMoveToFolderDialog();
    const handleMovePetition = async () => {
      try {
        const destination = await showMoveFolderDialog({
          type: isPetition ? "PETITION" : "TEMPLATE",
          currentPath: petition.path,
        });
        await movePetition({
          variables: {
            id: petition.id,
            source: petition.path,
            type: isPetition ? "PETITION" : "TEMPLATE",
            destination,
          },
          update: (cache, { data }) => {
            if (data?.movePetitions === "SUCCESS") {
              cache.writeFragment({
                id: petition.id,
                fragment: PetitionHeader_PetitionBase_updatePathFragmentDoc,
                data: { path: destination },
              });
            }
          },
        });
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
                          id="component.petition-header.compose-tab.readonly"
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
                  id: "petition.header.compose-tab",
                  defaultMessage: "Compose",
                }),
                attributes: {
                  "data-action": "petition-compose",
                },
              },
              {
                section: "preview",
                label: intl.formatMessage({
                  id: "petition.header.preview-tab",
                  defaultMessage: "Input",
                }),
                attributes: {
                  "data-action": "petition-preview",
                },
              },
              {
                section: "replies",
                label: intl.formatMessage({
                  id: "petition.header.replies-tab",
                  defaultMessage: "Review",
                }),
                attributes: {
                  "data-action": "petition-replies",
                },
              },
              {
                section: "activity",
                label: intl.formatMessage({
                  id: "petition.header.activity-tab",
                  defaultMessage: "Activity",
                }),
                attributes: {
                  "data-action": "petition-activity",
                },
              },
            ]
          : [
              {
                rightIcon: petition.isRestricted ? <EditionRestrictedPopover /> : undefined,
                section: "compose",
                label: intl.formatMessage({
                  id: "petition.header.compose-tab",
                  defaultMessage: "Compose",
                }),
                attributes: {
                  "data-action": "template-compose",
                },
              },
              {
                rightIcon: petition.isRestricted ? <EditionRestrictedPopover /> : undefined,
                section: "messages",
                label: intl.formatMessage({
                  id: "petition.header.messages-tab",
                  defaultMessage: "Messages",
                }),
                attributes: {
                  "data-action": "template-messages",
                },
              },
              {
                section: "preview",
                label: intl.formatMessage({
                  id: "template.header.preview-tab",
                  defaultMessage: "Preview",
                }),
                attributes: {
                  "data-action": "template-preview",
                },
              },
            ],
      [status, petition.isRestricted, intl.locale]
    );

    const [reopenPetition] = useMutation(PetitionHeader_reopenPetitionDocument);
    const confirmReopenPetitionDialog = useConfirmReopenPetitionDialog();

    const handleReopenPetition = useCallback(async () => {
      try {
        await confirmReopenPetitionDialog();
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

    return (
      <Grid
        backgroundColor="white"
        borderBottom="2px solid"
        borderBottomColor="gray.200"
        position="relative"
        paddingX={4}
        gridTemplateColumns={{ base: "1fr min-content", md: "1fr min-content 1fr" }}
        gridTemplateRows={{ base: "4rem 2.5rem", md: "4rem" }}
        gridTemplateAreas={{ base: '"a b" "c c"', md: '"a c b"' }}
        {...props}
      >
        <GridItem area="a" as={Flex} flexDirection="column" justifyContent="center">
          <Flex>
            <HeaderNameEditable
              ref={editableRef}
              flex="1"
              petition={petition}
              state={state}
              onNameChange={(name) => onUpdatePetition({ name: name || null })}
            />
          </Flex>
          <HStack spacing={1}>
            {petition.__typename === "Petition" ? (
              <Center data-section="petition-status-icon" data-status={status} paddingX={1}>
                <PetitionStatusIcon status={status} showStatus={true} />
              </Center>
            ) : (
              <Badge colorScheme="primary" marginRight={2}>
                <FormattedMessage id="generic.template" defaultMessage="Template" />
              </Badge>
            )}
            <Divider isVertical height={3.5} color="gray.500" />
            <PathName
              type={isPetition ? "PETITION" : "TEMPLATE"}
              path={petition.path}
              render={({ children }) => (
                <>
                  {me.role === "COLLABORATOR" ? (
                    <HStack paddingX={1.5} color="gray.600" fontSize="sm">
                      <FolderIcon boxSize={4} />
                      <Text as="span" lineHeight="24px">
                        {children}
                      </Text>
                    </HStack>
                  ) : (
                    <Button
                      leftIcon={<FolderIcon boxSize={4} />}
                      color="gray.600"
                      size="xs"
                      variant="ghost"
                      paddingX={1.5}
                      fontSize="sm"
                      fontWeight="norm"
                      onClick={handleMovePetition}
                    >
                      {children}
                    </Button>
                  )}
                </>
              )}
            />
          </HStack>
        </GridItem>
        <GridItem area="c" as={List} display="flex" alignItems="stretch" justifyContent="center">
          {sections.map(({ section, label, rightIcon, attributes }) => {
            let href = `/app/petitions/${petition.id}/${section}`;

            if (isDefined(router.query.fromTemplate) || shouldConfirmNavigation) {
              href += `?${new URLSearchParams({
                ...(isDefined(router.query.fromTemplate) ? { fromTemplate: "" } : {}),
                ...(shouldConfirmNavigation ? { new: "" } : {}),
              })}`;
            }

            return (
              <NakedLink key={section} href={href}>
                <PetitionHeaderTab
                  isActive={current === section}
                  rightIcon={rightIcon}
                  {...attributes}
                >
                  {label}
                </PetitionHeaderTab>
              </NakedLink>
            );
          })}
        </GridItem>
        <GridItem area="b" as={HStack} justifyContent="flex-end">
          {!isPetition ? (
            <Button flexShrink={0} onClick={handleUseTemplate} data-action="use-template">
              <FormattedMessage id="generic.create-petition" defaultMessage="Create parallel" />
            </Button>
          ) : (
            actions ?? null
          )}
          <Box>
            <MoreOptionsMenuButton
              variant="outline"
              options={
                <MenuList width="min-content" minWidth="16rem">
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

                  {me.hasPetitionPdfExport ? (
                    <MenuItem
                      onClick={() => handlePrintPdfTask(petition.id)}
                      isDisabled={isAnonymized}
                      icon={<DownloadIcon display="block" boxSize={4} />}
                    >
                      <FormattedMessage
                        id="component.petition-header.export-pdf"
                        defaultMessage="Export to PDF"
                      />
                    </MenuItem>
                  ) : null}

                  {hasAdminRole && !isPetition ? (
                    <MenuItem
                      onClick={() => handleTemplateRepliesReportTask(petition.id)}
                      icon={<TableIcon display="block" boxSize={4} />}
                    >
                      <FormattedMessage
                        id="component.petition-header.download-results"
                        defaultMessage="Download results"
                      />
                    </MenuItem>
                  ) : null}

                  <MenuItem
                    onClick={handleCloneClick}
                    icon={<CopyIcon display="block" boxSize={4} />}
                    isDisabled={me.role === "COLLABORATOR"}
                  >
                    {isPetition ? (
                      <FormattedMessage
                        id="component.petition-header.duplicate-label-petition"
                        defaultMessage="Duplicate parallel"
                      />
                    ) : (
                      <FormattedMessage
                        id="component.petition-header.duplicate-label-template"
                        defaultMessage="Duplicate template"
                      />
                    )}
                  </MenuItem>

                  {isPetition ? (
                    <MenuItem
                      onClick={handleSaveAsTemplate}
                      icon={<CopyIcon display="block" boxSize={4} />}
                      isDisabled={me.role === "COLLABORATOR"}
                    >
                      <FormattedMessage
                        id="component.petition-header.save-as-template-button"
                        defaultMessage="Save as template"
                      />
                    </MenuItem>
                  ) : null}

                  <MenuItem
                    onClick={handleMovePetition}
                    icon={<FolderIcon display="block" boxSize={4} />}
                    isDisabled={me.role === "COLLABORATOR"}
                  >
                    <FormattedMessage
                      id="component.petition-header.move-to"
                      defaultMessage="generic.move-to"
                    />
                  </MenuItem>

                  {isPetition && myEffectivePermission !== "READ" && status === "CLOSED" ? (
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
                  {petition.__typename === "PetitionTemplate" && !petition.isPublic ? (
                    <>
                      <MenuDivider />
                      <MenuItem
                        color="red.500"
                        onClick={handleDeleteClick}
                        icon={<DeleteIcon display="block" boxSize={4} />}
                      >
                        <FormattedMessage
                          id="component.petition-template.delete-label"
                          defaultMessage="Delete template"
                        />
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
                        <MenuItemOption value="FOLLOW">
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
                        <MenuItemOption value="IGNORE">
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
                        color="red.500"
                        onClick={handleDeleteClick}
                        icon={<DeleteIcon display="block" boxSize={4} />}
                      >
                        <FormattedMessage
                          id="component.petition-header.delete-label"
                          defaultMessage="Delete parallel"
                        />
                      </MenuItem>
                    </>
                  ) : null}
                </MenuList>
              }
            />
          </Box>
        </GridItem>
      </Grid>
    );
  }),
  {
    fragments: {
      get Petition() {
        return gql`
          fragment PetitionHeader_Petition on Petition {
            id
            locale
            deadline
            status
            isRestricted
            isAnonymized
            myEffectivePermission {
              isSubscribed
              permissionType
            }
            ...HeaderNameEditable_PetitionBase
            ...useDeletePetitions_PetitionBase
          }
          ${HeaderNameEditable.fragments.PetitionBase}
          ${useDeletePetitions.fragments.PetitionBase}
        `;
      },
      get PetitionTemplate() {
        return gql`
          fragment PetitionHeader_PetitionTemplate on PetitionTemplate {
            id
            locale
            isPublic
            isRestricted
            ...HeaderNameEditable_PetitionBase
            ...useDeletePetitions_PetitionBase
          }
          ${HeaderNameEditable.fragments.PetitionBase}
          ${useDeletePetitions.fragments.PetitionBase}
        `;
      },
      get PetitionBase() {
        return gql`
          fragment PetitionHeader_PetitionBase on PetitionBase {
            id
            path
            ... on Petition {
              ...PetitionHeader_Petition
            }
            ... on PetitionTemplate {
              ...PetitionHeader_PetitionTemplate
            }
          }
          ${this.Petition}
          ${this.PetitionTemplate}
        `;
      },
      get Query() {
        return gql`
          fragment PetitionHeader_Query on Query {
            me {
              id
              role
              hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
            }
          }
        `;
      },
    },
  }
);

const _fragments = {
  PetitionHeader_PetitionBase_updatePath: gql`
    fragment PetitionHeader_PetitionBase_updatePath on PetitionBase {
      path
    }
  `,
};

const _mutations = [
  gql`
    mutation PetitionHeader_reopenPetition($petitionId: GID!) {
      reopenPetition(petitionId: $petitionId) {
        id
        status
        updatedAt
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
];

function EditionRestrictedPopover() {
  return (
    <SmallPopover
      content={
        <Text fontSize="sm">
          <FormattedMessage
            id="component.petition-header.compose-tab.readonly"
            defaultMessage="Edition restricted. To make changes, you can disable the protection on the Settings tab."
          />
        </Text>
      }
    >
      <LockClosedIcon color="gray.600" _hover={{ color: "gray.700" }} />
    </SmallPopover>
  );
}
