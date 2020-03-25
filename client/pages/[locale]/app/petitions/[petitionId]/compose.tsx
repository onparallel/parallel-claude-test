import { useMutation } from "@apollo/react-hooks";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { Spacer } from "@parallel/components/common/Spacer";
import { Title } from "@parallel/components/common/Title";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { AddFieldPopover } from "@parallel/components/petition/AddFieldPopover";
import { PetitionComposeField } from "@parallel/components/petition/PetitionComposeField";
import { PetitionComposeFieldSettings } from "@parallel/components/petition/PetitionComposeFieldSettings";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  PetitionComposeQuery,
  PetitionComposeQueryVariables,
  PetitionComposeUserQuery,
  PetitionCompose_createPetitionFieldMutation,
  PetitionCompose_createPetitionFieldMutationVariables,
  PetitionCompose_createPetitionField_PetitionFragment,
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
  UpdatePetitionInput,
  PetitionCompose_updateFieldPositions_PetitionFragment,
} from "@parallel/graphql/__types";
import {
  usePetitionState,
  useWrapPetitionUpdater,
} from "@parallel/utils/petitions";
import { UnwrapArray, UnwrapPromise, Assert } from "@parallel/utils/types";
import { useQueryData } from "@parallel/utils/useQueryData";
import { gql } from "apollo-boost";
import {
  useCallback,
  useEffect,
  useReducer,
  KeyboardEvent,
  useRef,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { indexBy, omit, pick } from "remeda";
import { useRouter } from "next/router";

type PetitionProps = UnwrapPromise<
  ReturnType<typeof PetitionCompose.getInitialProps>
>;

type FieldSelection = UnwrapArray<
  Assert<PetitionComposeQuery["petition"]>["fields"]
>;

type FieldsReducerState = {
  active: string | null;
  fieldsById: { [id: string]: FieldSelection };
  fieldIds: string[];
};

function fieldsReducer(
  state: FieldsReducerState,
  action:
    | { type: "RESET"; fields: FieldSelection[] }
    | { type: "SORT"; fieldIds: string[] }
    | { type: "REMOVE"; fieldId: string }
    | { type: "SET_ACTIVE"; fieldId: string | null }
): FieldsReducerState {
  switch (action.type) {
    case "RESET":
      return reset(action.fields, state);
    case "SORT":
      return {
        ...state,
        fieldIds: action.fieldIds,
      };
    case "REMOVE":
      return {
        active: state.active === action.fieldId ? null : state.active,
        fieldsById: omit(state.fieldsById, [action.fieldId]),
        fieldIds: state.fieldIds.filter((id) => id !== action.fieldId),
      };
    case "SET_ACTIVE":
      return {
        ...state,
        active: action.fieldId,
      };
  }
}

function reset(
  fields: FieldSelection[],
  prev?: FieldsReducerState
): FieldsReducerState {
  return {
    active:
      prev?.active && fields.some((f) => f.id == prev?.active)
        ? prev!.active
        : null,
    fieldsById: indexBy(fields, (f) => f.id),
    fieldIds: fields.map((f) => f.id),
  };
}

function PetitionCompose({ petitionId }: PetitionProps) {
  const intl = useIntl();
  const { me } = useQueryData<PetitionsUserQuery>(
    GET_PETITION_COMPOSE_USER_DATA
  );
  const { petition } = useQueryData<
    PetitionComposeQuery,
    PetitionComposeQueryVariables
  >(GET_PETITION_COMPOSE_DATA, { variables: { id: petitionId } });

  const [state, setState] = usePetitionState();
  const [{ active, fieldsById, fieldIds }, dispatch] = useReducer(
    fieldsReducer,
    petition!.fields,
    reset
  );
  useEffect(() => dispatch({ type: "RESET", fields: petition!.fields }), [
    petition!.fields,
  ]);

  const completedDialog = useDialog(CompletedPetitionDialog, []);
  useEffect(() => {
    if (petition?.status === "COMPLETED") {
      completedDialog({});
    }
  }, []);

  const addFieldRef = useRef<HTMLButtonElement>(null);
  const confirmDelete = useDialog(ConfirmDelete, []);
  const wrapper = useWrapPetitionUpdater(setState);

  const [updatePetition] = useUpdatePetition();
  const updateFieldPositions = useUpdateFieldPositions();
  const createPetitionField = useCreatePetitionField();
  const deletePetitionField = useDeletePetitionField();
  const [updatePetitionField] = useUpdatePetitionField();

  const handleOnUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId]
  );

  const handleFieldMove = useCallback(
    async function (dragIndex: number, hoverIndex: number, dropped?: boolean) {
      const newFieldIds = [...fieldIds];
      const [field] = newFieldIds.splice(dragIndex, 1);
      newFieldIds.splice(hoverIndex, 0, field);
      dispatch({ type: "SORT", fieldIds: newFieldIds });
      if (dropped) {
        await wrapper(updateFieldPositions)(petitionId, newFieldIds);
      }
    },
    [petitionId, fieldIds]
  );

  const handleFieldDelete = useCallback(
    async function (fieldId: string) {
      try {
        await confirmDelete({});
        dispatch({ type: "REMOVE", fieldId });
        await wrapper(deletePetitionField)(petitionId, fieldId);
      } catch {}
    },
    [petitionId]
  );

  const handleFieldUpdate = useCallback(
    wrapper(async function (
      field: UnwrapArray<PetitionCompose_PetitionFragment["fields"]>,
      data: UpdatePetitionFieldInput
    ) {
      await updatePetitionField({
        variables: { petitionId, fieldId: field.id, data },
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
    [petitionId]
  );

  const focusTitle = useCallback((fieldId: string) => {
    const title = document.querySelector<HTMLElement>(
      `#field-title-${fieldId}`
    );
    title?.click();
  }, []);

  const handleAddField = useCallback(
    wrapper(async function (type: PetitionFieldType) {
      const { data } = await createPetitionField(petitionId, type);
      const field = data!.createPetitionField.field;
      setTimeout(() => focusTitle(field.id));
    }),
    [petitionId]
  );

  const handleTitleKeyDown = useCallback(
    function (fieldId: string, event: KeyboardEvent<any>) {
      const index = fieldIds.indexOf(fieldId);
      switch (event.key) {
        case "ArrowDown":
          if (index < fieldIds.length - 1) {
            focusTitle(fieldIds[index + 1]);
          }
          break;
        case "ArrowUp":
          if (index > 0) {
            focusTitle(fieldIds[index - 1]);
          }
          break;
        case "Enter":
          addFieldRef.current!.click();
          break;
      }
    },
    [fieldIds]
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
        onUpdatePetition={handleOnUpdatePetition}
        section="compose"
        scrollBody
        state={state}
      >
        <Flex flexDirection="row" padding={4}>
          <Box
            flex="2"
            display={{ base: active ? "none" : "block", md: "block" }}
          >
            <Card>
              <Box padding={4}>
                <Heading as="h2" size="sm">
                  <FormattedMessage
                    id="petition.fields-header"
                    defaultMessage="This is the information that you need"
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
                      onSettingsClick={() =>
                        dispatch({ type: "SET_ACTIVE", fieldId })
                      }
                      onDeleteClick={() => handleFieldDelete(fieldId)}
                      onFieldEdit={(data) =>
                        handleFieldUpdate(fieldsById[fieldId], data)
                      }
                      onTitleKeyDown={(event) =>
                        handleTitleKeyDown(fieldId, event)
                      }
                    />
                  ))}
                  <Flex padding={2} justifyContent="center">
                    <AddFieldPopover
                      ref={addFieldRef}
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
                      defaultMessage="What information do you want us to collect?"
                    />
                  </Heading>
                  <Text fontSize="md">
                    <FormattedMessage
                      id="petition.empty-text"
                      defaultMessage="Let's add our first field"
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
          {active ? null : (
            <Spacer flex="1" display={{ base: "none", md: "block" }} />
          )}
          {active ? (
            <Box flex="1" marginLeft={{ base: 0, md: 4 }}>
              <PetitionComposeFieldSettings
                field={fieldsById[active]}
                onUpdate={(data) => handleFieldUpdate(fieldsById[active], data)}
                onClose={() => dispatch({ type: "SET_ACTIVE", fieldId: null })}
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
  `,
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
      $petitionId: ID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionCompose_Petition
      }
    }
    ${PetitionCompose.fragments.petition}
  `);
}

function useUpdateFieldPositions() {
  const [mutate] = useMutation<
    PetitionCompose_updateFieldPositionsMutation,
    PetitionCompose_updateFieldPositionsMutationVariables
  >(gql`
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
  `);
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
  const [mutate] = useMutation<
    PetitionCompose_createPetitionFieldMutation,
    PetitionCompose_createPetitionFieldMutationVariables
  >(
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
    `
  );
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
  const [mutate] = useMutation<
    PetitionCompose_deletePetitionFieldMutation,
    PetitionCompose_deletePetitionFieldMutationVariables
  >(gql`
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
  `);
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

function useUpdatePetitionField() {
  return useMutation<
    PetitionCompose_updatePetitionFieldMutation,
    PetitionCompose_updatePetitionFieldMutationVariables
  >(
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
            b: (...chunks: any[]) => <b>{chunks}</b>,
          }}
        />
      }
      confirm={
        <Button variantColor="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="generic.confirm-delete-button"
            defaultMessage="Yes, delete"
          />
        </Button>
      }
      {...props}
    />
  );
}

function CompletedPetitionDialog({ ...props }: DialogCallbacks<void>) {
  const focusRef = useRef(null);
  const router = useRouter();
  return (
    <ConfirmDialog
      focusRef={focusRef}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      header={
        <FormattedMessage
          id="petition.completed-petition-dialog.header"
          defaultMessage="This petition is completed"
        />
      }
      body={
        <FormattedMessage
          id="petition.completed-petition-dialog.body"
          defaultMessage="This petition was already completed by the recipient. If you make any changes to the fields, the recipients will have to submit it again."
        />
      }
      confirm={
        <Button variantColor="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.completed-petition-dialog.confirm-button"
            defaultMessage="I understand"
          />
        </Button>
      }
      cancel={
        <Button
          ref={focusRef}
          onClick={() => {
            props.onResolve();
            router.back();
          }}
        >
          <FormattedMessage
            id="generic.go-back-button"
            defaultMessage="Go back"
          />
        </Button>
      }
      {...props}
    />
  );
}

PetitionCompose.getInitialProps = async ({
  apollo,
  query,
}: WithDataContext) => {
  await Promise.all([
    apollo.query<PetitionComposeQuery, PetitionComposeQueryVariables>({
      query: GET_PETITION_COMPOSE_DATA,
      variables: { id: query.petitionId as string },
    }),
    apollo.query<PetitionComposeUserQuery>({
      query: GET_PETITION_COMPOSE_USER_DATA,
    }),
  ]);
  return {
    petitionId: query.petitionId as string,
  };
};

export default withData(PetitionCompose);
