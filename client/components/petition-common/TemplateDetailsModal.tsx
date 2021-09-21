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
} from "@parallel/chakra/icons";
import { TemplateDetailsModal_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";
import { DateTime } from "../common/DateTime";
import { Divider } from "../common/Divider";

export interface TemplateDetailsModalProps extends Omit<ModalProps, "children"> {
  template: TemplateDetailsModal_PetitionTemplateFragment;
}

export function TemplateDetailsModal({ template, ...props }: TemplateDetailsModalProps) {
  const intl = useIntl();

  const canEdit = Boolean(
    template.myEffectivePermission &&
      ["OWNER", "WRITE"].includes(template.myEffectivePermission.permissionType)
  );

  const indices = useFieldIndices(template.fields);

  const publicLinkURL = template.publicLink?.isActive
    ? `${process.env.NEXT_PUBLIC_PARALLEL_URL}/${template.locale}/pp/${template.publicLink.slug}`
    : undefined;

  const { onCopy: onCopyPublicLink } = useClipboardWithToast({
    value: publicLinkURL!,
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
    goToPetition(petitionId, "compose");
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
            right={3}
            aria-label={intl.formatMessage({
              id: "generic.close",
              defaultMessage: "Close",
            })}
          />
          <ModalBody>
            <Text as="span" fontSize="sm" fontWeight="normal">
              <FormattedMessage
                id="template-details.created-by"
                defaultMessage="Created by {name} from {organization}."
                values={{
                  name: <strong>{template.owner.fullName}</strong>,
                  organization: template.owner.organization.name,
                }}
              />{" "}
              <FormattedMessage
                id="template-details.last-updated-on"
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
                  <FormattedMessage
                    id="template-details.use-template"
                    defaultMessage="Use template"
                  />
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
                      <MenuItem
                        onClick={handleCloneTemplate}
                        icon={<CopyIcon display="block" boxSize={4} />}
                      >
                        <FormattedMessage
                          id="template-details.clone-template"
                          defaultMessage="Clone template"
                        />
                      </MenuItem>
                      {canEdit && (
                        <MenuItem
                          justifyContent="left"
                          type="submit"
                          onClick={handleEditTemplate}
                          icon={<EditIcon display="block" boxSize={4} />}
                        >
                          <FormattedMessage
                            id="template-details.edit-template"
                            defaultMessage="Edit template"
                          />
                        </MenuItem>
                      )}
                      {template.publicLink?.isActive && (
                        <MenuItem
                          justifyContent="left"
                          icon={<LinkIcon display="block" boxSize={4} />}
                          onClick={onCopyPublicLink}
                        >
                          <FormattedMessage id="generic.copy-link" defaultMessage="Copy link" />
                        </MenuItem>
                      )}
                    </MenuList>
                  </Portal>
                </Menu>
              </ButtonGroup>
              <Heading flex="1" size="md">
                <FormattedMessage
                  id="template-details.about"
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
                  id="template-details.no-description-provided"
                  defaultMessage="No description provided."
                />
              </Text>
            )}
            <Heading size="md" marginTop={8} marginBottom={4}>
              <FormattedMessage
                id="template-details.fields-list"
                defaultMessage="Information list"
              />
            </Heading>
            <Box paddingLeft={8}>
              {zip(template.fields, indices).map(([field, index]) => {
                return field.type === "HEADING" ? (
                  <Text key={field.id} fontWeight="bold" marginBottom={2}>
                    {index}.{" "}
                    {field.title ? (
                      <Text as="span" fontWeight="bold">
                        {field.title}
                      </Text>
                    ) : (
                      <Text as="span" textStyle="hint">
                        <FormattedMessage
                          id="generic.empty-heading"
                          defaultMessage="Untitled heading"
                        />
                      </Text>
                    )}
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
      }
      updatedAt
    }
  `,
};
