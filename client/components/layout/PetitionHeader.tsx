import { gql } from "@apollo/client";
import {
  Box,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/core";
import {
  CopyIcon,
  DeleteIcon,
  MoreVerticalIcon,
  SettingsIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import {
  PetitionHeader_PetitionFragment,
  PetitionHeader_UserFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useRouter } from "next/router";
import { forwardRef, ReactNode, Ref, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { PetitionStatusIcon } from "../common/PetitionStatusIcon";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { PetitionSettingsModal } from "../petition-common/PetitionSettingsModal";
import { PetitionSharingModal } from "../petition-common/PetitionSharingModal";
import { HeaderNameEditable } from "./HeaderNameEditable";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { LocaleBadge } from "../common/LocaleBadge";

export type PetitionHeaderProps = ExtendChakra<{
  petition: PetitionHeader_PetitionFragment;
  user: PetitionHeader_UserFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: "compose" | "replies" | "activity";
  state: "SAVED" | "SAVING" | "ERROR";
}>;

export function PetitionHeader({
  petition,
  user,
  onUpdatePetition,
  section: current,
  state,
  ...props
}: PetitionHeaderProps) {
  const intl = useIntl();
  const router = useRouter();
  const {
    isOpen: isSettingsOpen,
    onOpen: onOpenSettings,
    onClose: onCloseSettings,
  } = useDisclosure();

  const deletePetitions = useDeletePetitions();
  const handleDeleteClick = useCallback(
    async function () {
      try {
        await deletePetitions(user.id, [petition.id]);
        router.push(
          `/[locale]/app/petitions/`,
          `/${router.query.locale}/app/petitions/`
        );
      } catch {}
    },
    [petition.id, petition.name, deletePetitions]
  );

  const clonePetitions = useClonePetitions();
  const goToPetition = useGoToPetition();
  const handleCloneClick = useCallback(
    async function () {
      try {
        const [petitionId] = await clonePetitions({
          petitionIds: [petition.id],
        });
        goToPetition(petitionId, "compose");
      } catch {}
    },
    [
      petition.id,
      petition.name,
      petition.locale,
      petition.deadline,
      clonePetitions,
      goToPetition,
    ]
  );

  const createPetition = useCreatePetition();
  const handleSaveAsTemplate = useCallback(
    async function () {
      try {
        const templateId = await createPetition({
          petitionId: petition.id,
          type: "TEMPLATE",
        });
        goToPetition(templateId, "compose");
      } catch {}
    },
    [petition.id, createPetition, goToPetition]
  );

  const {
    isOpen: isSharePetitionOpen,
    onOpen: onOpenSharePetition,
    onClose: onCloseSharePetition,
  } = useDisclosure();

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
  return (
    <>
      <Box
        backgroundColor="white"
        borderBottom="2px solid"
        borderBottomColor="gray.200"
        position="relative"
        height={{ base: 24, md: 16 }}
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
                  16 /* heading padding left */ +
                  18 /* petition status icon width */ +
                  28 /* locale badge width + margins + padding */ +
                  4 /* petition status icon margin right */ +
                  16 /* petition name padding l+r */ +
                  40 /* more options button width */ +
                  16 /* heading padding right */
                }px)`,
                sm: `calc(100vw - ${
                  96 /* left navbar width */ +
                  16 /* heading padding left */ +
                  18 /* petition status icon width */ +
                  28 /* locale badge width + margins + padding */ +
                  4 /* petition status icon margin right */ +
                  16 /* petition name padding l+r */ +
                  40 /* more options button width */ +
                  16 /* heading padding right */
                }px)`,
                md: `calc((100vw - ${
                  96 /* left navbar width */ + 307 /* tabs width */
                }px)/2 - ${
                  16 /* heading padding left */ +
                  18 /* petition status icon width */ +
                  28 /* locale badge width + margins + padding */ +
                  16 /* heading padding right */
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
            <Box>
              <Menu id="petition-more-options-menu">
                <Tooltip
                  placement="left"
                  label={intl.formatMessage({
                    id: "generic.more-options",
                    defaultMessage: "More options...",
                  })}
                >
                  <MenuButton
                    as={IconButton}
                    variant="ghost"
                    icon={<MoreVerticalIcon />}
                    aria-label={intl.formatMessage({
                      id: "generic.more-options",
                      defaultMessage: "More options...",
                    })}
                  />
                </Tooltip>
                <MenuList>
                  <MenuItem onClick={onOpenSharePetition}>
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
                      id="component.petition-header.clone-as-template-button"
                      defaultMessage="Clone as template"
                    />
                  </MenuItem>
                  <MenuItem onClick={onOpenSettings}>
                    <SettingsIcon marginRight={2} />
                    <FormattedMessage
                      id="component.petition-header.settings-button"
                      defaultMessage="Petition settings"
                    />
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem color="red.500" onClick={handleDeleteClick}>
                    <DeleteIcon marginRight={2} />
                    <FormattedMessage
                      id="component.petition-header.delete-label"
                      defaultMessage="Delete petition"
                    />
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>
          </Stack>
        </Flex>
        <Flex
          position="absolute"
          bottom="0"
          left="50%"
          transform="translateX(-50%)"
          direction="row"
          marginBottom="-2px"
        >
          {sections.map(({ section, label, isDisabled, popoverContent }) => {
            return isDisabled ? (
              <PetitionHeaderTab
                key={section}
                active={current === section}
                isDisabled
                popoverContent={popoverContent}
              >
                {label}
              </PetitionHeaderTab>
            ) : (
              <NakedLink
                key={section}
                href={`/app/petitions/[petitionId]/${section}`}
                as={`/app/petitions/${petition.id}/${section}`}
              >
                <PetitionHeaderTab active={current === section}>
                  {label}
                </PetitionHeaderTab>
              </NakedLink>
            );
          })}
        </Flex>
      </Box>
      <PetitionSettingsModal
        onUpdatePetition={onUpdatePetition}
        petition={petition}
        isOpen={isSettingsOpen}
        onClose={onCloseSettings}
      />
      {isSharePetitionOpen ? (
        <PetitionSharingModal
          petitionId={petition.id}
          userId={user.id}
          isOpen={true}
          onClose={onCloseSharePetition}
        />
      ) : null}
    </>
  );
}

type PetitionHeaderTabProps = ExtendChakra<{
  active?: boolean;
  isDisabled?: boolean;
  popoverContent?: ReactNode;
  children: ReactNode;
}>;

const PetitionHeaderTab = forwardRef(function (
  {
    active,
    isDisabled,
    children,
    popoverContent,
    ...props
  }: PetitionHeaderTabProps,
  ref: Ref<any>
) {
  const link = (
    <Box
      as="a"
      ref={ref}
      display="block"
      paddingY={3}
      paddingX={4}
      fontSize="sm"
      textTransform="uppercase"
      borderBottom="2px solid"
      borderBottomColor={active ? "purple.500" : "transparent"}
      fontWeight="bold"
      cursor={isDisabled ? "not-allowed" : "pointer"}
      opacity={isDisabled ? 0.4 : 1}
      color={active ? "gray.900" : "gray.500"}
      _hover={
        isDisabled
          ? {}
          : {
              color: "purple.700",
            }
      }
      {...(active ? { "aria-current": "page" } : {})}
      {...props}
    >
      {children}
    </Box>
  );
  if (isDisabled) {
    return (
      <SmallPopover placement="right" content={popoverContent ?? null}>
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
        id
      }
      owner {
        id
      }
      ...HeaderNameEditable_PetitionBase
      ...PetitionSettingsModal_PetitionBase
    }
    ${PetitionSettingsModal.fragments.Petition}
    ${HeaderNameEditable.fragments.PetitionBase}
  `,
  User: gql`
    fragment PetitionHeader_User on User {
      id
    }
  `,
};
