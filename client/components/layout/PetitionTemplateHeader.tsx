import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/core";
import {
  CopyIcon,
  DeleteIcon,
  MoreVerticalIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import {
  PetitionTemplateHeader_PetitionTemplateFragment,
  PetitionTemplateHeader_UserFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { LocaleBadge } from "../common/LocaleBadge";
import { Spacer } from "../common/Spacer";
import { PetitionSharingModal } from "../petition-common/PetitionSharingModal";
import { HeaderNameEditable } from "./HeaderNameEditable";

export type PetitionTemplateHeaderProps = ExtendChakra<{
  petition: PetitionTemplateHeader_PetitionTemplateFragment;
  user: PetitionTemplateHeader_UserFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  state: "SAVED" | "SAVING" | "ERROR";
}>;

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
  const handleDeleteClick = useCallback(
    async function () {
      try {
        await deletePetitions([petition.id]);
        router.push(`/${router.query.locale}/app/petitions/`);
      } catch {}
    },
    [petition.id, deletePetitions, router]
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
    [petition.id, clonePetitions, goToPetition]
  );

  const createPetition = useCreatePetition();
  const handleUseTemplate = useCallback(
    async function () {
      try {
        const petitionId = await createPetition({
          petitionId: petition.id,
        });
        goToPetition(petitionId, "compose");
      } catch {}
    },
    [petition.id, clonePetitions, goToPetition]
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
          <Badge colorScheme="purple" marginRight={1}>
            <FormattedMessage id="generic.template" defaultMessage="Template" />
          </Badge>
          <LocaleBadge locale={petition.locale} marginLeft={1} />
          <HeaderNameEditable
            petition={petition}
            state={state}
            onNameChange={(name) => onUpdatePetition({ name: name || null })}
            maxWidth={{
              base: `calc(100vw - ${
                71 /* 'template' badge width */ +
                24 /* locale badge width */ +
                16 /* petition name padding l+r */ +
                16 /* heading padding left */ +
                164 /* use this template button width */ +
                40 /* more options button width */ +
                16 /* more options button margin left */ +
                16 /* heading padding right */
              }px)`,
              sm: `calc(100vw - ${
                96 /* left navbar width */ +
                71 /* 'template' badge width */ +
                24 /* locale badge width */ +
                16 /* petition name padding l+r */ +
                16 /* heading padding left */ +
                164 /* use this template button width */ +
                40 /* more options button width */ +
                16 /* more options button margin left */ +
                16 /* heading padding right */
              }px)`,
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
          <Spacer minWidth={4} />
          <Button
            colorScheme="purple"
            flexShrink={0}
            onClick={handleUseTemplate}
          >
            <FormattedMessage
              id="component.template-header.use-template"
              defaultMessage="Use this template"
            />
          </Button>
          <Menu>
            <Tooltip
              placement="left"
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
                marginLeft={4}
                aria-label={intl.formatMessage({
                  id: "generic.more-options",
                  defaultMessage: "More options...",
                })}
              />
            </Tooltip>
            <Portal>
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
                <MenuDivider />
                <MenuItem color="red.500" onClick={handleDeleteClick}>
                  <DeleteIcon marginRight={2} />
                  <FormattedMessage
                    id="component.petition-template.delete-label"
                    defaultMessage="Delete template"
                  />
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </Flex>
      </Box>
      <PetitionSharingModal
        petitionId={petition.id}
        userId={user.id}
        isOpen={isSharePetitionOpen}
        onClose={onCloseSharePetition}
      />
    </>
  );
}

PetitionTemplateHeader.fragments = {
  PetitionTemplate: gql`
    fragment PetitionTemplateHeader_PetitionTemplate on PetitionTemplate {
      id
      locale
      ...HeaderNameEditable_PetitionBase
    }
    ${HeaderNameEditable.fragments.PetitionBase}
  `,
  User: gql`
    fragment PetitionTemplateHeader_User on User {
      id
    }
  `,
};
