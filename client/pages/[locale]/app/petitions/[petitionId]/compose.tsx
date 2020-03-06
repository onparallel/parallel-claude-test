import { useMutation } from "@apollo/react-hooks";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog
} from "@parallel/components/common/DialogOpenerProvider";
import { Title } from "@parallel/components/common/Title";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { AddFieldPopover } from "@parallel/components/petition/AddFieldPopover";
import { PetitionComposeField } from "@parallel/components/petition/PetitionComposeField";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  PetitionComposeQuery,
  PetitionComposeQueryVariables,
  PetitionComposeUserQuery,
  PetitionCompose_createPetitionFieldMutation,
  PetitionCompose_createPetitionFieldMutationVariables,
  PetitionCompose_CreatePetitionField_PetitionFragment,
  PetitionCompose_deletePetitionFieldMutation,
  PetitionCompose_deletePetitionFieldMutationVariables,
  PetitionCompose_PetitionFragment,
  PetitionCompose_updateFieldPositionsMutation,
  PetitionCompose_updateFieldPositionsMutationVariables,
  PetitionCompose_updatePetitionFieldMutation,
  PetitionCompose_updatePetitionFieldMutationVariables,
  PetitionCompose_updatePetitionMutation,
  PetitionCompose_updatePetitionMutationVariables,
  PetitionFieldType,
  PetitionsUserQuery,
  UpdatePetitionFieldInput,
  UpdatePetitionInput
} from "@parallel/graphql/__types";
import {
  usePetitionState,
  useWrapPetitionUpdater
} from "@parallel/utils/petitions";
import { UnwrapArray, UnwrapPromise } from "@parallel/utils/types";
import { useQueryData } from "@parallel/utils/useQueryData";
import { defaultDataIdFromObject, gql } from "apollo-boost";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { indexBy, pick } from "remeda";
import { PetitionComposeFieldSettings } from "../../../../../components/petition/PetitionComposeFieldSettings";

type PetitionProps = UnwrapPromise<
  ReturnType<typeof PetitionCompose.getInitialProps>
>;

