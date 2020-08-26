import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
  MenuDivider,
} from "@chakra-ui/core";
import {
  CopyIcon,
  DeleteIcon,
  MoreVerticalIcon,
  SettingsIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import {
  ConfirmDeletePetitionsDialog,
  useConfirmDeletePetitionsDialog,
} from "@parallel/components/petition-common/ConfirmDeletePetitionsDialog";
import {
  PetitionHeader_PetitionFragment,
  PetitionHeader_UserFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useClonePetition } from "@parallel/utils/mutations/useClonePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { useRouter } from "next/router";
import {
  forwardRef,
  ReactNode,
  Ref,
  useCallback,
  useMemo,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { PetitionStatusIcon } from "../common/PetitionStatusIcon";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { PetitionSettingsModal } from "../petition-common/PetitionSettingsModal";
import { PetitionSharingModal } from "../petition-common/PetitionSharingModal";
import { useErrorDialog } from "../common/ErrorDialog";

export type PetitionHeaderProps = BoxProps & {
  petition: PetitionHeader_PetitionFragment;
  user: PetitionHeader_UserFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: "compose" | "replies" | "activity";
  state: "SAVED" | "SAVING" | "ERROR";
};

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
  const [name, setName] = useState(petition.name ?? "");
  const {
    isOpen: isSettingsOpen,
    onOpen: onOpenSettings,
    onClose: onCloseSettings,
  } = useDisclosure();

  const deletePetitions = useDeletePetitions();
  const confirmDelete = useConfirmDeletePetitionsDialog();
  const showErrorDialog = useErrorDialog();
  const handleDeleteClick = useCallback(
    async function () {
      try {
        if (petition.owner.id === user.id) {
          showErrorDialog({
            message: (
              <FormattedMessage
                id="petition.shared-delete-error"
                defaultMessage="{count, plural, =1 {The petition} other {The petitions}} you want to delete {count, plural, =1 {is} other {are}} shared with other users. Please transfer the ownership or remove the shared access first."
                values={{
                  count: 1,
                }}
              />
            ),
          });
        } else {
          await confirmDelete({
            selected: [petition],
          });
          await deletePetitions({
            variables: { ids: [petition.id]! },
          });
          router.push(
            `/[locale]/app/petitions/`,
            `/${router.query.locale}/app/petitions/`
          );
        }
      } catch {}
    },
    [petition.id, petition.name]
  );

  const clonePetition = useClonePetition();
  const handleCloneClick = useCallback(
    async function () {
      try {
        const { data } = await clonePetition({
          variables: {
            petitionId: petition.id,
            name: petition.name
              ? `${petition.name} (${intl.formatMessage({
                  id: "petition.copy",
                  defaultMessage: "copy",
                })})`
              : "",
            locale: petition.locale,
            deadline: petition.deadline,
          },
        });
        router.push(
          `/[locale]/app/petitions/[petitionId]/compose`,
          `/${router.query.locale}/app/petitions/${
            data!.clonePetition.id
          }/compose`
        );
      } catch {}
    },
    [petition.id, petition.name, petition.locale, petition.deadline]
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
            <Editable
              display="flex"
              value={name}
              onChange={setName}
              fontSize="xl"
              maxWidth={{
                base: `calc(100vw - ${16 + 18 + 16 + 40 + 16}px)`,
                sm: `calc(100vw - ${96 + 16 + 18 + 16 + 40 + 16}px)`,
                md: `calc((100vw - ${96 + 307}px)/2 - ${16 + 18 + 16}px)`,
              }}
              onSubmit={() => onUpdatePetition({ name: name || null })}
              placeholder={
                name
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
            >
              {({ isEditing }: { isEditing: boolean }) => (
                <>
                  <Flex flex="1 1 auto" minWidth={0} padding={1}>
                    <EditablePreview
                      paddingY={1}
                      paddingX={2}
                      display="block"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    />
                    <EditableInput paddingY={1} paddingX={2} maxLength={255} />
                  </Flex>
                  {!isEditing && (
                    <Flex
                      alignItems="center"
                      fontSize="sm"
                      position="relative"
                      display={{ base: "flex", md: "none", lg: "flex" }}
                      top="3px"
                    >
                      {state === "SAVING" ? (
                        <Text color="gray.500" fontSize="xs" fontStyle="italic">
                          <FormattedMessage
                            id="generic.saving-changes"
                            defaultMessage="Saving..."
                          />
                        </Text>
                      ) : state === "SAVED" ? (
                        <Tooltip
                          label={intl.formatMessage(
                            {
                              id: "petition.header.last-saved-on",
                              defaultMessage: "Last saved on: {date}",
                            },
                            {
                              date: intl.formatDate(
                                petition.updatedAt,
                                FORMATS.FULL
                              ),
                            }
                          )}
                        >
                          <Text
                            color="gray.500"
                            fontSize="xs"
                            fontStyle="italic"
                          >
                            <FormattedMessage
                              id="generic.changes-saved"
                              defaultMessage="Saved"
                            />
                          </Text>
                        </Tooltip>
                      ) : state === "ERROR" ? (
                        <Text color="red.500" fontSize="xs" fontStyle="italic">
                          <FormattedMessage
                            id="petition.status.error"
                            defaultMessage="Error"
                          />
                        </Text>
                      ) : null}
                    </Flex>
                  )}
                </>
              )}
            </Editable>
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
                  <MenuItem color="red.500" onClick={handleDeleteClick}>
                    <DeleteIcon marginRight={2} />
                    <FormattedMessage
                      id="component.petition-header.delete-label"
                      defaultMessage="Delete petition"
                    />
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={onOpenSettings}>
                    <SettingsIcon marginRight={2} />
                    <FormattedMessage
                      id="component.petition-header.settings-button"
                      defaultMessage="Petition settings"
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

type PetitionHeaderTabProps = BoxProps & {
  active?: boolean;
  isDisabled?: boolean;
  popoverContent?: ReactNode;
  children: ReactNode;
};

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
      name
      locale
      status
      updatedAt
      ...PetitionSettingsModal_Petition
      ...ConfirmDeletePetitionsDialog_Petition
      owner {
        id
      }
    }
    ${PetitionSettingsModal.fragments.Petition}
    ${ConfirmDeletePetitionsDialog.fragments.Petition}
  `,
  User: gql`
    fragment PetitionHeader_User on User {
      id
    }
  `,
};
