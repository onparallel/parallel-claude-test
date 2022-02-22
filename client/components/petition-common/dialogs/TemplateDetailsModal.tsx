import { gql } from "@apollo/client";
import {
  Box,
  Button,
  ButtonGroup,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Portal,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  CopyIcon,
  EditIcon,
  LinkIcon,
  PaperPlaneIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { Divider } from "@parallel/components/common/Divider";
import {
  TemplateDetailsModal_PetitionTemplateFragment,
  TemplateDetailsModal_UserFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";
import { usePetitionSharingDialog } from "./PetitionSharingDialog";

export interface TemplateDetailsModalProps extends Omit<ModalProps, "children"> {
  me: TemplateDetailsModal_UserFragment;
  template: TemplateDetailsModal_PetitionTemplateFragment;
}

export function TemplateDetailsModal({ me, template, ...props }: TemplateDetailsModalProps) {
  const intl = useIntl();

  const hasAccess = Boolean(
    template.myEffectivePermission &&
      ["OWNER", "WRITE"].includes(template.myEffectivePermission.permissionType)
  );

  const filteredFields = template.fields.filter((field) =>
    field.type === "HEADING" && !field.title ? false : true
  );

  const indices = useFieldIndices(filteredFields);

  const onCopyPublicLink = useClipboardWithToast({
    text: intl.formatMessage({
      id: "component.petition-settings.link-copied-toast",
      defaultMessage: "Link copied to clipboard",
    }),
  });

  const createPetition = useCreatePetition();
  const clonePetitions = useClonePetitions();
  const goToPetition = useGoToPetition();

  const handleCreatePetition = async () => {
    const petitionId = await createPetition({
      petitionId: template.id,
    });
    goToPetition(petitionId, "preview");
  };

  const handleCloneTemplate = async () => {
    const [petitionId] = await clonePetitions({
      petitionIds: [template.id],
    });
    goToPetition(petitionId, "compose");
  };

  const handleEditTemplate = async () => {
    goToPetition(template.id, "compose");
  };

  const showPetitionSharingDialog = usePetitionSharingDialog();
  const handlePetitionSharingClick = async () => {
    try {
      await showPetitionSharingDialog({
        userId: me.id,
        petitionIds: [template.id],
        isTemplate: true,
      });
    } catch {}
  };

  return (
    <Modal size="4xl" {...props}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader paddingRight={12} paddingBottom={0}>
            {template.name ? (
              <Text as="div" noOfLines={2}>
                {template.name}
              </Text>
            ) : (
              <Text>
                <FormattedMessage
                  id="generic.untitled-template"
                  defaultMessage="Untitled template"
                />
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton
            aria-label={intl.formatMessage({
              id: "generic.close",
              defaultMessage: "Close",
            })}
          />
          <ModalBody>
            <Text as="span" fontSize="sm" fontWeight="normal">
              <FormattedMessage
                id="component.template-details-modal.created-by"
                defaultMessage="Created by {name} from {organization}."
                values={{
                  name: <strong>{template.owner.fullName}</strong>,
                  organization: template.owner.organization.name,
                }}
              />{" "}
              <FormattedMessage
                id="component.template-details-modal.last-updated-on"
                defaultMessage="Last updated on {date}."
                values={{
                  date: (
                    <DateTime
                      value={template.updatedAt}
                      format={FORMATS.LL}
                      title={intl.formatDate(template.updatedAt, FORMATS.LLL)}
                    />
                  ),
                }}
              />
            </Text>
            <Stack marginY={4} spacing={4} flexDirection={{ base: "column", md: "row-reverse" }}>
              <ButtonGroup isAttached>
                <Button
                  data-action="use-template"
                  justifyContent="left"
                  colorScheme="purple"
                  leftIcon={<PaperPlaneIcon />}
                  onClick={handleCreatePetition}
                >
                  <FormattedMessage id="generic.use-template" defaultMessage="Use template" />
                </Button>
                <Divider isVertical color="purple.600" />
                <Menu placement="bottom-end">
                  <Tooltip
                    label={intl.formatMessage({
                      id: "generic.more-options",
                      defaultMessage: "More options...",
                    })}
                  >
                    <MenuButton
                      as={IconButton}
                      colorScheme="purple"
                      icon={<ChevronDownIcon />}
                      aria-label={intl.formatMessage({
                        id: "generic.more-options",
                        defaultMessage: "More options...",
                      })}
                      minWidth={8}
                    />
                  </Tooltip>
                  <Portal>
                    <MenuList minWidth={0}>
                      {template.publicLink?.isActive && (
                        <MenuItem
                          justifyContent="left"
                          icon={<LinkIcon display="block" boxSize={4} />}
                          onClick={() => onCopyPublicLink({ value: template.publicLink!.url })}
                        >
                          <FormattedMessage id="generic.copy-link" defaultMessage="Copy link" />
                        </MenuItem>
                      )}
                      <MenuItem
                        onClick={handleCloneTemplate}
                        icon={<CopyIcon display="block" boxSize={4} />}
                        isDisabled={me.role === "COLLABORATOR"}
                      >
                        <FormattedMessage
                          id="component.template-details-modal.duplicate-template"
                          defaultMessage="Duplicate template"
                        />
                      </MenuItem>
                      {hasAccess ? (
                        <MenuItem
                          justifyContent="left"
                          type="submit"
                          onClick={handleEditTemplate}
                          icon={<EditIcon display="block" boxSize={4} />}
                        >
                          <FormattedMessage
                            id="component.template-details-modal.edit-template"
                            defaultMessage="Edit template"
                          />
                        </MenuItem>
                      ) : null}
                      {hasAccess ? (
                        <MenuItem
                          onClick={handlePetitionSharingClick}
                          icon={<UserArrowIcon display="block" boxSize={4} />}
                        >
                          <FormattedMessage
                            id="component.template-header.share-label"
                            defaultMessage="Share template"
                          />
                        </MenuItem>
                      ) : null}
                    </MenuList>
                  </Portal>
                </Menu>
              </ButtonGroup>
              <Heading flex="1" size="md">
                <FormattedMessage
                  id="component.template-details-modal.about"
                  defaultMessage="About this template"
                />
              </Heading>
            </Stack>
            {template.descriptionHtml ? (
              <Box
                sx={{
                  a: { color: "purple.600", _hover: { color: "purple.800" } },
                }}
                dangerouslySetInnerHTML={{ __html: template.descriptionHtml }}
              />
            ) : (
              <Text textAlign="center" textStyle="hint">
                <FormattedMessage
                  id="component.template-details-modal.no-description-provided"
                  defaultMessage="No description provided."
                />
              </Text>
            )}
            <Heading size="md" marginTop={8} marginBottom={4}>
              <FormattedMessage
                id="component.template-details-modal.fields-list"
                defaultMessage="Information list"
              />
            </Heading>
            <Box paddingLeft={8}>
              {zip(filteredFields, indices).map(([field, index]) => {
                return field.type === "HEADING" ? (
                  <Text key={field.id} fontWeight="bold" marginBottom={2}>
                    {index}.{" "}
                    <Text as="span" fontWeight="bold">
                      {field.title}
                    </Text>
                  </Text>
                ) : (
                  <Text key={field.id} marginLeft={4} marginBottom={2}>
                    {index}.{" "}
                    {field.title ? (
                      <Text as="span" aria-label={field.title}>
                        {field.title}
                      </Text>
                    ) : (
                      <Text as="span" textStyle="hint">
                        <FormattedMessage
                          id="generic.untitled-field"
                          defaultMessage="Untitled field"
                        />
                      </Text>
                    )}
                  </Text>
                );
              })}
            </Box>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}

TemplateDetailsModal.fragments = {
  User: gql`
    fragment TemplateDetailsModal_User on User {
      id
      role
    }
  `,
  PetitionTemplate: gql`
    fragment TemplateDetailsModal_PetitionTemplate on PetitionTemplate {
      id
      descriptionHtml
      name
      locale
      fields {
        id
        title
        type
        options
      }
      owner {
        id
        organization {
          id
          name
        }
        fullName
      }
      myEffectivePermission {
        permissionType
      }
      publicLink {
        id
        isActive
        slug
        url
      }
      updatedAt
    }
  `,
};
