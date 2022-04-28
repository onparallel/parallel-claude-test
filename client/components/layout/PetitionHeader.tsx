import { gql, useMutation } from "@apollo/client";
import { getOperationName } from "@apollo/client/utilities";
import {
  Box,
  Center,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  LockClosedIcon,
  MoreVerticalIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionActivity_petitionDocument,
  PetitionHeader_PetitionFragment,
  PetitionHeader_QueryFragment,
  PetitionHeader_reopenPetitionDocument,
  PetitionHeader_updatePetitionPermissionSubscriptionDocument,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { usePetitionState } from "@parallel/utils/usePetitionState";
import { usePrintPdfTask } from "@parallel/utils/usePrintPdfTask";
import { useRouter } from "next/router";
import { ReactNode, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { LocaleBadge } from "../common/LocaleBadge";
import { PetitionStatusIcon } from "../common/PetitionStatusIcon";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { usePetitionSharingDialog } from "../petition-common/dialogs/PetitionSharingDialog";
import { useConfirmReopenPetitionDialog } from "../petition-replies/dialogs/ConfirmReopenPetitionDialog";
import { HeaderNameEditable } from "./HeaderNameEditable";
import { PetitionHeaderTab } from "./PetitionHeaderTab";
import { PetitionHeaderTabs } from "./PetitionHeaderTabs";
import { PetitionSection } from "./PetitionLayout";

export interface PetitionHeaderProps extends PetitionHeader_QueryFragment {
  petition: PetitionHeader_PetitionFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: PetitionSection;
  actions?: ReactNode;
}

export const PetitionHeader = Object.assign(
  chakraForwardRef<"div", PetitionHeaderProps>(function PetitionHeader(
    { petition, me, onUpdatePetition, section: current, actions, ...props },
    ref
  ) {
    const intl = useIntl();
    const router = useRouter();
    const state = usePetitionState();

    const deletePetitions = useDeletePetitions();
    const handleDeleteClick = async function () {
      try {
        await deletePetitions([petition.id]);
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
        goToPetition(petitionId, "compose", { query: { new: "true" } });
      } catch {}
    };

    const createPetition = useCreatePetition();
    const handleSaveAsTemplate = async function () {
      try {
        const templateId = await createPetition({
          petitionId: petition.id,
          type: "TEMPLATE",
        });
        goToPetition(templateId, "compose", { query: { new: "true" } });
      } catch {}
    };

    const isSubscribed = petition.myEffectivePermission!.isSubscribed;

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
        });
        if (res?.close) {
          router.push("/app/petitions");
        }
      } catch {}
    };

    const sections = useMemo(
      () => [
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
      ],
      [petition.status, petition.isRestricted, intl.locale]
    );

    const [reopenPetition] = useMutation(PetitionHeader_reopenPetitionDocument);
    const confirmReopenPetitionDialog = useConfirmReopenPetitionDialog();

    const handleReopenPetition = useCallback(async () => {
      try {
        await confirmReopenPetitionDialog({});
        await reopenPetition({
          variables: {
            petitionId: petition.id,
          },
          refetchQueries: [getOperationName(PetitionActivity_petitionDocument)!],
        });
      } catch {}
    }, [petition.id]);

    const handlePrintPdfTask = usePrintPdfTask();

    return (
      <Box
        ref={ref}
        backgroundColor="white"
        borderBottom="2px solid"
        borderBottomColor="gray.200"
        position="relative"
        {...props}
      >
        <Flex height={16} alignItems="center" paddingX={4}>
          <Flex alignItems="center">
            <Center boxSize={6}>
              <PetitionStatusIcon status={petition.status} />
            </Center>
            <LocaleBadge locale={petition.locale} marginLeft={2} />
            <HeaderNameEditable
              petition={petition}
              state={state}
              onNameChange={(name) => onUpdatePetition({ name: name || null })}
              maxWidth={{
                base: `calc(100vw - ${
                  32 /* heading padding l+r */ +
                  24 /* petition status icon width */ +
                  8 /* locale badge margin left */ +
                  24 /* locale badge width */ +
                  16 /* petition name padding l+r */ +
                  (petition.status === "DRAFT" ? 40 + 8 : 0) +
                  40 /* more options button width */
                }px)`,
                sm: `calc(100vw - ${
                  96 /* left navbar width */ +
                  32 /* heading padding l+r */ +
                  24 /* petition status icon width */ +
                  8 /* locale badge margin left */ +
                  24 /* locale badge width */ +
                  16 /* petition name padding l+r */ +
                  (petition.status === "DRAFT" ? 40 + 8 : 0) +
                  40 /* more options button width */
                }px)`,
                md: `calc(100vw - ${
                  96 /* left navbar width */ +
                  32 /* heading padding l+r */ +
                  24 /* petition status icon width */ +
                  8 /* locale badge margin left */ +
                  24 /* locale badge width */ +
                  16 /* petition name padding l+r */ +
                  (petition.status === "DRAFT" ? 138 : 10) +
                  40 /* more options button width */
                }px)`,
                lg: `calc((100vw - ${
                  96 /* left navbar width */ + 460 /* petition navigation tabs width */
                }px)/2 - ${
                  32 /* heading padding l+r */ +
                  24 /* petition status icon width */ +
                  8 /* locale badge margin left */ +
                  24 /* locale badge width */
                }px)`,
              }}
              placeholder={
                petition.name
                  ? ""
                  : intl.formatMessage({
                      id: "generic.unnamed-petition",
                      defaultMessage: "Unnamed petition",
                    })
              }
              aria-label={intl.formatMessage({
                id: "petition.name-label",
                defaultMessage: "Petition name",
              })}
            />
          </Flex>
          <Spacer minWidth={4} />
          <Stack direction="row">
            {actions ?? null}
            <Box>
              <Menu>
                <Tooltip
                  placement="bottom-end"
                  label={intl.formatMessage({
                    id: "generic.more-options",
                    defaultMessage: "More options...",
                  })}
                  whiteSpace="nowrap"
                >
                  <MenuButton
                    as={IconButton}
                    variant="outline"
                    icon={<MoreVerticalIcon />}
                    aria-label={intl.formatMessage({
                      id: "generic.more-options",
                      defaultMessage: "More options...",
                    })}
                  />
                </Tooltip>
                <Portal>
                  <MenuList width="min-content" minWidth="16rem">
                    <MenuItem
                      onClick={handlePetitionSharingClick}
                      icon={<UserArrowIcon display="block" boxSize={4} />}
                    >
                      <FormattedMessage
                        id="component.petition-header.share-label"
                        defaultMessage="Share petition"
                      />
                    </MenuItem>
                    {me.hasPetitionPdfExport ? (
                      <MenuItem
                        onClick={() => handlePrintPdfTask(petition.id)}
                        icon={<DownloadIcon display="block" boxSize={4} />}
                      >
                        <FormattedMessage
                          id="component.petition-header.export-pdf"
                          defaultMessage="Export to PDF"
                        />
                      </MenuItem>
                    ) : null}
                    <MenuItem
                      onClick={handleCloneClick}
                      icon={<CopyIcon display="block" boxSize={4} />}
                      isDisabled={me.role === "COLLABORATOR"}
                    >
                      <FormattedMessage
                        id="component.petition-header.duplicate-label"
                        defaultMessage="Duplicate petition"
                      />
                    </MenuItem>
                    <MenuItem
                      onClick={handleSaveAsTemplate}
                      icon={<CopyIcon display="block" boxSize={4} />}
                    >
                      <FormattedMessage
                        id="component.petition-header.save-as-template-button"
                        defaultMessage="Save as template"
                      />
                    </MenuItem>
                    <MenuItem
                      onClick={handleReopenPetition}
                      hidden={petition.status !== "CLOSED"}
                      icon={<EditIcon display="block" boxSize={4} />}
                    >
                      <FormattedMessage
                        id="component.petition-header.reopen-button"
                        defaultMessage="Reopen petition"
                      />
                    </MenuItem>

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
                            <FormattedMessage id="generic.subscribed" defaultMessage="Subscribed" />
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            <FormattedMessage
                              id="component.petition-header.subscribed-description"
                              defaultMessage="Get email notifications about activity in this petition."
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
                              defaultMessage="Don't get notifications about this petition."
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
                        defaultMessage="Delete petition"
                      />
                    </MenuItem>
                  </MenuList>
                </Portal>
              </Menu>
            </Box>
          </Stack>
        </Flex>
        <PetitionHeaderTabs>
          {sections.map(({ section, label, rightIcon, attributes }) => {
            return (
              <NakedLink key={section} href={`/app/petitions/${petition.id}/${section}`}>
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
        </PetitionHeaderTabs>
      </Box>
    );
  }),
  {
    fragments: {
      Petition: gql`
        fragment PetitionHeader_Petition on Petition {
          id
          locale
          deadline
          status
          isRestricted
          myEffectivePermission {
            isSubscribed
          }
          ...HeaderNameEditable_PetitionBase
        }
        ${HeaderNameEditable.fragments.PetitionBase}
      `,
      Query: gql`
        fragment PetitionHeader_Query on Query {
          me {
            id
            role
            hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
          }
        }
      `,
    },
  }
);

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
];
