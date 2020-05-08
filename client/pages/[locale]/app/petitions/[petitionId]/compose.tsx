import { useApolloClient } from "@apollo/react-hooks";
import { Box, Flex, useToast, Text } from "@chakra-ui/core";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { RecipientSelect } from "@parallel/components/common/RecipientSelect";
import { Spacer } from "@parallel/components/common/Spacer";
import { Title } from "@parallel/components/common/Title";
import {
  withData,
  WithDataContext,
} from "@parallel/components/common/withData";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { useCompletedPetitionDialog } from "@parallel/components/petition/CompletedPetitionDialog";
import { useConfirmDeleteFieldDialog } from "@parallel/components/petition/ConfirmDeleteFieldDialog";
import { PetitionComposeField } from "@parallel/components/petition/PetitionComposeField";
import {
  PetitionComposeFields,
  PetitionComposeFieldsProps,
} from "@parallel/components/petition/PetitionComposeFields";
import { PetitionComposeFieldSettings } from "@parallel/components/petition/PetitionComposeFieldSettings";
import {
  PetitionComposeSettings,
  PetitionComposeSettingsProps,
} from "@parallel/components/petition/PetitionComposeSettings";
import { useScheduleSendoutDialog } from "@parallel/components/petition/ScheduleSendoutDialog";
import {
  PetitionComposeQuery,
  PetitionComposeQueryVariables,
  PetitionComposeSearchContactsQuery,
  PetitionComposeSearchContactsQueryVariables,
  PetitionComposeUserQuery,
  PetitionCompose_createPetitionField_PetitionFragment,
  PetitionCompose_PetitionFieldFragment,
  PetitionCompose_updateFieldPositions_PetitionFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
  UpdatePetitionInput,
  usePetitionComposeQuery,
  usePetitionComposeUserQuery,
  usePetitionCompose_createPetitionFieldMutation,
  usePetitionCompose_deletePetitionFieldMutation,
  usePetitionCompose_sendPetitionMutation,
  usePetitionCompose_updateFieldPositionsMutation,
  usePetitionCompose_updatePetitionFieldMutation,
  usePetitionCompose_updatePetitionMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { FORMATS } from "@parallel/utils/dates";
import { resolveUrl } from "@parallel/utils/next";
import {
  usePetitionState,
  useWrapPetitionUpdater,
} from "@parallel/utils/petitions";
import { Maybe, UnwrapPromise } from "@parallel/utils/types";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import { compose } from "@parallel/utils/compose";

type PetitionComposeProps = UnwrapPromise<
  ReturnType<typeof PetitionCompose.getInitialProps>
>;

type FieldSelection = PetitionCompose_PetitionFieldFragment;

function PetitionCompose({ petitionId }: PetitionComposeProps) {
  const router = useRouter();
  const intl = useIntl();
  const toast = useToast();
  const {
    data: { me },
  } = assertQuery(usePetitionComposeUserQuery());
  const {
    data: { petition },
  } = assertQuery(usePetitionComposeQuery({ variables: { id: petitionId } }));

  const [state, setState] = usePetitionState();
  const [activeFieldId, setActiveFieldId] = useState<Maybe<string>>(null);
  const [showErrors, setShowErrors] = useState(false);
  const activeField: Maybe<FieldSelection> = useMemo(() => {
    if (activeFieldId) {
      return petition!.fields.find((f) => f.id === activeFieldId) ?? null;
    }
    return null;
  }, [activeFieldId, petition!.fields]);

  // This handles the position of the settings card
  const [settingsOffset, setSettingsOffset] = useState(0);
  useEffect(() => {
    if (!activeFieldId) {
      return;
    }
    const field = document.querySelector<HTMLElement>(
      `#field-${activeFieldId}`
    )!;
    const { height: fieldHeight } = field.getBoundingClientRect();
    const fieldOffset = field.offsetTop - field.parentElement!.offsetTop;
    const settings = document.querySelector<HTMLElement>("#field-settings");
    if (!settings) {
      return;
    }
    const { height: settingsHeight } = settings.getBoundingClientRect();
    setSettingsOffset(fieldOffset + fieldHeight / 2 - settingsHeight / 2);
  }, [activeFieldId, petition!.fields]);

  // When the petition is completed show a dialog to avoid unintended changes
  const completedDialog = useCompletedPetitionDialog();
  useEffect(() => {
    if (petition?.status === "COMPLETED") {
      completedDialog({});
    }
  }, []);

  const confirmDelete = useConfirmDeleteFieldDialog();
  const wrapper = useWrapPetitionUpdater(setState);

  const [updatePetition] = usePetitionCompose_updatePetitionMutation();
  const updateFieldPositions = useUpdateFieldPositions();
  const createPetitionField = useCreatePetitionField();
  const deletePetitionField = useDeletePetitionField();
  const [
    updatePetitionField,
  ] = usePetitionCompose_updatePetitionFieldMutation();

  const handleUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId]
  );

  const handleUpdateFieldPositions = useCallback(
    wrapper(async function (fieldIds: string[]) {
      await updateFieldPositions(petitionId, fieldIds);
    }),
    [petitionId]
  );

  const handleDeleteField = useCallback(
    async function (fieldId: string) {
      try {
        await confirmDelete({});
        if (activeFieldId === fieldId) {
          setActiveFieldId(null);
        }
        await wrapper(deletePetitionField)(petitionId, fieldId);
      } catch {}
    },
    [petitionId, activeFieldId]
  );

  const handleUpdateField = useCallback(
    wrapper(async function (fieldId: string, data: UpdatePetitionFieldInput) {
      const field = petition!.fields.find((f) => f.id === fieldId);
      await updatePetitionField({
        variables: { petitionId, fieldId, data },
        optimisticResponse: {
          updatePetitionField: {
            __typename: "PetitionAndField",
            petition: {
              __typename: "Petition",
              id: petitionId,
              name: petition!.name,
              status: petition!.status,
              updatedAt: new Date().toISOString(),
            },
            field: {
              __typename: "PetitionField",
              ...field,
              ...(data as any),
            },
          },
        },
      });
    }),
    [petitionId, petition!.fields]
  );

  const handleAddField = useCallback(
    wrapper(async function (type: PetitionFieldType) {
      const { data } = await createPetitionField(petitionId, type);
      const field = data!.createPetitionField.field;
      setTimeout(() => {
        const title = document.querySelector<HTMLElement>(
          `#field-title-${field.id}`
        );
        title?.click();
      });
    }),
    [petitionId]
  );

  const handleFieldFocus: PetitionComposeFieldsProps["onFieldFocus"] = (
    fieldId
  ) => {
    //Set field as active only if settings were already showing for another field
    setActiveFieldId((active) => active && fieldId);
  };

  const searchContacts = useSearchContacts();

  const showErrorDialog = useErrorDialog();
  const showScheduleSendoutDialog = useScheduleSendoutDialog();
  const [sendPetition] = usePetitionCompose_sendPetitionMutation();
  const handleSend: PetitionComposeSettingsProps["onSend"] = useCallback(
    async ({ recipients, schedule }) => {
      if (petition!.fields.length === 0) {
        try {
          await showErrorDialog({
            message: (
              <FormattedMessage
                id="petition.no-fields-error"
                defaultMessage="Please add at least one field to the petition."
              />
            ),
          });
        } finally {
          return;
        }
      }
      const fieldWithoutTitle = petition!.fields.find((f) => !f.title);
      if (fieldWithoutTitle) {
        try {
          setShowErrors(true);
          const node = document.querySelector(`#field-${fieldWithoutTitle.id}`);
          scrollIntoView(node!, { block: "center", behavior: "smooth" });
          await showErrorDialog({
            message: (
              <FormattedMessage
                id="petition.no-fields-without-title-error"
                defaultMessage="Please add a title to every field."
              />
            ),
          });
        } finally {
          return;
        }
      }
      if (recipients.length === 0) {
        try {
          await showErrorDialog({
            message: (
              <FormattedMessage
                id="petition.no-recipients-error"
                defaultMessage="Please specify at least one recipient."
              />
            ),
          });
        } finally {
          return;
        }
      }
      let scheduledAt: Date | null = null;
      if (schedule) {
        try {
          scheduledAt = await showScheduleSendoutDialog({});
        } catch {
          return;
        }
      }
      const { data } = await sendPetition({
        variables: {
          petitionId: petition!.id,
          recipients,
          scheduledAt: scheduledAt?.toISOString() ?? null,
        },
        update(client) {
          // clear stale data
          delete (client as any).data.data[petitionId].sendouts;
          delete (client as any).data.data[petitionId].recipients;
        },
      });
      if (data?.sendPetition.result !== "SUCCESS") {
        toast({
          isClosable: true,
          status: "error",
          title: intl.formatMessage({
            id: "petition.petition-send-error.title",
            defaultMessage: "Error",
          }),
          description: intl.formatMessage({
            id: "petition.petition-send-error.description",
            defaultMessage:
              "There was an error sending your petition. Try again and, if it fails, reach out to support for help.",
          }),
        });
        return;
      }
      toast({
        isClosable: true,
        status: schedule ? "info" : "success",
        title: schedule
          ? intl.formatMessage({
              id: "petition.petition-scheduled-toast.title",
              defaultMessage: "Petition scheduled",
            })
          : intl.formatMessage({
              id: "petition.petition-sent-toast.title",
              defaultMessage: "Petition sent",
            }),
        description: schedule
          ? intl.formatMessage(
              {
                id: "petition.petition-scheduled-toast.description",
                defaultMessage: "Your petition will be sent on {date}.",
              },
              { date: intl.formatTime(scheduledAt!, FORMATS.LLL) }
            )
          : intl.formatMessage({
              id: "petition.petition-sent-toast.description",
              defaultMessage: "Your petition is on it's way.",
            }),
      });
      const pathname = "/[locale]/app/petitions";
      router.push(pathname, resolveUrl(pathname, router.query));
    },
    [petition!.id, petition!.fields]
  );

  return (
    <>
      <Title>
        {petition!.name ||
          intl.formatMessage({
            id: "generic.untitled-petition",
            defaultMessage: "Untitled petition",
          })}
      </Title>
      <PetitionLayout
        user={me}
        petition={petition!}
        onUpdatePetition={handleUpdatePetition}
        section="compose"
        scrollBody
        state={state}
      >
        <Flex flexDirection="row" padding={4}>
          <Box
            flex="2"
            display={{ base: activeFieldId ? "none" : "block", md: "block" }}
          >
            <PetitionComposeFields
              showErrors={showErrors}
              fields={petition!.fields}
              active={activeFieldId}
              onAddField={handleAddField}
              onDeleteField={handleDeleteField}
              onFieldFocus={handleFieldFocus}
              onUpdateFieldPositions={handleUpdateFieldPositions}
              onUpdateField={handleUpdateField}
              onSettingsClick={setActiveFieldId}
            />
            <PetitionComposeSettings
              marginTop={4}
              petition={petition!}
              searchContacts={searchContacts}
              onUpdatePetition={handleUpdatePetition}
              onSend={handleSend}
            />
          </Box>
          {activeField ? null : (
            <Spacer
              flex="1"
              display={{ base: "none", md: "block" }}
              marginLeft={{ base: 0, md: 4 }}
            />
          )}
          {activeField ? (
            <Box flex="1" marginLeft={{ base: 0, md: 4 }}>
              <PetitionComposeFieldSettings
                id="field-settings"
                marginTop={{ base: 0, md: `${settingsOffset}px` }}
                transition="margin-top 200ms ease"
                position={{ base: "relative", md: "sticky" }}
                top={{ base: 0, md: 4 }}
                field={activeField!}
                onUpdateField={(data) =>
                  handleUpdateField(activeField.id, data)
                }
                onClose={() => setActiveFieldId(null)}
              />
            </Box>
          ) : null}
        </Flex>
      </PetitionLayout>
    </>
  );
}

