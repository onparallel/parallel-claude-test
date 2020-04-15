import { useApolloClient } from "@apollo/react-hooks";
import { Box, Flex } from "@chakra-ui/core";
import { RecipientSelect } from "@parallel/components/common/RecipientSelect";
import { Spacer } from "@parallel/components/common/Spacer";
import { Title } from "@parallel/components/common/Title";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { useCompletedPetitionDialog } from "@parallel/components/petition/CompletedPetitionDialog";
import { useConfirmDeleteFieldDialog } from "@parallel/components/petition/ConfirmDeleteFieldDialog";
import { PetitionComposeField } from "@parallel/components/petition/PetitionComposeField";
import { PetitionComposeFields } from "@parallel/components/petition/PetitionComposeFields";
import { PetitionComposeFieldSettings } from "@parallel/components/petition/PetitionComposeFieldSettings";
import {
  PetitionComposeSettings,
  PetitionComposeSettingsProps,
} from "@parallel/components/petition/PetitionComposeSettings";
import {
  withData,
  WithDataContext,
} from "@parallel/components/common/withData";
import {
  Recipient,
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
  PetitionCompose_sendPetition_PetitionFragment,
  PetitionCompose_sendPetitionMutationResult,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import {
  usePetitionState,
  useWrapPetitionUpdater,
} from "@parallel/utils/petitions";
import { Maybe, UnwrapPromise } from "@parallel/utils/types";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { gql } from "apollo-boost";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { pick } from "remeda";
import {
  PetitionSentDialog,
  usePetitionSentDialog,
} from "@parallel/components/petition/PetitionSentDialog";
import { useRouter } from "next/router";
import { resolveUrl } from "@parallel/utils/next";
import { usePetitionScheduledDialog } from "@parallel/components/petition/PetitionScheduledDialog";

type PetitionComposeProps = UnwrapPromise<
  ReturnType<typeof PetitionCompose.getInitialProps>
>;

type FieldSelection = PetitionCompose_PetitionFieldFragment;

function PetitionCompose({ petitionId }: PetitionComposeProps) {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(usePetitionComposeUserQuery());
  const {
    data: { petition },
  } = assertQuery(usePetitionComposeQuery({ variables: { id: petitionId } }));

  const [state, setState] = usePetitionState();
  const [activeFieldId, setActiveFieldId] = useState<Maybe<string>>(null);
  const activeField: Maybe<FieldSelection> = useMemo(() => {
    if (activeFieldId) {
      return petition!.fields.find((f) => f.id === activeFieldId) ?? null;
    }
    return null;
  }, [activeFieldId, petition!.fields]);

  // This handles the position of the settings card
  const [offset, setSettingsOffset] = useState(0);
  useEffect(() => {
    if (!activeFieldId) {
      return;
    }
    const element = document.querySelector<HTMLElement>(
      `#field-${activeFieldId}`
    );
    if (element) {
      const offset = element.offsetTop - element.parentElement!.offsetTop;
      setSettingsOffset(offset);
    }
  }, [activeFieldId]);

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
    [petitionId]
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

  const handleFieldFocus = useCallback((fieldId) => {
    //Set field as active only if settings were already showing for another field
    setActiveFieldId((active) => active && fieldId);
  }, []);

  const searchContacts = useSearchContacts();
  const sendPetition = useSendPetition();

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
              onSend={({ recipients, scheduledAt }) =>
                sendPetition(petitionId, recipients, scheduledAt)
              }
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
                marginTop={{ base: 0, md: `${offset - 52}px` }}
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
      $recipients: [Recipient!]!
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
          contact {
            ...PetitionSentDialog_Contact
          }
        }
      }
    }
    ${PetitionSentDialog.fragments.contact}
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

function useSendPetition() {
  const showPetitionSentDialog = usePetitionSentDialog();
  const showPetitionScheduledDialog = usePetitionScheduledDialog();
  const router = useRouter();
  const [doSendPetition] = usePetitionCompose_sendPetitionMutation();
  return useCallback(async function (
    petitionId: string,
    recipients: Recipient[],
    scheduledAt?: Date
  ) {
    const { data } = await doSendPetition({
      variables: {
        petitionId,
        recipients,
        scheduledAt: scheduledAt?.toISOString() ?? null,
      },
      update(client, { data }: PetitionCompose_sendPetitionMutationResult) {
        const sendouts = data!.sendPetition.sendouts;
        if (!sendouts) {
          return;
        }
        const fragment = gql`
          fragment PetitionCompose_sendPetition_Petition on Petition {
            sendouts {
              id
            }
          }
        `;
        const cached = client.readFragment<
          PetitionCompose_sendPetition_PetitionFragment
        >({ id: petitionId, fragment: fragment });
        client.writeFragment<PetitionCompose_sendPetition_PetitionFragment>({
          id: petitionId,
          fragment: fragment,
          data: {
            __typename: "Petition",
            sendouts: [
              ...cached!.sendouts,
              ...sendouts.map(pick(["id", "__typename"])),
            ],
          },
        });
      },
    });
    if (data?.sendPetition.sendouts) {
      try {
        if (scheduledAt) {
          await showPetitionScheduledDialog({
            scheduledAt,
            contacts: data.sendPetition.sendouts.map((s) => s.contact!),
          });
        } else {
          await showPetitionSentDialog({
            contacts: data.sendPetition.sendouts.map((s) => s.contact!),
          });
        }
        const pathname = "/[locale]/app/petitions/[petitionId]/review";
        router.push(pathname, resolveUrl(pathname, router.query));
      } catch {}
    }
  },
  []);
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

export default withData(PetitionCompose);