function PetitionCompose({ petitionId }: PetitionProps) {
  const intl = useIntl();
  const { me } = useQueryData<PetitionsUserQuery>(
    GET_PETITION_COMPOSE_USER_DATA
  );
  const { petition } = useQueryData<
    PetitionComposeQuery,
    PetitionComposeQueryVariables
  >(GET_PETITION_COMPOSE_DATA, { variables: { id: petitionId } });
  const { fields } = petition!;
  const fieldsById = useMemo(() => indexBy(fields, f => f.id), [fields]);
  const [fieldIds, setFieldIds] = useState(fields.map(f => f.id));
  const [active, setActive] = useState<string | null>(null);
  const confirmDelete = useDialog(ConfirmDelete, []);
  const [state, setState] = usePetitionState();
  const wrapper = useWrapPetitionUpdater(setState);
  const [updatePetition] = useUpdatePetition();
  const [updateFieldPositions] = useUpdateFieldPositions();
  const [createPetitionField] = useCreatePetitionField();
  const [deletePetitionField] = useDeletePetitionField();
  const [updatePetitionField] = useUpdatePetitionField();

  const handleOnUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { id: petitionId, data } });
    }),
    [petitionId]
  );

  const handleFieldMove = useCallback(
    async function(dragIndex: number, hoverIndex: number, dropped?: boolean) {
      const newFieldIds = [...fieldIds];
      const [field] = newFieldIds.splice(dragIndex, 1);
      newFieldIds.splice(hoverIndex, 0, field);
      setFieldIds(newFieldIds);
      if (dropped) {
        await wrapper(updateFieldPositions)({
          variables: { id: petitionId, fieldIds: newFieldIds }
        });
      }
    },
    [petitionId, fieldIds]
  );

  const handleFieldDelete = useCallback(
    async function(fieldId: string) {
      try {
        await confirmDelete({});
        setFieldIds(fieldIds => fieldIds.filter(id => id !== fieldId));
        setActive(active => (active === fieldId ? null : active));
        await wrapper(deletePetitionField)({
          variables: { id: petitionId, fieldId }
        });
      } catch {}
    },
    [petitionId]
  );

  const handleFieldUpdate = useCallback(
    wrapper(async function(
      field: UnwrapArray<PetitionCompose_PetitionFragment["fields"]>,
      data: UpdatePetitionFieldInput
    ) {
      await updatePetitionField({
        variables: { id: petitionId, fieldId: field.id, data },
        optimisticResponse: {
          updatePetitionField: {
            __typename: "PetitionAndField",
            petition: {
              __typename: "Petition",
              id: petitionId,
              updatedAt: new Date().toISOString()
            },
            field: {
              __typename: "PetitionField",
              ...field,
              ...(data as any)
            }
          }
        }
      });
    }),
    [petitionId]
  );

  const handleAddField = useCallback(
    wrapper(async function(type: PetitionFieldType) {
      const { data } = await createPetitionField({
        variables: { id: petitionId, type }
      });
      const fieldId = data!.createPetitionField.field.id;
      setFieldIds(fieldIds => [...fieldIds, fieldId]);
      setTimeout(() => {
        const title = document.querySelector<HTMLElement>(
          `#field-title-${fieldId}`
        );
        title?.click();
      }, 0);
    }),
    [petitionId]
  );

  return (
    <>
      <Title>
        {petition!.name ||
          intl.formatMessage({
            id: "generic.untitled-petition",
            defaultMessage: "Untitled petition"
          })}
      </Title>
      <PetitionLayout
        user={me}
        petition={petition!}
        onUpdatePetition={handleOnUpdatePetition}
        section="compose"
        state={state}
      >
        <Stack direction="row" padding={4} spacing={4}>
          <Box flex="2">
            <Card>
              <Box padding={4}>
                <Heading as="h2" size="sm">
                  <FormattedMessage
                    id="petition.fields-header"
                    defaultMessage="Petition fields"
                  />
                </Heading>
              </Box>
              {fieldIds.length ? (
                <>
                  {fieldIds.map((fieldId, index) => (
                    <PetitionComposeField
                      onMove={handleFieldMove}
                      key={fieldId}
                      field={fieldsById[fieldId]}
                      index={index}
                      active={active === fieldId}
                      onSettingsClick={() => setActive(fieldId)}
                      onDeleteClick={() => handleFieldDelete(fieldId)}
                      onFieldEdit={data =>
                        handleFieldUpdate(fieldsById[fieldId], data)
                      }
                    />
                  ))}
                  <Flex padding={2} justifyContent="center">
                    <AddFieldPopover
                      variant="ghost"
                      leftIcon="add"
                      onSelectFieldType={handleAddField}
                    >
                      <FormattedMessage
                        id="petition.add-another-field-button"
                        defaultMessage="Add another field"
                      />
                    </AddFieldPopover>
                  </Flex>
                </>
              ) : (
                <Flex flexDirection="column" alignItems="center">
                  <Heading as="h2" size="md" marginTop={8} marginBottom={2}>
                    <FormattedMessage
                      id="petition.empty-header"
                      defaultMessage="This petition is empty..."
                    />
                  </Heading>
                  <Text fontSize="md">
                    <FormattedMessage
                      id="petition.empty-text"
                      defaultMessage="Start by adding a field"
                    />
                  </Text>
                  <AddFieldPopover
                    marginTop={8}
                    marginBottom={6}
                    variantColor="purple"
                    leftIcon="add"
                    onSelectFieldType={handleAddField}
                  >
                    <FormattedMessage
                      id="petition.add-field-button"
                      defaultMessage="Add field"
                    />
                  </AddFieldPopover>
                </Flex>
              )}
            </Card>
          </Box>
          <Box flex="1">
            {active ? (
              <PetitionComposeFieldSettings
                field={fieldsById[active]}
                onUpdate={data => handleFieldUpdate(fieldsById[active], data)}
                onClose={() => setActive(null)}
              />
            ) : null}
          </Box>
        </Stack>
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
        ...PetitionComposeField_PetitionField
        ...PetitionComposeFieldSettings_PetitionField
      }
    }
    ${PetitionLayout.fragments.petition}
    ${PetitionComposeField.fragments.petitionField}
    ${PetitionComposeFieldSettings.fragments.petitionField}
  `,
  user: gql`
    fragment PetitionCompose_User on User {
      ...PetitionLayout_User
    }
    ${PetitionLayout.fragments.user}
  `
};

const GET_PETITION_COMPOSE_DATA = gql`
  query PetitionCompose($id: ID!) {
    petition(id: $id) {
      ...PetitionCompose_Petition
    }
  }
  ${PetitionCompose.fragments.petition}
`;

const GET_PETITION_COMPOSE_USER_DATA = gql`
  query PetitionComposeUser {
    me {
      ...PetitionCompose_User
    }
  }
  ${PetitionCompose.fragments.user}