PetitionCompose.fragments = {
  petition: gql`
    fragment PetitionCompose_Petition on Petition {
      id
      ...PetitionLayout_Petition
      fields {
        ...PetitionCompose_PetitionField
      }
      ...PetitionComposeSettings_Petition
    }
    fragment PetitionCompose_PetitionField on PetitionField {
      ...PetitionComposeField_PetitionField
      ...PetitionComposeFieldSettings_PetitionField
    }
    ${PetitionLayout.fragments.petition}
    ${PetitionComposeField.fragments.petitionField}
    ${PetitionComposeFieldSettings.fragments.petitionField}
    ${PetitionComposeSettings.fragments.petition}
  `,
  user: gql`
    fragment PetitionCompose_User on User {
      ...PetitionLayout_User
    }
    ${PetitionLayout.fragments.user}
  `,
};

PetitionCompose.mutations = [
  gql`
    mutation PetitionCompose_updatePetition(
      $petitionId: ID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionLayout_Petition
        ...PetitionComposeSettings_Petition
      }
    }
    ${PetitionLayout.fragments.petition}
    ${PetitionComposeSettings.fragments.petition}
  `,
  gql`
    mutation PetitionCompose_updateFieldPositions(
      $petitionId: ID!
      $fieldIds: [ID!]!
    ) {
      updateFieldPositions(petitionId: $petitionId, fieldIds: $fieldIds) {
        id
        ...PetitionLayout_Petition
      }
    }
    ${PetitionLayout.fragments.petition}
  `,
  gql`
    mutation PetitionCompose_createPetitionField(
      $petitionId: ID!
      $type: PetitionFieldType!
    ) {
      createPetitionField(petitionId: $petitionId, type: $type) {
        field {
          id
          ...PetitionComposeField_PetitionField
          ...PetitionComposeFieldSettings_PetitionField
        }
        petition {
          ...PetitionLayout_Petition
        }
      }
    }
    ${PetitionLayout.fragments.petition}
    ${PetitionComposeField.fragments.petitionField}
    ${PetitionComposeFieldSettings.fragments.petitionField}
  `,
  gql`
    mutation PetitionCompose_deletePetitionField(
      $petitionId: ID!
      $fieldId: ID!
    ) {
      deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
        id
        ...PetitionLayout_Petition
      }
    }
    ${PetitionLayout.fragments.petition}
  `,
  gql`
    mutation PetitionCompose_updatePetitionField(
      $petitionId: ID!
      $fieldId: ID!
      $data: UpdatePetitionFieldInput!
    ) {
      updatePetitionField(
        petitionId: $petitionId
        fieldId: $fieldId
        data: $data
      ) {
        field {
          id
          ...PetitionComposeField_PetitionField
          ...PetitionComposeFieldSettings_PetitionField
        }
        petition {
          ...PetitionLayout_Petition
        }
      }
    }
    ${PetitionLayout.fragments.petition}
    ${PetitionComposeField.fragments.petitionField}
    ${PetitionComposeFieldSettings.fragments.petitionField}
  `,
  gql`
    mutation PetitionCompose_sendPetition(
      $petitionId: ID!
      $recipients: [ID!]!
      $scheduledAt: DateTime
    ) {
      sendPetition(
        petitionId: $petitionId
        recipients: $recipients
        scheduledAt: $scheduledAt
      ) {
        result
        petition {
          id
          status
        }
        sendouts {
          id
        }
      }
    }
  `,
];

