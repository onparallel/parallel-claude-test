import { gql, useApolloClient } from "@apollo/client";
import {
  Box,
  Button,
  Heading,
  Modal,
  ModalContent,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/core";
import { CopyIcon, PaperPlaneIcon } from "@parallel/chakra/icons";
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
import { DateTime } from "../common/DateTime";

export function useTemplateDetailsDialog() {
  const intl = useIntl();
  const apollo = useApolloClient();
  const showDialog = useDialog(TemplateDetailsDialog);
  const createPetition = useCreatePetition();
  const clonePetitions = useClonePetitions();
  const goToPetition = useGoToPetition();
  return useCallback(async (templateId: string) => {
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
      const action = await showDialog({ template });
      if (action === "CREATE_PETITION") {
        const petitionId = await createPetition({ petitionId: template.id });
        goToPetition(petitionId, "compose");
      } else {
        const [petitionId] = await clonePetitions({
          petitionIds: [template.id],
        });
        goToPetition(petitionId, "compose");
      }
    } catch {}
  }, []);
}

export function TemplateDetailsDialog({
  template,
  ...props
}: DialogProps<
  { template: TemplateDetailsDialog_PetitionTemplateFragment },
  "CREATE_PETITION" | "CLONE_TEMPLATE"
>) {
  const intl = useIntl();
  return (
    <Modal
      size="4xl"
      isOpen={true}
      onClose={() => props.onReject({ reason: "CLOSE" })}
      {...props}
    >
      <ModalOverlay>
        <ModalContent
          paddingX={{ base: 4, md: 6, lg: 8 }}
          paddingY={{ base: 4, md: 6 }}
        >
          <Stack direction="row">
            <Stack flex="1">
              {template.name ? (
                <Heading
                  size="lg"
                  sx={
                    {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: "2",
                      WebkitBoxOrient: "vertical",
                    } as any
                  }
                >
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
              <Button
                colorScheme="purple"
                onClick={() => props.onResolve("CREATE_PETITION")}
              >
                <PaperPlaneIcon marginRight="2" />
                <FormattedMessage
                  id="template-details.use-template"
                  defaultMessage="Use template"
                />
              </Button>
              <Button
                type="submit"
                onClick={() => props.onResolve("CLONE_TEMPLATE")}
              >
                <CopyIcon marginRight="2" />
                <FormattedMessage
                  id="template-details.clone-template"
                  defaultMessage="Clone template"
                />
              </Button>
            </Stack>
          </Stack>
          <Heading size="md" marginBottom={4}>
            <FormattedMessage
              id="template-details.about"
              defaultMessage="About this template"
            />
          </Heading>
          {template.description ? (
            <Text>{template.description}</Text>
          ) : (
            <Text textAlign="center" fontStyle="italic" color="gray.400">
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
                    <Text as="span" fontWeight="bold">
                      {field.title}
                    </Text>
                  ) : (
                    <Text as="span" color="gray.400" fontStyle="italic">
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
                    <Text as="span">{field.title}</Text>
                  ) : (
                    <Text as="span" color="gray.400" fontStyle="italic">
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
      updatedAt
    }
  `,
};
