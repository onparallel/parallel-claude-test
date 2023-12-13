import { gql, useMutation } from "@apollo/client";
import { Button, FormControl, FormLabel, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  CreateOrUpdatePetitionVariableDialog_createPetitionVariableDocument,
  CreateOrUpdatePetitionVariableDialog_updatePetitionVariableDocument,
  PetitionVariable,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { REFERENCE_REGEX } from "@parallel/utils/validation";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface CreateOrUpdatePetitionVariableDialogProps {
  variable?: PetitionVariable;
  defaultName?: string;
  petitionId: string;
  onDelete?: (name: string) => Promise<void>;
}

export interface VariableData {
  name: string;
  defaultValue: number;
}

function CreateOrUpdatePetitionVariableDialog({
  variable,
  defaultName,
  petitionId,
  onDelete,
  ...props
}: DialogProps<CreateOrUpdatePetitionVariableDialogProps, VariableData>) {
  const intl = useIntl();
  const isEditing = variable !== undefined;
  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
    setError,
  } = useForm<VariableData>({
    defaultValues: {
      name: variable?.name || defaultName,
      defaultValue: variable?.defaultValue ?? 0,
    },
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const nameRegisterProps = useRegisterWithRef(nameRef, register, "name", {
    required: true,
    pattern: REFERENCE_REGEX,
    maxLength: 30,
  });
  const initValueRef = useRef<HTMLInputElement>(null);

  const handleDeleteVariable = async () => {
    try {
      await onDelete?.(variable!.name);
      props.onReject();
    } catch (e) {}
  };

  const [updatePetitionVariable] = useMutation(
    CreateOrUpdatePetitionVariableDialog_updatePetitionVariableDocument,
  );

  const handleUpdateVariable = async (defaultValue: number) => {
    await updatePetitionVariable({
      variables: {
        petitionId,
        name: variable!.name,
        data: {
          defaultValue,
        },
      },
    });
  };

  const [createPetitionVariable] = useMutation(
    CreateOrUpdatePetitionVariableDialog_createPetitionVariableDocument,
  );

  const handleCreateVariable = async (data: VariableData) => {
    const { name, defaultValue } = data;
    await createPetitionVariable({
      variables: {
        petitionId,
        data: {
          name,
          defaultValue,
        },
      },
    });
  };

  return (
    <ConfirmDialog
      initialFocusRef={isEditing ? initValueRef : nameRef}
      size="lg"
      hasCloseButton={false}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          try {
            if (isEditing) {
              await handleUpdateVariable(data.defaultValue);
            } else {
              await handleCreateVariable(data);
            }
            props.onResolve(data);
          } catch (e) {
            if (
              isApolloError(e, "ALIAS_ALREADY_EXISTS") ||
              isApolloError(e, "PETITION_VARIABLE_ALREADY_EXISTS_ERROR")
            ) {
              setError("name", { type: "unavailable" });
            }
          }
        }),
      }}
      header={
        isEditing ? (
          <FormattedMessage
            id="component.create-or-edit-petition-variable-dialog.edit-title"
            defaultMessage="Edit variable"
          />
        ) : (
          <FormattedMessage
            id="component.create-or-edit-petition-variable-dialog.create-title"
            defaultMessage="New variable"
          />
        )
      }
      body={
        <Stack gap={2}>
          <HStack alignItems="flex-start">
            <FormControl id="name" isInvalid={!!errors.name}>
              <FormLabel fontWeight="normal">
                <FormattedMessage
                  id="component.create-or-edit-petition-variable-dialog.variable-name"
                  defaultMessage="Variable name"
                />
              </FormLabel>
              <Input
                maxLength={30}
                isDisabled={isEditing}
                {...nameRegisterProps}
                placeholder={intl.formatMessage({
                  id: "component.create-or-edit-petition-variable-dialog.variable-name-placeholder",
                  defaultMessage: "e.g: price, score",
                })}
              />
            </FormControl>
            <FormControl id="defaultValue" isInvalid={!!errors.defaultValue}>
              <FormLabel fontWeight="normal">
                <FormattedMessage
                  id="component.create-or-edit-petition-variable-dialog.variable-initial-value"
                  defaultMessage="Initial value"
                />
              </FormLabel>
              <Controller
                name="defaultValue"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <NumeralInput
                    {...field}
                    onChange={(value) => {
                      field.onChange((value as number) ?? null);
                    }}
                    ref={initValueRef}
                  />
                )}
              />
            </FormControl>
          </HStack>
          {errors.name ? (
            <Text color="red.500">
              {errors.name?.type === "unavailable" ? (
                <FormattedMessage
                  id="component.create-or-edit-petition-variable-dialog.unique-identifier-alredy-exists"
                  defaultMessage="This identifier is already in use"
                />
              ) : (
                <FormattedMessage
                  id="component.create-or-edit-petition-variable-dialog.variable-invalid-error"
                  defaultMessage="The name must begin with letters and can only contain letters, numbers and _"
                />
              )}
            </Text>
          ) : null}

          <Text fontSize="sm">
            <FormattedMessage
              id="component.create-or-edit-petition-variable-dialog.info-name-variable"
              defaultMessage="Once the variable is added, its name cannot be edited."
            />
          </Text>
        </Stack>
      }
      alternative={
        isEditing ? (
          <Button variant="outline" colorScheme="red" onClick={handleDeleteVariable}>
            <FormattedMessage id="generic.delete" defaultMessage="Delete" />
          </Button>
        ) : undefined
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          {isEditing ? (
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          ) : (
            <FormattedMessage id="generic.add" defaultMessage="Add" />
          )}
        </Button>
      }
      {...props}
    />
  );
}

export function useCreateOrUpdatePetitionVariableDialog() {
  return useDialog(CreateOrUpdatePetitionVariableDialog);
}

const _fragments = {
  PetitionBase: gql`
    fragment CreateOrUpdatePetitionVariableDialog_PetitionBase on PetitionBase {
      id
      variables {
        name
        defaultValue
      }
      lastChangeAt
    }
  `,
};

const _mutations = [
  gql`
    mutation CreateOrUpdatePetitionVariableDialog_createPetitionVariable(
      $petitionId: GID!
      $data: CreatePetitionVariableInput!
    ) {
      createPetitionVariable(petitionId: $petitionId, data: $data) {
        ...CreateOrUpdatePetitionVariableDialog_PetitionBase
      }
    }
    ${_fragments.PetitionBase}
  `,
  gql`
    mutation CreateOrUpdatePetitionVariableDialog_updatePetitionVariable(
      $petitionId: GID!
      $name: String!
      $data: UpdatePetitionVariableInput!
    ) {
      updatePetitionVariable(petitionId: $petitionId, name: $name, data: $data) {
        ...CreateOrUpdatePetitionVariableDialog_PetitionBase
      }
    }
    ${_fragments.PetitionBase}
  `,
];
