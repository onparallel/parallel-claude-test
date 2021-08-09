import { gql, useApolloClient } from "@apollo/client";
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
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Portal,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { ChevronDownIcon, CopyIcon, EditIcon, PaperPlaneIcon } from "@parallel/chakra/icons";
import { DialogProps, useDialog } from "@parallel/components/common/DialogProvider";
import {
  TemplateDetailsDialog_PetitionTemplateFragment,
  useTemplateDetailsDialogPetitionQuery,
  useTemplateDetailsDialogPetitionQueryVariables,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";
import { BaseDialog } from "../common/BaseDialog";
import { DateTime } from "../common/DateTime";
import { Divider } from "../common/Divider";

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
          fetchPolicy: "network-only",
          variables: { templateId },
        });
        const template = data!.petition! as TemplateDetailsDialog_PetitionTemplateFragment;

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
  const canEdit = Boolean(
    template.myEffectivePermission &&
      ["OWNER", "WRITE"].includes(template.myEffectivePermission.permissionType)
  );

  const indices = useFieldIndices(template.fields);

  return (
    <BaseDialog size="4xl" {...props}>
      <ModalContent>
        <ModalHeader paddingRight={12} paddingBottom={0}>
          {template.name ? (
            <Text as="div" noOfLines={2}>
              {template.name}
            </Text>
          ) : (
            <Text>
              <FormattedMessage id="generic.untitled-template" defaultMessage="Untitled template" />
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
                      onClick={() => props.onResolve("CLONE_TEMPLATE")}
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
                        onClick={() => props.onResolve("EDIT_TEMPLATE")}
                        icon={<EditIcon display="block" boxSize={4} />}
                      >
                        <FormattedMessage
                          id="template-details.edit-template"
                          defaultMessage="Edit template"
                        />
                      </MenuItem>
                    )}
                  </MenuList>
                </Portal>
              </Menu>
            </ButtonGroup>
            <Heading flex="1" size="md">
              <FormattedMessage id="template-details.about" defaultMessage="About this template" />
            </Heading>
          </Stack>
          {template.descriptionHtml ? (
            <Text dangerouslySetInnerHTML={{ __html: template.descriptionHtml }} />
          ) : (
            <Text textAlign="center" textStyle="hint">
              <FormattedMessage
                id="template-details.no-description-provided"
                defaultMessage="No description provided."
              />
            </Text>
          )}
          <Heading size="md" marginTop={8} marginBottom={4}>
            <FormattedMessage id="template-details.fields-list" defaultMessage="Information list" />
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
    </BaseDialog>
  );
}

TemplateDetailsDialog.fragments = {
  PetitionTemplate: gql`
    fragment TemplateDetailsDialog_PetitionTemplate on PetitionTemplate {
      id
      descriptionHtml
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
          id
          name
        }
        fullName
      }
      myEffectivePermission {
        permissionType
      }
      updatedAt
    }
  `,
};
