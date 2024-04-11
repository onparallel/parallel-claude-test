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
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  CopyIcon,
  EditIcon,
  EyeIcon,
  LinkIcon,
  PaperPlaneIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { DateTime } from "@parallel/components/common/DateTime";
import { HtmlBlock } from "@parallel/components/common/HtmlBlock";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { RestrictedFeaturePopover } from "@parallel/components/common/RestrictedFeaturePopover";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { TemplateActiveSettingsIcons } from "@parallel/components/petition-new/TemplateActiveSettingsIcons";
import {
  PetitionFieldTitleContent_PetitionFieldFragment,
  TemplateDetailsModal_PetitionTemplateFragment,
} from "@parallel/graphql/__types";
import { useGetMyId } from "@parallel/utils/apollo/getMyId";
import { FORMATS } from "@parallel/utils/dates";
import { PetitionFieldIndex, useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { Fragment, MouseEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";
import { usePetitionSharingDialog } from "./PetitionSharingDialog";

export interface TemplateDetailsModalProps extends Omit<ModalProps, "children"> {
  template: TemplateDetailsModal_PetitionTemplateFragment;
  isFromPublicTemplates?: boolean;
}

export function TemplateDetailsModal({
  template,
  isFromPublicTemplates,
  ...props
}: TemplateDetailsModalProps) {
  const intl = useIntl();

  const hasAccess = Boolean(
    template.myEffectivePermission &&
      ["OWNER", "WRITE"].includes(template.myEffectivePermission.permissionType),
  );

  const fieldsWithIndices = useFieldsWithIndices(template.fields);

  const myId = useGetMyId();
  const userCanClone = useHasPermission("PETITIONS:CREATE_TEMPLATES");
  const userCanCreatePetition = useHasPermission("PETITIONS:CREATE_PETITIONS");
  const userCanViewPublicTemplates = useHasPermission("PETITIONS:LIST_PUBLIC_TEMPLATES");

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
    goToPetition(petitionId, "preview", { query: { new: "", fromTemplate: "" } });
  };

  const handleCloneTemplate = async (event: MouseEvent) => {
    const [petitionId] = await clonePetitions({
      petitionIds: [template.id],
    });
    goToPetition(petitionId, "compose", { query: { new: "" }, event });
  };

  const handleEditTemplate = async (event: MouseEvent) => {
    goToPetition(template.id, "compose", { event });
  };

  const handlePreviewTemplate = async (event: MouseEvent) => {
    goToPetition(template.id, "preview", { event });
  };

  const showPetitionSharingDialog = usePetitionSharingDialog();
  const handlePetitionSharingClick = async () => {
    try {
      const res = await showPetitionSharingDialog({
        userId: myId,
        petitionIds: [template.id],
        type: "TEMPLATE",
      });
      if (res?.close) {
        props.onClose();
      }
    } catch {}
  };

  return (
    <Modal size="4xl" {...props}>
      <ModalOverlay>
        <ModalContent data-template-id={template.id}>
          <ModalHeader
            paddingStart={6}
            paddingTop={6}
            paddingEnd={12}
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
            data-testid="close-template-modal-button"
            aria-label={intl.formatMessage({
              id: "generic.close",
              defaultMessage: "Close",
            })}
          />
          <ModalBody paddingBottom={6} paddingTop={4}>
            <Flex alignItems="center">
              <TemplateActiveSettingsIcons template={template} spacing={4} />
              {isFromPublicTemplates ? null : (
                <HStack marginStart={6}>
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
                          : (null as never),
                    )}
                  />
                </HStack>
              )}
            </Flex>
            <Flex marginY={6} flexDirection={{ base: "column-reverse", md: "row" }} gridGap={3}>
              <Box flex="1">
                {template.isPublic ? (
                  <RestrictedFeaturePopover
                    width="100%"
                    isRestricted={!userCanCreatePetition || !userCanViewPublicTemplates}
                  >
                    <Button
                      width="100%"
                      data-testid="create-parallel-button"
                      data-action="use-template"
                      leftIcon={<PaperPlaneIcon />}
                      isDisabled={!userCanCreatePetition || !userCanViewPublicTemplates}
                      onClick={handleCreatePetition}
                    >
                      <FormattedMessage
                        id="generic.create-petition"
                        defaultMessage="Create parallel"
                      />
                    </Button>
                  </RestrictedFeaturePopover>
                ) : (
                  <Button width="100%" leftIcon={<EyeIcon />} onClick={handlePreviewTemplate}>
                    <FormattedMessage
                      id="component.template-details-modal.preview-template"
                      defaultMessage="Preview template"
                    />
                  </Button>
                )}
              </Box>
              <HStack flex="1" spacing={3}>
                {template.isPublic ? (
                  <RestrictedFeaturePopover
                    width="100%"
                    isRestricted={!userCanClone || !userCanViewPublicTemplates}
                  >
                    <Button
                      width="100%"
                      colorScheme="primary"
                      isDisabled={!userCanClone || !userCanViewPublicTemplates}
                      onClick={handleCloneTemplate}
                      leftIcon={<CopyIcon />}
                    >
                      <FormattedMessage
                        id="component.template-details-modal.save-to-edit"
                        defaultMessage="Save to edit"
                      />
                    </Button>
                  </RestrictedFeaturePopover>
                ) : template.publicLink?.isActive ? (
                  <Button
                    width="100%"
                    colorScheme="primary"
                    leftIcon={<LinkIcon />}
                    onClick={() => onCopyPublicLink({ value: template.publicLink!.url })}
                  >
                    <FormattedMessage id="generic.copy-link" defaultMessage="Copy link" />
                  </Button>
                ) : (
                  <RestrictedFeaturePopover width="100%" isRestricted={!userCanCreatePetition}>
                    <Button
                      width="100%"
                      data-testid="create-parallel-button"
                      data-action="use-template"
                      colorScheme="primary"
                      leftIcon={<PaperPlaneIcon />}
                      isDisabled={!userCanCreatePetition}
                      onClick={handleCreatePetition}
                    >
                      <FormattedMessage
                        id="generic.create-petition"
                        defaultMessage="Create parallel"
                      />
                    </Button>
                  </RestrictedFeaturePopover>
                )}
                {isFromPublicTemplates && !template.publicLink?.isActive ? null : (
                  <MoreOptionsMenuButton
                    variant="outline"
                    data-testid="template-more-options-button"
                    options={
                      <MenuList width="min-content">
                        {template.publicLink?.isActive ? (
                          <MenuItem
                            onClick={handleCreatePetition}
                            data-testid="create-parallel-button"
                            icon={<PaperPlaneIcon display="block" boxSize={4} />}
                            isDisabled={!userCanCreatePetition}
                          >
                            <FormattedMessage
                              id="generic.create-petition"
                              defaultMessage="Create parallel"
                            />
                          </MenuItem>
                        ) : null}
                        {hasAccess ? (
                          <MenuItem
                            onClick={handlePetitionSharingClick}
                            data-testid="share-template-button"
                            icon={<UserArrowIcon display="block" boxSize={4} />}
                          >
                            <FormattedMessage
                              id="component.petition-header.share-label-template"
                              defaultMessage="Share template"
                            />
                          </MenuItem>
                        ) : null}
                        {!isFromPublicTemplates ? (
                          <MenuItem
                            onClick={handleCloneTemplate}
                            data-testid="duplicate-template-button"
                            icon={<CopyIcon display="block" boxSize={4} />}
                            isDisabled={!userCanClone}
                          >
                            <FormattedMessage
                              id="component.template-details-modal.duplicate-template"
                              defaultMessage="Duplicate template"
                            />
                          </MenuItem>
                        ) : null}
                        {hasAccess ? (
                          <MenuItem
                            data-testid="edit-template-button"
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
                    }
                  />
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
                    <HtmlBlock dangerousInnerHtml={template.descriptionHtml} />
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

                <AccordionPanel paddingStart={7} paddingBottom={3}>
                  {fieldsWithIndices.map(([field, fieldIndex, childrenFieldIndices]) => {
                    if (field.type === "HEADING") {
                      if (!field.title) {
                        return null;
                      } else {
                        return (
                          <Text key={field.id} fontWeight="bold" marginBottom={2}>
                            {fieldIndex}.{" "}
                            <Text as="span" fontWeight="bold">
                              {field.title}
                            </Text>
                          </Text>
                        );
                      }
                    }
                    return (
                      <Fragment key={field.id}>
                        <PetitionFieldTitleContent
                          field={field}
                          index={fieldIndex}
                          marginStart={4}
                          marginBottom={2}
                        />
                        {field.type === "FIELD_GROUP" && field.children?.length
                          ? zip(field.children!, childrenFieldIndices!).map(
                              ([field, fieldIndex]) => (
                                <PetitionFieldTitleContent
                                  key={field.id}
                                  field={field}
                                  index={fieldIndex}
                                  marginStart={7}
                                  marginBottom={2}
                                />
                              ),
                            )
                          : null}
                      </Fragment>
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

export interface PetitionFieldTitleContentProps {
  index: string | PetitionFieldIndex;
  field: PetitionFieldTitleContent_PetitionFieldFragment;
}

export const PetitionFieldTitleContent = Object.assign(
  chakraForwardRef<"p", PetitionFieldTitleContentProps>(function PetitionFieldTitleContent(
    { index, field, ...props },
    ref,
  ) {
    return (
      <Text {...props} ref={ref}>
        {index}.{" "}
        {field.title ? (
          <Text as="span" aria-label={field.title}>
            {field.title}
          </Text>
        ) : (
          <Text as="span" textStyle="hint">
            <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
          </Text>
        )}
      </Text>
    );
  }),
  {
    fragments: {
      PetitionField: gql`
        fragment PetitionFieldTitleContent_PetitionField on PetitionField {
          id
          title
        }
      `,
    },
  },
);

TemplateDetailsModal.fragments = {
  PetitionTemplate: gql`
    fragment TemplateDetailsModal_PetitionTemplate on PetitionTemplate {
      id
      descriptionHtml
      name
      isPublic
      permissions {
        ... on PetitionUserPermission {
          user {
            id
            ...UserAvatarList_User
          }
        }
        ... on PetitionUserGroupPermission {
          group {
            id
            ...UserAvatarList_UserGroup
          }
        }
      }
      fields {
        id
        title
        type
        options
        ...PetitionFieldTitleContent_PetitionField
        children {
          ...PetitionFieldTitleContent_PetitionField
          type
        }
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
    ${PetitionFieldTitleContent.fragments.PetitionField}
    ${TemplateActiveSettingsIcons.fragments.PetitionTemplate}
  `,
};
