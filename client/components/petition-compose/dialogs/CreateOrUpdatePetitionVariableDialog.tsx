import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Grid,
  HStack,
  Input,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { DeleteIcon, PlusCircleIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  CreateOrUpdatePetitionVariableDialog_createPetitionVariableDocument,
  CreateOrUpdatePetitionVariableDialog_PetitionVariableFragment,
  CreateOrUpdatePetitionVariableDialog_updatePetitionVariableDocument,
  CreatePetitionVariableInput,
  UpdatePetitionVariableInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { REFERENCE_REGEX } from "@parallel/utils/validation";
import { Fragment, useEffect, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isEmpty, omit } from "remeda";

interface CreateOrUpdatePetitionVariableDialogProps {
  variable?: CreateOrUpdatePetitionVariableDialog_PetitionVariableFragment;
  defaultName?: string;
  petitionId: string;
  onDelete?: (name: string) => Promise<boolean>;
}

export interface VariableData {
  name: string;
  defaultValue: number;
  showInReplies: boolean;
  addValueLabels: boolean;
  valueLabels: {
    value: number;
    label: string;
  }[];
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
    watch,
    setFocus,
    setValue,
  } = useForm<VariableData>({
    defaultValues: {
      name: variable?.name || defaultName,
      defaultValue: variable?.defaultValue ?? 0,
      showInReplies: variable?.showInReplies ?? true,
      addValueLabels: isEmpty(variable?.valueLabels ?? []) ? false : true,
      valueLabels:
        variable?.valueLabels && variable.valueLabels.length > 0
          ? variable.valueLabels.map(omit(["__typename"]))
          : [
              {
                value: 0,
                label: "",
              },
            ],
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
      const isDeleted = await onDelete?.(variable!.name);
      if (isDeleted) {
        props.onReject();
      }
    } catch (e) {}
  };

  const [updatePetitionVariable] = useMutation(
    CreateOrUpdatePetitionVariableDialog_updatePetitionVariableDocument,
  );

  const handleUpdateVariable = async (data: UpdatePetitionVariableInput) => {
    await updatePetitionVariable({
      variables: {
        petitionId,
        name: variable!.name,
        data,
      },
    });
  };

  const [createPetitionVariable] = useMutation(
    CreateOrUpdatePetitionVariableDialog_createPetitionVariableDocument,
  );

  const handleCreateVariable = async (data: CreatePetitionVariableInput) => {
    await createPetitionVariable({
      variables: {
        petitionId,
        data,
      },
    });
  };

  const addValueLabels = watch("addValueLabels");
  const valueLabelsWatch = watch("valueLabels");

  // Validation function to check for unique values
  const validateUniqueValue = (value: number, index: number) => {
    const currentValues = valueLabelsWatch || [];
    const duplicateCount = currentValues.filter(
      (item, i) => i !== index && item.value === value,
    ).length;
    return (
      duplicateCount === 0 ||
      intl.formatMessage({
        id: "component.create-or-edit-petition-variable-dialog.duplicate-value-error",
        defaultMessage: "This value already exists",
      })
    );
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "valueLabels",
    rules: { required: addValueLabels },
  });

  useEffect(() => {
    if (addValueLabels) {
      // Use setTimeout to ensure the DOM has been updated
      setTimeout(() => {
        setFocus("valueLabels.0.value");
      }, 0);
    } else {
      setValue("valueLabels", [
        {
          value: 0,
          label: "",
        },
      ]);
    }
  }, [addValueLabels]);

  return (
    <ConfirmDialog
      initialFocusRef={isEditing ? initValueRef : nameRef}
      size="lg"
      hasCloseButton={false}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            try {
              const processedData = {
                ...omit(data, ["valueLabels", "addValueLabels"]),
                valueLabels: data.addValueLabels ? data.valueLabels : null,
              };
              if (isEditing) {
                await handleUpdateVariable(omit(processedData, ["name"]));
              } else {
                await handleCreateVariable(processedData);
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
        },
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
        <Stack gap={4}>
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

          <FormControl as={HStack}>
            <Stack flex={1} gap={1}>
              <FormLabel margin={0}>
                <FormattedMessage
                  id="component.create-or-edit-petition-variable-dialog.show-in-replies"
                  defaultMessage="Show in the review section"
                />
              </FormLabel>
              <FormHelperText margin={0}>
                <FormattedMessage
                  id="component.create-or-edit-petition-variable-dialog.show-in-replies-description"
                  defaultMessage="If you enable this option, the variable will appear in the review section."
                />
              </FormHelperText>
            </Stack>
            <Center>
              <Switch {...register("showInReplies")} />
            </Center>
          </FormControl>
          <FormControl as={HStack}>
            <Stack flex={1} gap={1}>
              <FormLabel margin={0}>
                <FormattedMessage
                  id="component.create-or-edit-petition-variable-dialog.add-value-labels"
                  defaultMessage="Add value labels"
                />
              </FormLabel>
              <FormHelperText margin={0}>
                <FormattedMessage
                  id="component.create-or-edit-petition-variable-dialog.add-value-labels-description"
                  defaultMessage="Change the label of the variable depending on the value."
                />
              </FormHelperText>
            </Stack>
            <Center>
              <Switch {...register("addValueLabels")} />
            </Center>
          </FormControl>
          {addValueLabels ? (
            <Grid templateColumns="auto auto auto" gap={2}>
              <FormLabel margin={0} fontWeight="normal">
                <FormattedMessage
                  id="component.create-or-edit-petition-variable-dialog.value"
                  defaultMessage="Value"
                />
              </FormLabel>
              <FormLabel margin={0} fontWeight="normal">
                <FormattedMessage
                  id="component.create-or-edit-petition-variable-dialog.label"
                  defaultMessage="Label"
                />
              </FormLabel>
              <Box></Box>
              {fields.map((field, index) => {
                return (
                  <Fragment key={field.id}>
                    <FormControl isInvalid={!!errors.valueLabels?.[index]?.value}>
                      <Controller
                        name={`valueLabels.${index}.value`}
                        control={control}
                        rules={{
                          required: true,
                          validate: (value) => validateUniqueValue(value, index),
                        }}
                        render={({ field }) => (
                          <NumeralInput
                            {...field}
                            value={field.value as number}
                            onChange={(value) => {
                              field.onChange((value as number) ?? null);
                            }}
                            placeholder={intl.formatMessage({
                              id: "component.create-or-edit-petition-variable-dialog.value-placeholder",
                              defaultMessage: "e.g. 1, 2, 3",
                            })}
                          />
                        )}
                      />
                      <FormErrorMessage>
                        {errors.valueLabels?.[index]?.value?.message || (
                          <FormattedMessage
                            id="generic.field-required-error"
                            defaultMessage="This field is required"
                          />
                        )}
                      </FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.valueLabels?.[index]?.label}>
                      <Input
                        {...register(`valueLabels.${index}.label`, { required: true })}
                        placeholder={intl.formatMessage({
                          id: "component.create-or-edit-petition-variable-dialog.label-placeholder",
                          defaultMessage: "e.g. Low, Medium, High",
                        })}
                      />
                    </FormControl>
                    <IconButtonWithTooltip
                      isDisabled={fields.length === 1}
                      variant="outline"
                      onClick={() => {
                        remove(index);
                        setFocus(`valueLabels.${index - 1}.value`);
                      }}
                      icon={<DeleteIcon />}
                      label={intl.formatMessage({
                        id: "generic.delete",
                        defaultMessage: "Delete",
                      })}
                    />
                  </Fragment>
                );
              })}
              <Box>
                <Button
                  variant="outline"
                  leftIcon={<PlusCircleIcon />}
                  onClick={() => {
                    append({ value: 0, label: "" });
                    setTimeout(() => {
                      setFocus(`valueLabels.${fields.length}.value`);
                    }, 0);
                  }}
                >
                  <FormattedMessage
                    id="component.create-or-edit-petition-variable-dialog.add-label"
                    defaultMessage="Add label"
                  />
                </Button>
              </Box>
            </Grid>
          ) : null}
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

useCreateOrUpdatePetitionVariableDialog.fragments = {
  get PetitionVariable() {
    return gql`
      fragment CreateOrUpdatePetitionVariableDialog_PetitionVariable on PetitionVariable {
        name
        defaultValue
        showInReplies
        valueLabels {
          value
          label
        }
      }
    `;
  },
  get PetitionBase() {
    return gql`
      fragment CreateOrUpdatePetitionVariableDialog_PetitionBase on PetitionBase {
        id
        variables {
          ...CreateOrUpdatePetitionVariableDialog_PetitionVariable
        }
        lastChangeAt
      }
      ${this.PetitionVariable}
    `;
  },
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
    ${useCreateOrUpdatePetitionVariableDialog.fragments.PetitionBase}
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
    ${useCreateOrUpdatePetitionVariableDialog.fragments.PetitionBase}
  `,
];
