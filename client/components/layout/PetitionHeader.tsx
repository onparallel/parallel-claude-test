import { gql } from "@apollo/client";
import { getOperationName } from "@apollo/client/utilities";
import {
  Box,
  Button,
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
} from "@chakra-ui/core";
import {
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  MoreVerticalIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import {
  PetitionActivityDocument,
  PetitionHeader_PetitionFragment,
  PetitionHeader_UserFragment,
  UpdatePetitionInput,
  usePetitionHeader_reopenPetitionMutation,
  usePetitionHeader_updatePetitionUserSubscriptionMutation,
} from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { useRouter } from "next/router";
import { forwardRef, ReactNode, Ref, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { LocaleBadge } from "../common/LocaleBadge";
import { PetitionStatusIcon } from "../common/PetitionStatusIcon";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { usePetitionSharingDialog } from "../petition-common/PetitionSharingDialog";
import { useConfirmReopenPetitionDialog } from "../petition-replies/ConfirmReopenPetitionDialog";
import { HeaderNameEditable } from "./HeaderNameEditable";

export type PetitionHeaderProps = ExtendChakra<{
  petition: PetitionHeader_PetitionFragment;
  user: PetitionHeader_UserFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: "compose" | "replies" | "activity";
  state: "SAVED" | "SAVING" | "ERROR";
  actions?: ReactNode;
}>;

export function PetitionHeader({
  petition,
  user,
  onUpdatePetition,
  section: current,
  state,
  actions,
  ...props
}: PetitionHeaderProps) {
  const intl = useIntl();
  const router = useRouter();

  const deletePetitions = useDeletePetitions();
  const handleDeleteClick = async function () {
    try {
      await deletePetitions([petition.id]);
      router.push(`/${router.query.locale}/app/petitions/`);
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

  const isSubscribed =
    petition.userPermissions.find((up) => up.user.id === user.id)
      ?.isSubscribed ?? false;

  const [
    updatePetitionUserSubscription,
  ] = usePetitionHeader_updatePetitionUserSubscriptionMutation();
  const handleUpdateUserPermission = async function (isSubscribed: boolean) {
    await updatePetitionUserSubscription({
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
        petitionId: petition.id,
      });
    } catch {}
  };

  const sections = useMemo(
    () => [
      {
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
    [petition.status, intl.locale]
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
      height={{ base: "102px", md: 16 }}
      {...props}
    >
      <Flex height={16} alignItems="center" paddingX={4}>
        <Flex alignItems="center">
          <PetitionStatusIcon marginRight={1} status={petition.status} />
          <LocaleBadge locale={petition.locale} marginLeft={1} />
          <HeaderNameEditable
            petition={petition}
            state={state}
            onNameChange={(name) => onUpdatePetition({ name: name || null })}
            maxWidth={{
              base: `calc(100vw - ${
                32 /* heading padding l+r */ +
                24 /* petition status icon width */ +
                4 /* petition status icon margin right */ +
                4 /* locale badge margin left */ +
                24 /* locale badge width */ +
                16 /* petition name padding l+r */ +
                (petition.status === "DRAFT" ? 40 + 8 : 0) +
                40 /* more options button width */
              }px)`,
              sm: `calc(100vw - ${
                96 /* left navbar width */ +
                32 /* heading padding l+r */ +
                24 /* petition status icon width */ +
                4 /* petition status icon margin right */ +
                4 /* locale badge margin left */ +
                24 /* locale badge width */ +
                16 /* petition name padding l+r */ +
                (petition.status === "DRAFT" ? 40 + 8 : 0) +
                40 /* more options button width */
              }px)`,
              md: `calc((100vw - ${
                96 /* left navbar width */ +
                350 /* petition navigation tabs width */
              }px)/2 - ${
                32 /* heading padding l+r */ +
                24 /* petition status icon width */ +
                4 /* petition status icon margin right */ +
                4 /* locale badge margin left */ +
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
                  <MenuItem onClick={handlePetitionSharingClick}>
                    <UserArrowIcon marginRight={2} />
                    <FormattedMessage
                      id="component.petition-header.share-label"
                      defaultMessage="Share petition"
                    />
                  </MenuItem>
                  <MenuItem onClick={handleCloneClick}>
                    <CopyIcon marginRight={2} />
                    <FormattedMessage
                      id="component.petition-header.clone-label"
                      defaultMessage="Clone petition"
                    />
                  </MenuItem>
                  <MenuItem onClick={handleSaveAsTemplate}>
                    <CopyIcon marginRight={2} />
                    <FormattedMessage
                      id="component.petition-header.save-as-template-button"
                      defaultMessage="Save as template"
                    />
                  </MenuItem>
                  <MenuItem
                    onClick={handleReopenPetition}
                    hidden={petition.status !== "CLOSED"}
                  >
                    <EditIcon marginRight={2} />
                    <FormattedMessage
                      id="component.petition-header.reopen-button"
                      defaultMessage="Reopen petition"
                    />
                  </MenuItem>
                  {user.hasPetitionPdfExport ? (
                    <MenuItem onClick={handleExportPetitionPDF}>
                      <DownloadIcon marginRight={2} />
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
                      handleUpdateUserPermission(value === "FOLLOW");
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
                  <MenuItem color="red.500" onClick={handleDeleteClick}>
                    <DeleteIcon marginRight={2} />
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
        position="absolute"
        bottom="0"
        left="50%"
        height={{ base: "56px", md: 16 }}
        transform="translateX(-50%)"
        direction="row"
        marginBottom="-2px"
      >
        {sections.map(({ section, label, isDisabled, popoverContent }) => {
          return isDisabled ? (
            <PetitionHeaderTab
              key={section}
              isActive={current === section}
              isDisabled
              popoverContent={popoverContent}
            >
              {label}
            </PetitionHeaderTab>
          ) : (
            <NakedLink
              key={section}
              href={`/app/petitions/${petition.id}/${section}`}
            >
              <PetitionHeaderTab isActive={current === section}>
                {label}
              </PetitionHeaderTab>
            </NakedLink>
          );
        })}
      </Stack>
    </Box>
  );
}

const PetitionHeaderTab = forwardRef(function (
  {
    isActive,
    isDisabled,
    children,
    popoverContent,
    ...props
  }: ExtendChakra<{
    isActive?: boolean;
    isDisabled?: boolean;
    popoverContent?: ReactNode;
    children: ReactNode;
  }>,
  ref: Ref<any>
) {
  const link = (
    <Button
      as="a"
      ref={ref}
      textTransform="uppercase"
      isDisabled={isDisabled}
      variant={isActive ? "solid" : "ghost"}
      {...(isActive ? { "aria-current": "page" } : {})}
      {...props}
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
      userPermissions {
        isSubscribed
        user {
          id
        }
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
    mutation PetitionHeader_updatePetitionUserSubscription(
      $petitionId: GID!
      $isSubscribed: Boolean!
    ) {
      updatePetitionUserSubscription(
        petitionId: $petitionId
        isSubscribed: $isSubscribed
      ) {
        id
        userPermissions {
          isSubscribed
          user {
            id
          }
        }
      }
    }
  `,
];
