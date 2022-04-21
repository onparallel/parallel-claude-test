import { gql } from "@apollo/client";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  HStack,
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
  CopyIcon,
  EditIcon,
  LinkIcon,
  MoreVerticalIcon,
  PaperPlaneIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { HtmlBlock } from "@parallel/components/common/HtmlBlock";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { TemplateActiveSettingsIcons } from "@parallel/components/petition-new/TemplateActiveSettingsIcons";
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
  isFromPublicTemplates?: boolean;
}

export function TemplateDetailsModal({
  me,
  template,
  isFromPublicTemplates,
  ...props
}: TemplateDetailsModalProps) {
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
    goToPetition(petitionId, "preview", { query: { new: "true" } });
  };

  const handleCloneTemplate = async () => {
    const [petitionId] = await clonePetitions({
      petitionIds: [template.id],
    });
    goToPetition(petitionId, "compose", { query: { new: "true" } });
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
          <ModalHeader
            paddingLeft={6}
            paddingTop={6}
            paddingRight={12}
            paddingBottom={0}
            as={Stack}
            spacing={2}
          >
            <Text as="span" fontSize="sm" fontWeight="normal" color="gray.600">
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
            {template.name ? (
              <Text as="div" fontSize="lg" noOfLines={2}>
                {template.name}
              </Text>
            ) : (
              <Text>
                <FormattedMessage id="generic.unnamed-template" defaultMessage="Unnamed template" />
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton
            aria-label={intl.formatMessage({
              id: "generic.close",
              defaultMessage: "Close",
            })}
          />
          <ModalBody paddingBottom={6} paddingTop={4}>
            <Flex alignItems="center">
              <TemplateActiveSettingsIcons template={template} spacing={4} />
              {isFromPublicTemplates ? null : (
                <HStack marginLeft={6}>
                  <Text>
                    <FormattedMessage
                      id="component.template-details-modal.shared-with"
                      defaultMessage="Shared with:"
                    />
                  </Text>
                  <UserAvatarList
                    usersOrGroups={template!.permissions.map((p) =>
                      p.__typename === "PetitionUserPermission"
                        ? p.user
                        : p.__typename === "PetitionUserGroupPermission"
                        ? p.group
                        : (null as never)
                    )}
                  />
                </HStack>
              )}
            </Flex>
            <Flex marginY={6} flexDirection={{ base: "column-reverse", md: "row" }} gridGap={3}>
              <Box flex="1">
                {template.isPublic ? (
                  <Button width="100%" onClick={handleCloneTemplate} leftIcon={<CopyIcon />}>
                    <FormattedMessage
                      id="component.template-details-modal.save-to-edit"
                      defaultMessage="Save to edit"
                    />
                  </Button>
                ) : template.publicLink?.isActive ? (
                  <Button
                    width="100%"
                    leftIcon={<LinkIcon />}
                    onClick={() => onCopyPublicLink({ value: template.publicLink!.url })}
                  >
                    <FormattedMessage id="generic.copy-link" defaultMessage="Copy link" />
                  </Button>
                ) : (
                  <Button
                    width="100%"
                    onClick={handlePetitionSharingClick}
                    leftIcon={<UserArrowIcon />}
                  >
                    <FormattedMessage
                      id="component.template-header.share-label"
                      defaultMessage="Share template"
                    />
                  </Button>
                )}
              </Box>
              <HStack flex="1" spacing={3}>
                <Button
                  width="100%"
                  data-action="use-template"
                  colorScheme="purple"
                  leftIcon={<PaperPlaneIcon />}
                  onClick={handleCreatePetition}
                >
                  <FormattedMessage id="generic.use-template" defaultMessage="Use template" />
                </Button>
                {isFromPublicTemplates && !template.publicLink?.isActive ? null : (
                  <Menu placement="bottom-end">
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
                      <MenuList width="min-content">
                        {hasAccess && template.publicLink?.isActive ? (
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
                        {!isFromPublicTemplates ? (
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
                        ) : null}
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
                        {template.publicLink?.isActive && isFromPublicTemplates ? (
                          <MenuItem
                            justifyContent="left"
                            icon={<LinkIcon display="block" boxSize={4} />}
                            onClick={() => onCopyPublicLink({ value: template.publicLink!.url })}
                          >
                            <FormattedMessage id="generic.copy-link" defaultMessage="Copy link" />
                          </MenuItem>
                        ) : null}
                      </MenuList>
                    </Portal>
                  </Menu>
                )}
              </HStack>
            </Flex>
            <Accordion
              defaultIndex={[template.descriptionHtml ? 0 : 1]}
              sx={{
                Button: {
                  _hover: { backgroundColor: "gray.75" },
                },
              }}
            >
              <AccordionItem borderTop="none">
                <AccordionButton>
                  <Text as="b" flex="1" textAlign="left">
                    <FormattedMessage
                      id="component.template-details-modal.about"
                      defaultMessage="About this template"
                    />
                  </Text>
                  <AccordionIcon />
                </AccordionButton>

                <AccordionPanel paddingBottom={3}>
                  {template.descriptionHtml ? (
                    <HtmlBlock html={template.descriptionHtml} />
                  ) : (
                    <Text textAlign="center" textStyle="hint">
                      <FormattedMessage
                        id="component.template-details-modal.no-description-provided"
                        defaultMessage="No description provided."
                      />
                    </Text>
                  )}
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionButton>
                  <Text as="b" flex="1" textAlign="left">
                    <FormattedMessage
                      id="component.template-details-modal.content"
                      defaultMessage="Content"
                    />
                  </Text>
                  <AccordionIcon />
                </AccordionButton>

                <AccordionPanel paddingLeft={7} paddingBottom={3}>
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
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
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
      isPublic
      permissions {
        ... on PetitionUserPermission {
          user {
            ...UserAvatarList_User
          }
        }
        ... on PetitionUserGroupPermission {
          group {
            ...UserAvatarList_UserGroup
          }
        }
      }
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
      ...TemplateActiveSettingsIcons_PetitionTemplate
      updatedAt
    }
    ${TemplateActiveSettingsIcons.fragments.PetitionTemplate}
  `,
};
