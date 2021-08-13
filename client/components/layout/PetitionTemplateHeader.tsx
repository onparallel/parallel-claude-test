import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  BoxProps,
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
} from "@chakra-ui/react";
import { CopyIcon, DeleteIcon, MoreVerticalIcon, UserArrowIcon } from "@parallel/chakra/icons";
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
import { FormattedMessage, useIntl } from "react-intl";
import { LocaleBadge } from "../common/LocaleBadge";
import { Spacer } from "../common/Spacer";
import { usePetitionSharingDialog } from "../petition-common/PetitionSharingDialog";
import { HeaderNameEditable } from "./HeaderNameEditable";

export interface PetitionTemplateHeaderProps extends BoxProps {
  petition: PetitionTemplateHeader_PetitionTemplateFragment;
  user: PetitionTemplateHeader_UserFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  state: "SAVED" | "SAVING" | "ERROR";
}

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
  const handleUseTemplate = async function () {
    try {
      const petitionId = await createPetition({
        petitionId: petition.id,
      });
      goToPetition(petitionId, "compose");
    } catch {}
  };

  const showPetitionSharingDialog = usePetitionSharingDialog();
  const handlePetitionSharingClick = async function () {
    try {
      await showPetitionSharingDialog({
        userId: user.id,
        petitionIds: [petition.id],
        isTemplate: true,
      });
    } catch {}
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
        <Badge colorScheme="purple">
          <FormattedMessage id="generic.template" defaultMessage="Template" />
        </Badge>
        <LocaleBadge locale={petition.locale} marginLeft={2} />
        <HeaderNameEditable
          petition={petition}
          state={state}
          onNameChange={(name) => onUpdatePetition({ name: name || null })}
          maxWidth={{
            base: `calc(100vw - ${
              71 /* 'template' badge width */ +
              8 /* locale badge margin left */ +
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
              8 /* locale badge margin left */ +
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
        <Button colorScheme="purple" flexShrink={0} onClick={handleUseTemplate}>
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
              <MenuItem
                onClick={handlePetitionSharingClick}
                icon={<UserArrowIcon display="block" boxSize={4} />}
              >
                <FormattedMessage
                  id="component.template-header.share-label"
                  defaultMessage="Share template"
                />
              </MenuItem>
              <MenuItem onClick={handleCloneClick} icon={<CopyIcon display="block" boxSize={4} />}>
                <FormattedMessage
                  id="component.template-header.clone-label"
                  defaultMessage="Clone template"
                />
              </MenuItem>
              {petition.isPublic ? null : (
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
              )}
            </MenuList>
          </Portal>
        </Menu>
      </Flex>
    </Box>
  );
}

PetitionTemplateHeader.fragments = {
  PetitionTemplate: gql`
    fragment PetitionTemplateHeader_PetitionTemplate on PetitionTemplate {
      id
      locale
      isPublic
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
