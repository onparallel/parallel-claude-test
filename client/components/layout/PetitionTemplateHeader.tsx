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
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  LockClosedIcon,
  MoreVerticalIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import {
  PetitionTemplateHeader_PetitionTemplateFragment,
  PetitionTemplateHeader_UserFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { usePetitionState } from "@parallel/utils/usePetitionState";
import { usePrintPdfTask } from "@parallel/utils/usePrintPdfTask";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { LocaleBadge } from "../common/LocaleBadge";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { usePetitionSharingDialog } from "../petition-common/dialogs/PetitionSharingDialog";
import { HeaderNameEditable } from "./HeaderNameEditable";
import { PetitionHeaderTab } from "./PetitionHeaderTab";
import { PetitionHeaderTabs } from "./PetitionHeaderTabs";

export interface PetitionTemplateHeaderProps extends BoxProps {
  petition: PetitionTemplateHeader_PetitionTemplateFragment;
  user: PetitionTemplateHeader_UserFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: "compose" | "preview" | "replies" | "activity";
}

export function PetitionTemplateHeader({
  petition,
  user,
  onUpdatePetition,
  section: current,
  ...props
}: PetitionTemplateHeaderProps) {
  const intl = useIntl();
  const router = useRouter();
  const state = usePetitionState();

  const deletePetitions = useDeletePetitions();
  const handleDeleteClick = async function () {
    try {
      await deletePetitions([petition.id]);
      router.push("/app/petitions");
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
      goToPetition(petitionId, "preview");
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
      },
      {
        section: "preview",
        label: intl.formatMessage({
          id: "petition.header.preview-tab",
          defaultMessage: "Preview",
        }),
      },
    ],
    [petition.isRestricted, intl.locale]
  );

  const handlePrintPdfTask = usePrintPdfTask();

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
            lg: `calc((100vw - ${
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
          <FormattedMessage id="generic.use-template" defaultMessage="Use template" />
        </Button>
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
              {user.hasPetitionPdfExport ? (
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
                isDisabled={user.role === "COLLABORATOR"}
              >
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
      <PetitionHeaderTabs>
        {sections.map(({ section, label, rightIcon }) => {
          return (
            <NakedLink key={section} href={`/app/petitions/${petition.id}/${section}`}>
              <PetitionHeaderTab isActive={current === section} rightIcon={rightIcon}>
                {label}
              </PetitionHeaderTab>
            </NakedLink>
          );
        })}
      </PetitionHeaderTabs>
    </Box>
  );
}

PetitionTemplateHeader.fragments = {
  PetitionTemplate: gql`
    fragment PetitionTemplateHeader_PetitionTemplate on PetitionTemplate {
      id
      locale
      isPublic
      isRestricted
      ...HeaderNameEditable_PetitionBase
    }
    ${HeaderNameEditable.fragments.PetitionBase}
  `,
  User: gql`
    fragment PetitionTemplateHeader_User on User {
      id
      role
      hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
    }
  `,
};