function useUpdateFieldPositions() {
  const [mutate] = usePetitionCompose_updateFieldPositionsMutation();
  return useCallback(
    async function (petitionId: string, fieldIds: string[]) {
      return await mutate({
        variables: { petitionId, fieldIds },
        update(client) {
          const fragment = gql`
            fragment PetitionCompose_updateFieldPositions_Petition on Petition {
              fields {
                id
              }
            }
          `;
          client.writeFragment<
            PetitionCompose_updateFieldPositions_PetitionFragment
          >({
            id: petitionId,
            fragment,
            data: {
              __typename: "Petition",
              fields: fieldIds.map((id) => ({
                __typename: "PetitionField",
                id,
              })),
            },
          });
        },
      });
    },
    [mutate]
  );
}

function useCreatePetitionField() {
  const [mutate] = usePetitionCompose_createPetitionFieldMutation();
  return useCallback(
    async function (petitionId: string, type: PetitionFieldType) {
      return mutate({
        variables: { petitionId, type },
        update(client, { data }) {
          const { field, petition } = data!.createPetitionField;
          const fragment = gql`
            fragment PetitionCompose_createPetitionField_Petition on Petition {
              fields {
                id
              }
            }
          `;
          const cached = client.readFragment<
            PetitionCompose_createPetitionField_PetitionFragment
          >({ id: petition.id, fragment });
          client.writeFragment<
            PetitionCompose_createPetitionField_PetitionFragment
          >({
            id: petition.id,
            fragment,
            data: {
              __typename: "Petition",
              fields: [...cached!.fields, pick(field, ["id", "__typename"])],
            },
          });
        },
      });
    },
    [mutate]
  );
}

