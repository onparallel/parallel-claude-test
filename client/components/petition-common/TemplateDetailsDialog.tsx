import { gql, useApolloClient } from "@apollo/client";
import {
  Box,
  Button,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalContent,
  ModalOverlay,
  Portal,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/core";
import {
  ChevronDownIcon,
  CopyIcon,
  EditIcon,
  PaperPlaneIcon,
} from "@parallel/chakra/icons";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import {
  TemplateDetailsDialog_PetitionTemplateFragment,
  useTemplateDetailsDialogPetitionQuery,
  useTemplateDetailsDialogPetitionQueryVariables,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../common/BreakLines";
import { DateTime } from "../common/DateTime";
import { SplitButton } from "../common/SplitButton";

export function useTemplateDetailsDialog() {
  const apollo = useApolloClient();
  const showDialog = useDialog(TemplateDetailsDialog);
  const createPetition = useCreatePetition();
  const clonePetitions = useClonePetitions();
  const goToPetition = useGoToPetition();
  return useCallback(
    async (templateId: string, userId: string) => {
      try {
        const { data } = await apollo.query<
          useTemplateDetailsDialogPetitionQuery,
          useTemplateDetailsDialogPetitionQueryVariables
        >({
          query: gql`
            query useTemplateDetailsDialogPetition($templateId: GID!) {
              petition(id: $templateId) {
                ...TemplateDetailsDialog_PetitionTemplate
              }
            }
            ${TemplateDetailsDialog.fragments.PetitionTemplate}
          `,
          variables: { templateId },
        });
        const template = data!
          .petition! as TemplateDetailsDialog_PetitionTemplateFragment;

        const action = await showDialog({ template, userId });
        switch (action) {
          case "CREATE_PETITION": {
            const petitionId = await createPetition({
              petitionId: template.id,
            });
            goToPetition(petitionId, "compose");
            break;
          }
          case "CLONE_TEMPLATE": {
            const [petitionId] = await clonePetitions({
              petitionIds: [template.id],
            });
            goToPetition(petitionId, "compose");
            break;
          }
          case "EDIT_TEMPLATE": {
            goToPetition(template.id, "compose");
            break;
          }
          default:
            break;
        }
      } catch {}
    },
    [showDialog, createPetition, clonePetitions, goToPetition]
  );
}

export function TemplateDetailsDialog({
  template,
  userId,
  ...props
}: DialogProps<
  {
    template: TemplateDetailsDialog_PetitionTemplateFragment;
    userId: string;
  },
  "CREATE_PETITION" | "CLONE_TEMPLATE" | "EDIT_TEMPLATE"
>) {
  const intl = useIntl();
  const canEdit = template.userPermissions.some(
    (permission) =>
      permission.user.id === userId &&
      ["OWNER", "WRITE"].includes(permission.permissionType)
  );

  return (
    <Modal
      size="4xl"
      isOpen
      autoFocus={false}
      onClose={() => props.onReject({ reason: "CLOSE" })}
      {...props}
    >
      <ModalOverlay>
        <ModalContent
          paddingX={{ base: 4, md: 6, lg: 8 }}
          paddingY={{ base: 4, md: 6 }}
        >
          <Stack direction="row" spacing={4}>
            <Stack flex="1" minWidth={0}>
              {template.name ? (
                <Heading size="lg" noOfLines={2}>
                  {template.name}
                </Heading>
              ) : (
                <Heading size="lg">
                  <FormattedMessage
                    id="generic.untitled-template"
                    defaultMessage="Untitled template"
                  />
                </Heading>
              )}
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
            </Stack>
            <Stack>
              <SplitButton dividerColor="purple.600">
                <Button
                  justifyContent="left"
                  colorScheme="purple"
                  leftIcon={<PaperPlaneIcon />}
                  onClick={() => props.onResolve("CREATE_PETITION")}
                >
                  <FormattedMessage
                    id="template-details.use-template"
                    defaultMessage="Use template"
                  />
                </Button>
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
                      borderTopLeftRadius={0}
                      borderBottomLeftRadius={0}
                      minWidth={8}
                    />
                  </Tooltip>
                  <Portal>
                    <MenuList minWidth={0}>
                      <MenuItem
                        onClick={() => props.onResolve("CLONE_TEMPLATE")}
                      >
                        <CopyIcon marginRight={2} />
                        <FormattedMessage
                          id="template-details.clone-template"
                          defaultMessage="Clone template"
                        />
                      </MenuItem>
                      {canEdit && (
                        <MenuItem
                          justifyContent="left"
                          type="submit"
                          onClick={() => props.onResolve("EDIT_TEMPLATE")}
                        >
                          <EditIcon marginRight={2} />
                          <FormattedMessage
                            id="template-details.edit-template"
                            defaultMessage="Edit template"
                          />
                        </MenuItem>
                      )}
                    </MenuList>
                  </Portal>
                </Menu>
              </SplitButton>
            </Stack>
          </Stack>
          <Heading size="md" marginBottom={4} marginTop={8}>
            <FormattedMessage
              id="template-details.about"
              defaultMessage="About this template"
            />
          </Heading>
          {template.description ? (
            <Text>
              <BreakLines text={template.description} />
            </Text>
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
          <Box as="ol" paddingLeft={8}>
            {template.fields.map((field) => {
              return field.type === "HEADING" ? (
                <Text as="li" key={field.id} fontWeight="bold" marginBottom={2}>
                  {field.title ? (
                    <Text as="span" fontWeight="bold" aria-label={field.title}>
                      {field.title}
                    </Text>
                  ) : (
                    <Text
                      as="span"
                      textStyle="hint"
                      aria-label={intl.formatMessage({
                        id: "generic.empty-heading",
                        defaultMessage: "Untitled heading",
                      })}
                    >
                      <FormattedMessage
                        id="generic.empty-heading"
                        defaultMessage="Untitled heading"
                      />
                    </Text>
                  )}
                </Text>
              ) : (
                <Text as="li" key={field.id} marginLeft={4} marginBottom={2}>
                  {field.title ? (
                    <Text as="span" aria-label={field.title}>
                      {field.title}
                    </Text>
                  ) : (
                    <Text
                      as="span"
                      textStyle="hint"
                      aria-label={intl.formatMessage({
                        id: "generic.untitled-field",
                        defaultMessage: "Untitled field",
                      })}
                    >
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
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}

TemplateDetailsDialog.fragments = {
  PetitionTemplate: gql`
    fragment TemplateDetailsDialog_PetitionTemplate on PetitionTemplate {
      id
      description
      name
      fields {
        id
        title
        type
        options
      }
      owner {
        id
        organization {
          name
        }
        fullName
      }
      userPermissions {
        id
        permissionType
        user {
          id
        }
      }
      updatedAt
    }
  `,
};