`;

function useUpdatePetition() {
  return useMutation<
    PetitionCompose_updatePetitionMutation,
    PetitionCompose_updatePetitionMutationVariables
  >(gql`
    mutation PetitionCompose_updatePetition(
      $id: ID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(id: $id, data: $data) {
        ...PetitionCompose_Petition
      }
    }
    ${PetitionCompose.fragments.petition}
  `);
}

function useUpdateFieldPositions() {
  return useMutation<
    PetitionCompose_updateFieldPositionsMutation,
    PetitionCompose_updateFieldPositionsMutationVariables
  >(gql`
    mutation PetitionCompose_updateFieldPositions($id: ID!, $fieldIds: [ID!]!) {
      updateFieldPositions(id: $id, fieldIds: $fieldIds) {
        id
        ...PetitionCompose_Petition
      }
    }
    ${PetitionCompose.fragments.petition}
  `);
}

function useCreatePetitionField() {
  return useMutation<
    PetitionCompose_createPetitionFieldMutation,
    PetitionCompose_createPetitionFieldMutationVariables
  >(
    gql`
      mutation PetitionCompose_createPetitionField(
        $id: ID!
        $type: PetitionFieldType!
      ) {
        createPetitionField(id: $id, type: $type) {
          field {
            id
            ...PetitionComposeField_PetitionField
            ...PetitionComposeFieldSettings_PetitionField
          }
          petition {
            id
            updatedAt
          }
        }
      }
      ${PetitionComposeField.fragments.petitionField}
      ${PetitionComposeFieldSettings.fragments.petitionField}
    `,
    {
      update(client, { data }) {
        const { field, petition } = data!.createPetitionField;
        const petitionId = defaultDataIdFromObject(petition)!;
        const fragment = gql`
          fragment PetitionCompose_CreatePetitionField_Petition on Petition {
            fields {
              id
            }
          }
        `;
        const cached = client.readFragment<
          PetitionCompose_CreatePetitionField_PetitionFragment
        >({ id: petitionId, fragment });
        client.writeFragment<
          PetitionCompose_CreatePetitionField_PetitionFragment
        >({
          id: petitionId,
          fragment,
          data: {
            __typename: "Petition",
            fields: [...cached!.fields, pick(field, ["id", "__typename"])]
          }
        });
      }
    }
  );
}

function useDeletePetitionField() {
  return useMutation<
    PetitionCompose_deletePetitionFieldMutation,
    PetitionCompose_deletePetitionFieldMutationVariables
  >(gql`
    mutation PetitionCompose_deletePetitionField($id: ID!, $fieldId: ID!) {
      deletePetitionField(id: $id, fieldId: $fieldId) {
        id
        ...PetitionCompose_Petition
      }
    }
    ${PetitionCompose.fragments.petition}
  `);
}

function useUpdatePetitionField() {
  return useMutation<
    PetitionCompose_updatePetitionFieldMutation,
    PetitionCompose_updatePetitionFieldMutationVariables
  >(
    gql`
      mutation PetitionCompose_updatePetitionField(
        $id: ID!
        $fieldId: ID!
        $data: UpdatePetitionFieldInput!
      ) {
        updatePetitionField(id: $id, fieldId: $fieldId, data: $data) {
          field {
            id
            ...PetitionComposeField_PetitionField
            ...PetitionComposeFieldSettings_PetitionField
          }
          petition {
            id
            updatedAt
          }
        }
      }
      ${PetitionComposeField.fragments.petitionField}
      ${PetitionComposeFieldSettings.fragments.petitionField}
    `
  );
}

function ConfirmDelete({ ...props }: DialogCallbacks<void>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.confirm-delete-field.header"
          defaultMessage="Delete field"
        />
      }
      body={
        <FormattedMessage
          id="petition.confirm-delete-field.body"
          defaultMessage="This field might contain collected replies. If you delete this field you will those replies including uploaded files <b>forever</b>."
          values={{
            b: (...chunks: any[]) => <b>{chunks}</b>
          }}
        />
      }
      confirm={
        <Button variantColor="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petitions.confirm-delete.confirm-button"
            defaultMessage="Yes, delete"
          />
        </Button>
      }
      {...props}
    />
  );
}

PetitionCompose.getInitialProps = async ({
  apollo,
  query
}: WithDataContext) => {
  await Promise.all([
    apollo.query<PetitionComposeQuery, PetitionComposeQueryVariables>({
      query: GET_PETITION_COMPOSE_DATA,
      variables: { id: query.petitionId as string }
    }),
    apollo.query<PetitionComposeUserQuery>({
      query: GET_PETITION_COMPOSE_USER_DATA
    })
  ]);
  return {
    petitionId: query.petitionId as string
  };
};

export default withData(PetitionCompose);
