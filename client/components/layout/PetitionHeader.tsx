import { gql } from "@apollo/client";
import { getOperationName } from "@apollo/client/utilities";
import {
  Box,
  BoxProps,
  Button,
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
  PetitionActivityDocument,
  PetitionHeader_PetitionFragment,
  PetitionHeader_UserFragment,
  UpdatePetitionInput,
  usePetitionHeader_reopenPetitionMutation,
  usePetitionHeader_updatePetitionPermissionSubscriptionMutation,
} from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { usePetitionState } from "@parallel/utils/usePetitionState";
import { useRouter } from "next/router";
import { ReactNode, Ref, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { LocaleBadge } from "../common/LocaleBadge";
import { PetitionStatusIcon } from "../common/PetitionStatusIcon";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { usePetitionSharingDialog } from "../petition-common/PetitionSharingDialog";
import { useConfirmReopenPetitionDialog } from "../petition-replies/ConfirmReopenPetitionDialog";
import { HeaderNameEditable } from "./HeaderNameEditable";

export interface PetitionHeaderProps extends BoxProps {
  petition: PetitionHeader_PetitionFragment;
  user: PetitionHeader_UserFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: "compose" | "replies" | "activity";
  actions?: ReactNode;
}

export function PetitionHeader({
  petition,
  user,
  onUpdatePetition,
  section: current,
  actions,
  ...props
}: PetitionHeaderProps) {
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
      goToPetition(petitionId, "compose");
    } catch {}
  };

  const createPetition = useCreatePetition();
  const handleSaveAsTemplate = async function () {
    try {
      const templateId = await createPetition({
        petitionId: petition.id,
        type: "TEMPLATE",
      });
      goToPetition(templateId, "compose");
    } catch {}
  };

  const isSubscribed = petition.myEffectivePermission!.isSubscribed;

  const [updatePetitionPermissionSubscription] =
    usePetitionHeader_updatePetitionPermissionSubscriptionMutation();
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
      await showPetitionSharingDialog({
        userId: user.id,
        petitionIds: [petition.id],
      });
    } catch {}
  };

  const sections = useMemo(
    () => [
      {
        rightIcon: petition.isReadOnly ? (
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
      },
      {
        section: "replies",
        label: intl.formatMessage({
          id: "petition.header.replies-tab",
          defaultMessage: "Replies",
        }),
        isDisabled: petition.status === "DRAFT",
        popoverContent: (
          <Text fontSize="sm">
            <FormattedMessage
              id="petition.replies-not-available"
              defaultMessage="Once you send this petition, you will be able to see all the replies here."
            />
          </Text>
        ),
      },
      {
        section: "activity",
        label: intl.formatMessage({
          id: "petition.header.activity-tab",
          defaultMessage: "Activity",
        }),
        isDisabled: petition.status === "DRAFT",
        popoverContent: (
          <Text fontSize="sm">
            <FormattedMessage
              id="petition.activity-not-available"
              defaultMessage="Once you send this petition, you will be able to see all the petition activity here."
            />
          </Text>
        ),
      },
    ],
    [petition.status, petition.isReadOnly, intl.locale]
  );

  const [reopenPetition] = usePetitionHeader_reopenPetitionMutation();
  const confirmReopenPetitionDialog = useConfirmReopenPetitionDialog();

  const handleReopenPetition = useCallback(async () => {
    try {
      await confirmReopenPetitionDialog({});
      await reopenPetition({
        variables: {
          petitionId: petition.id,
        },
        refetchQueries: [getOperationName(PetitionActivityDocument)!],
      });
    } catch {}
  }, [petition.id]);

  const handleExportPetitionPDF = async () => {
    window.open(`/api/downloads/petition/${petition.id}/pdf`, "_blank");
  };

  return (
    <Box
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
              md: `calc((100vw - ${
                96 /* left navbar width */ + 350 /* petition navigation tabs width */
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
                    id: "generic.untitled-petition",
                    defaultMessage: "Untitled petition",
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
                placement="bottom"
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
                  <MenuItem
                    onClick={handleCloneClick}
                    icon={<CopyIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="component.petition-header.clone-label"
                      defaultMessage="Clone petition"
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
                  {user.hasPetitionPdfExport ? (
                    <MenuItem
                      onClick={handleExportPetitionPDF}
                      icon={<DownloadIcon display="block" boxSize={4} />}
                    >
                      <FormattedMessage
                        id="component.petition-header.export-pdf"
                        defaultMessage="Export to PDF"
                      />
                    </MenuItem>
                  ) : null}
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
      <Stack
        alignItems="center"
        justifyContent="center"
        transform={{ base: "none", md: "translate(-50%)" }}
        left={{ base: 0, md: "50%" }}
        bottom="0"
        position={{ base: "relative", md: "absolute" }}
        height={{ base: "40px", md: "64px" }}
        marginBottom={{ base: "10px", md: 0 }}
        direction="row"
      >
        {sections.map(({ section, label, isDisabled, popoverContent, rightIcon }) => {
          return isDisabled ? (
            <PetitionHeaderTab
              key={section}
              isActive={current === section}
              isDisabled
              popoverContent={popoverContent}
              rightIcon={rightIcon}
            >
              {label}
            </PetitionHeaderTab>
          ) : (
            <NakedLink key={section} href={`/app/petitions/${petition.id}/${section}`}>
              <PetitionHeaderTab isActive={current === section} rightIcon={rightIcon}>
                {label}
              </PetitionHeaderTab>
            </NakedLink>
          );
        })}
      </Stack>
    </Box>
  );
}

const PetitionHeaderTab = chakraForwardRef<
  "a",
  {
    isActive?: boolean;
    isDisabled?: boolean;
    popoverContent?: ReactNode;
    rightIcon?: ReactNode;
    children: ReactNode;
  }
>(function (
  { isActive, isDisabled, children, popoverContent, rightIcon, ...props },
  ref: Ref<any>
) {
  const link = (
    <Button
      as="a"
      ref={ref}
      textTransform="uppercase"
      isDisabled={isDisabled}
      rightIcon={rightIcon}
      variant={isActive ? "solid" : "ghost"}
      {...(isActive ? { "aria-current": "page" } : {})}
      {...(props as any)}
    >
      {children}
    </Button>
  );
  if (isDisabled) {
    return (
      <SmallPopover placement="bottom" content={popoverContent ?? null}>
        {link}
      </SmallPopover>
    );
  } else {
    return link;
  }
});

PetitionHeader.fragments = {
  Petition: gql`
    fragment PetitionHeader_Petition on Petition {
      id
      locale
      deadline
      status

      myEffectivePermission {
        isSubscribed
      }
      ...HeaderNameEditable_PetitionBase
    }
    ${HeaderNameEditable.fragments.PetitionBase}
  `,
  User: gql`
    fragment PetitionHeader_User on User {
      id
      hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
    }
  `,
};

PetitionHeader.mutations = [
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
