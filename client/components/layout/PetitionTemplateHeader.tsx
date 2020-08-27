import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Tooltip,
  useDisclosure,
  Badge,
} from "@chakra-ui/core";
import {
  CopyIcon,
  DeleteIcon,
  MoreVerticalIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import {
  ConfirmDeletePetitionsDialog,
  useConfirmDeletePetitionsDialog,
} from "@parallel/components/petition-common/ConfirmDeletePetitionsDialog";
import {
  PetitionTemplateHeader_PetitionTemplateFragment,
  PetitionTemplateHeader_UserFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useClonePetition } from "@parallel/utils/mutations/useClonePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useErrorDialog } from "../common/ErrorDialog";
import { Spacer } from "../common/Spacer";
import { PetitionSharingModal } from "../petition-common/PetitionSharingModal";
import { HeaderNameEditable } from "./HeaderNameEditable";

export type PetitionTemplateHeaderProps = BoxProps & {
  petition: PetitionTemplateHeader_PetitionTemplateFragment;
  user: PetitionTemplateHeader_UserFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  state: "SAVED" | "SAVING" | "ERROR";
};

export function PetitionTemplateHeader({
  petition,
  user,
  onUpdatePetition,
  state,
  ...props
}: PetitionTemplateHeaderProps) {
  const intl = useIntl();
  const router = useRouter();

  const deletePetitions = useDeletePetitions();
  const confirmDelete = useConfirmDeletePetitionsDialog();
  const showErrorDialog = useErrorDialog();
  const handleDeleteClick = useCallback(
    async function () {
      try {
        if (
          petition.owner.id === user.id &&
          petition.userPermissions.length > 1
        ) {
          showErrorDialog({
            message: (
              <FormattedMessage
                id="template.shared-delete-error"
                defaultMessage="{count, plural, =1 {The template} other {The templates}} you want to delete {count, plural, =1 {is} other {are}} shared with other users. Please transfer the ownership or remove the shared access first."
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
    [petition.id, petition.name, petition.locale]
  );

  const {
    isOpen: isSharePetitionOpen,
    onOpen: onOpenSharePetition,
    onClose: onCloseSharePetition,
  } = useDisclosure();
  return (
    <>
      <Box
        backgroundColor="white"
        borderBottom="2px solid"
        borderBottomColor="gray.200"
        position="relative"
        {...props}
      >
        <Flex height={16} alignItems="center" paddingX={4}>
          <Flex alignItems="center">
            <Badge colorScheme="purple" marginRight={1}>
              <FormattedMessage
                id="generic.template"
                defaultMessage="Template"
              />
            </Badge>
            <HeaderNameEditable
              petition={petition}
              state={state}
              onNameChange={(name) => onUpdatePetition({ name: name || null })}
              maxWidth={{
                base: `calc(100vw - ${16 + 72 + 4 + 16 + 40 + 16}px)`,
                sm: `calc(100vw - ${96 + 16 + 72 + 4 + 16 + 40 + 16}px)`,
                md: `calc((100vw - ${96 + 307}px)/2 - ${16 + 72 + 16}px)`,
              }}
              placeholder={
                petition.name
                  ? ""
                  : intl.formatMessage({
                      id: "generic.untitled-template",
                      defaultMessage: "Untitled template",
                    })
              }
              aria-label={intl.formatMessage({
                id: "petition.template-name-label",
                defaultMessage: "Template name",
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
                      id="component.template-header.share-label"
                      defaultMessage="Share template"
                    />
                  </MenuItem>
                  <MenuItem onClick={handleCloneClick}>
                    <CopyIcon marginRight={2} />
                    <FormattedMessage
                      id="component.template-header.clone-label"
                      defaultMessage="Clone template"
                    />
                  </MenuItem>
                  <MenuItem color="red.500" onClick={handleDeleteClick}>
                    <DeleteIcon marginRight={2} />
                    <FormattedMessage
                      id="component.petition-template.delete-label"
                      defaultMessage="Delete template"
                    />
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>
          </Stack>
        </Flex>
      </Box>
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

PetitionTemplateHeader.fragments = {
  PetitionTemplate: gql`
    fragment PetitionTemplateHeader_PetitionTemplate on PetitionTemplate {
      id
      locale
      userPermissions {
        id
      }
      owner {
        id
      }
      ...HeaderNameEditable_PetitionBase
      ...ConfirmDeletePetitionsDialog_PetitionBase
    }
    ${ConfirmDeletePetitionsDialog.fragments.PetitionBase}
    ${HeaderNameEditable.fragments.PetitionBase}
  `,
  User: gql`
    fragment PetitionTemplateHeader_User on User {
      id
    }
  `,
};