function useDeletePetitionField() {
  const [mutate] = usePetitionCompose_deletePetitionFieldMutation();
  return useCallback(
    async function (petitionId: string, fieldId: string) {
      return await mutate({
        variables: { petitionId, fieldId },
        update(client) {
          const fragment = gql`
            fragment PetitionCompose_deletePetitionField_Petition on Petition {
              fields {
                id
              }
            }
          `;
          const cached = client.readFragment<
            PetitionCompose_createPetitionField_PetitionFragment
          >({ id: petitionId, fragment });
          client.writeFragment<
            PetitionCompose_createPetitionField_PetitionFragment
          >({
            id: petitionId,
            fragment,
            data: {
              __typename: "Petition",
              fields: cached!.fields.filter(({ id }) => id !== fieldId),
            },
          });
        },
      });
    },
    [mutate]
  );
}

function useSearchContacts() {
  const apollo = useApolloClient();
  return useDebouncedAsync(
    async (search: string, exclude: string[]) => {
      const { data } = await apollo.query<
        PetitionComposeSearchContactsQuery,
        PetitionComposeSearchContactsQueryVariables
      >({
        query: gql`
          query PetitionComposeSearchContacts(
            $search: String
            $exclude: [ID!]
          ) {
            contacts(limit: 10, search: $search, exclude: $exclude) {
              items {
                ...RecipientSelect_Contact
              }
            }
          }
          ${RecipientSelect.fragments.contact}
        `,
        variables: { search, exclude },
      });
      return data.contacts.items;
    },
    300,
    []
  );
}

