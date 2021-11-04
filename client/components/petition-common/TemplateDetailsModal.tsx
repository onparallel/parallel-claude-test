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
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
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
import {
  TemplateDetailsModal_PetitionTemplateFragment,
  TemplateDetailsModal_UserFragment,
  useTemplateDetailsModal_autoSendTemplateMutation,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DateTime } from "../common/DateTime";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { Divider } from "../common/Divider";

export interface TemplateDetailsModalProps extends Omit<ModalProps, "children"> {
  me: TemplateDetailsModal_UserFragment;
  template: TemplateDetailsModal_PetitionTemplateFragment;
}

export function TemplateDetailsModal({ me, template, ...props }: TemplateDetailsModalProps) {
  const intl = useIntl();

  const canEdit = Boolean(
    template.myEffectivePermission &&
      ["OWNER", "WRITE"].includes(template.myEffectivePermission.permissionType)
  );

  const filteredFields = template.fields.filter((field) =>
    field.type === "HEADING" && !field.title ? false : true
  );

  const indices = useFieldIndices(filteredFields);

  const publicLinkURL = template.publicLink?.isActive
    ? `${process.env.NEXT_PUBLIC_PARALLEL_URL}/${template.locale}/pp/${template.publicLink.slug}`
    : undefined;

  const onCopyPublicLink = useClipboardWithToast({
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

  const confirmPetitionName = useDialog(PetitionNameDialog);
  const [autoSendTemplate] = useTemplateDetailsModal_autoSendTemplateMutation();
  const handleAutoSendPetition = async () => {
    try {
      const name = await confirmPetitionName({ defaultValue: template.name ?? "" });
      await openNewWindow(async () => {
        const { data } = await autoSendTemplate({ variables: { templateId: template.id, name } });
        return data!.autoSendTemplate;
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
                  <FormattedMessage
                    id="component.template-details-modal.use-template"
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
                          id="component.template-details-modal.clone-template"
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
                            id="component.template-details-modal.edit-template"
                            defaultMessage="Edit template"
                          />
                        </MenuItem>
                      )}
                      {template.publicLink?.isActive && (
                        <MenuItem
                          justifyContent="left"
                          icon={<LinkIcon display="block" boxSize={4} />}
                          onClick={() => onCopyPublicLink()}
                        >
                          <FormattedMessage id="generic.copy-link" defaultMessage="Copy link" />
                        </MenuItem>
                      )}
                      {me.hasAutoSendTemplate ? (
                        <MenuItem
                          justifyContent="left"
                          icon={<LinkIcon display="block" boxSize={4} />}
                          onClick={() => handleAutoSendPetition()}
                        >
                          <FormattedMessage
                            id="component.template-details-modal.auto-send"
                            defaultMessage="Auto-send template"
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

TemplateDetailsModal.mutations = [
  gql`
    mutation TemplateDetailsModal_autoSendTemplate($templateId: GID!, $name: String!) {
      autoSendTemplate(templateId: $templateId, name: $name)
    }
  `,
];

TemplateDetailsModal.fragments = {
  User: gql`
    fragment TemplateDetailsModal_User on User {
      hasAutoSendTemplate: hasFeatureFlag(featureFlag: AUTO_SEND_TEMPLATE)
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
      }
      updatedAt
    }
  `,
};

function PetitionNameDialog({
  defaultValue,
  ...props
}: DialogProps<{ defaultValue: string }, string>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string }>({
    defaultValues: {
      name: defaultValue,
    },
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const inputProps = useRegisterWithRef(inputRef, register, "name", { required: true });
  return (
    <ConfirmDialog
      {...props}
      initialFocusRef={inputRef}
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => props.onResolve(data.name)),
      }}
      header={
        <FormattedMessage
          id="component.template-details-modal.auto-send-header"
          defaultMessage="Petition name"
        />
      }
      body={
        <FormControl isInvalid={!!errors.name}>
          <FormLabel>
            <FormattedMessage
              id="component.template-details-modal.auto-send-label"
              defaultMessage="Enter a name for the petition"
            />
          </FormLabel>
          <Input {...inputProps} />
          <FormErrorMessage>
            <FormattedMessage
              id="generic.required-field-error"
              defaultMessage="The field is required"
            />
          </FormErrorMessage>
        </FormControl>
      }
      confirm={
        <Button type="submit" colorScheme="purple">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}