PetitionCompose.getInitialProps = async ({
  apollo,
  query,
}: WithDataContext) => {
  await Promise.all([
    apollo.query<PetitionComposeQuery, PetitionComposeQueryVariables>({
      query: gql`
        query PetitionCompose($id: ID!) {
          petition(id: $id) {
            ...PetitionCompose_Petition
          }
        }
        ${PetitionCompose.fragments.petition}
      `,
      variables: { id: query.petitionId as string },
    }),
    apollo.query<PetitionComposeUserQuery>({
      query: gql`
        query PetitionComposeUser {
          me {
            ...PetitionCompose_User
          }
        }
        ${PetitionCompose.fragments.user}
      `,
    }),
  ]);
  return {
    petitionId: query.petitionId as string,
  };
};

export default compose(
  withOnboarding({
    key: "PETITION_COMPOSE",
    steps: [
      {
        title: (
          <FormattedMessage
            id="tour.petition-compose.create-petition"
            defaultMessage="Let's fill out your first petition"
          />
        ),
        content: (
          <>
            <Text>
              <FormattedMessage
                id="tour.petition-compose.set-petition"
                defaultMessage="On this page, you can set up the information that you need from your recipients."
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="tour.petition-compose.show-around"
                defaultMessage="Let us show you step by step!"
              />
            </Text>
          </>
        ),
        placement: "center",
        target: "#__next",
      },
      {
        content: (
          <Text marginTop={4}>
            <FormattedMessage
              id="tour.petition-compose.field-types"
              defaultMessage="Here you can add what you need from your recipients and choose the type of information it is (files or written replies)."
            />
          </Text>
        ),
        placement: "bottom-end",
        target: "#petition-fields",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-compose.add-petition-fields-title"
            defaultMessage="Message and automatic reminders"
          />
        ),
        content: (
          <Text>
            <FormattedMessage
              id="tour.petition-compose.add-petition-fields"
              defaultMessage="Here you can add the recipients, your first message, and configure your automatic reminders."
            />
          </Text>
        ),
        placement: "right-start",
        target: "#petition-message-compose",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-compose.select-recipients-title"
            defaultMessage="Select your recipients"
          />
        ),
        content: (
          <Text>
            <FormattedMessage
              id="tour.petition-compose.select-multiple-recipients"
              defaultMessage="If you select <b>multiple recipients</b>, any of them will be able to reply to any of the items you requested."
              values={{
                b: (chunks: any[]) => (
                  <Text as="em" fontStyle="normal" fontWeight="bold">
                    {chunks}
                  </Text>
                ),
              }}
            />
          </Text>
        ),
        placement: "right-start",
        target: "#petition-select-recipients",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-compose.petition-reminders-title"
            defaultMessage="We will handle this, but tell us a little bit more."
          />
        ),
        content: (
          <Text>
            <FormattedMessage
              id="tour.petition-compose.petition-reminders"
              defaultMessage="We know that every situation and every client is different, so please help us understand better when it is best to send the reminders."
            />
          </Text>
        ),
        placement: "top",
        target: "#petition-reminders",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-compose.petition-advanced-settings-title"
            defaultMessage="Need more customization?"
          />
        ),
        content: (
          <Text>
            <FormattedMessage
              id="tour.petition-compose.petition-advanced-settings"
              defaultMessage="Choose here the <b>language</b> from the upload page and the automatic messages that we will send to your recipients, and the <b>deadline</b> you want us to inform them."
              values={{
                b: (chunks: any[]) => (
                  <Text as="em" fontStyle="normal" fontWeight="bold">
                    {chunks}
                  </Text>
                ),
              }}
            />
          </Text>
        ),
        placement: "top",
        target: "#petition-advanced-settings",
      },
    ],
  }),
  withData
)(PetitionCompose);
