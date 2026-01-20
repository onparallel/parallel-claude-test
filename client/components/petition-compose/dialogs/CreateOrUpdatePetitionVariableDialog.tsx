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
  RadioProps,
  Switch,
  Table,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react";
import {
  CalculatorIcon,
  DeleteIcon,
  DragHandleIcon,
  ListIcon,
  PlusCircleIcon,
  StarEmptyIcon,
  StarIcon,
} from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { HStack, Input, Stack, Text } from "@parallel/components/ui";
import {
  CreatePetitionVariableInput,
  PetitionVariableType,
  useCreatePetitionVariableDialog_createPetitionVariableDocument,
  useCreatePetitionVariableDialog_PetitionVariableFragment,
  useCreatePetitionVariableDialog_updatePetitionVariableDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { assertTypename } from "@parallel/utils/apollo/typename";
import { useFieldArrayReorder } from "@parallel/utils/react-form-hook/useFieldArrayReorder";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useSetFocusRef } from "@parallel/utils/react-form-hook/useSetFocusRef";
import { REFERENCE_REGEX } from "@parallel/utils/validation";
import { MotionConfig, Reorder, useDragControls } from "framer-motion";
import { forwardRef, Fragment, KeyboardEvent, ReactNode, Ref, useMemo, useRef } from "react";
import {
  Controller,
  FieldArrayWithId,
  FormProvider,
  useFieldArray,
  UseFieldArrayUpdate,
  useForm,
  useFormContext,
} from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isEmpty, isNonNullish, omit, pick } from "remeda";

interface CreateOrUpdatePetitionVariableDialogProps {
  variable?: useCreatePetitionVariableDialog_PetitionVariableFragment;
  defaultName?: string;
  petitionId: string;
  onDelete?: (name: string) => Promise<boolean>;
}

type CreateOrUpdatePetitionVariableDialogSteps = {
  SELECT_VARIABLE_TYPE: CreateOrUpdatePetitionVariableDialogProps & {
    variableType?: PetitionVariableType;
  };
  NUMERIC_VARIABLE: CreateOrUpdatePetitionVariableDialogProps;
  ENUM_VARIABLE: CreateOrUpdatePetitionVariableDialogProps;
};

interface NumericVariableData {
  name: string;
  defaultValue: number;
  showInReplies: boolean;
  addValueLabels: boolean;
  valueLabels: {
    value: number;
    label: string;
  }[];
}

interface EnumVariableData {
  name: string;
  showInReplies: boolean;
  valueLabels: {
    value: string;
    label: string;
    isDefault: boolean;
  }[];
}

function SelectVariableTypeDialog({
  variableType,
  onStep,
  ...props
}: WizardStepDialogProps<
  CreateOrUpdatePetitionVariableDialogSteps,
  "SELECT_VARIABLE_TYPE",
  { variableType: PetitionVariableType }
>) {
  const { handleSubmit, control, setFocus } = useForm<{
    variableType: PetitionVariableType;
  }>({
    mode: "onSubmit",
    defaultValues: {
      variableType: variableType ?? "NUMBER",
    },
  });

  return (
    <ConfirmDialog
      size="lg"
      initialFocusRef={useSetFocusRef(setFocus, "variableType")}
      closeOnOverlayClick={false}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            if (data.variableType === "NUMBER") {
              onStep(
                "NUMERIC_VARIABLE",
                {
                  ...pick(props, ["variable", "defaultName", "petitionId", "onDelete"] as const),
                },
                {
                  variableType: "NUMBER",
                },
              );
            } else {
              onStep(
                "ENUM_VARIABLE",
                {
                  ...pick(props, ["variable", "defaultName", "petitionId", "onDelete"] as const),
                },
                {
                  variableType: "ENUM",
                },
              );
            }
          }),
        },
      }}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.create-or-update-petition-variable-dialog.select-variable-type-title"
          defaultMessage="What do you want to create?"
        />
      }
      body={
        <FormControl as={Stack} gap={3}>
          <FormLabel fontWeight="normal">
            <FormattedMessage
              id="component.create-or-update-petition-variable-dialog.select-variable-type"
              defaultMessage="Select the variable type that best fits your needs."
            />
          </FormLabel>
          <Controller
            name="variableType"
            control={control}
            rules={{ required: true }}
            render={({ field }) => <PetitionVariableTypeRadio {...field} />}
          />
        </FormControl>
      }
      confirm={
        <Button type="submit" colorScheme="primary">
          <FormattedMessage id="generic.next-button" defaultMessage="Next" />
        </Button>
      }
      {...props}
    />
  );
}

function CreateOrUpdateNumericVariableDialog({
  variable,
  defaultName,
  petitionId,
  onDelete,
  onBack,
  ...props
}: WizardStepDialogProps<
  CreateOrUpdatePetitionVariableDialogSteps,
  "NUMERIC_VARIABLE",
  { variable: CreatePetitionVariableInput }
>) {
  const intl = useIntl();
  const isUpdating = isNonNullish(variable);

  if (isUpdating) {
    assertTypename(variable, "PetitionVariableNumber");
  }

  const {
    handleSubmit,
    control,
    register,
    watch,
    setFocus,
    setError,
    formState: { errors },
  } = useForm<NumericVariableData>({
    mode: "onSubmit",
    defaultValues: {
      name: variable?.name || defaultName,
      defaultValue: variable?.defaultValue ?? 0,
      showInReplies: variable?.showInReplies ?? true,
      addValueLabels: isEmpty(variable?.valueLabels ?? []) ? false : true,
      valueLabels: variable?.valueLabels.map((v) => omit(v, ["__typename"])) ?? [
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

  const addValueLabels = watch("addValueLabels");
  const valueLabelsWatch = watch("valueLabels");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "valueLabels",
    rules: { required: addValueLabels },
  });

  const validateUniqueValue = (value: number, index: number) => {
    const currentValues = valueLabelsWatch || [];
    const duplicateCount = currentValues.filter(
      (item, i) => i !== index && item.value === value,
    ).length;
    return (
      duplicateCount === 0 ||
      intl.formatMessage({
        id: "component.create-or-update-petition-variable-dialog.duplicate-value-error",
        defaultMessage: "This value already exists",
      })
    );
  };

  const handleDelete = async () => {
    try {
      const isDeleted = await onDelete?.(variable?.name ?? "");
      if (isDeleted) {
        props.onReject();
      }
    } catch {}
  };

  const [createPetitionVariable] = useMutation(
    useCreatePetitionVariableDialog_createPetitionVariableDocument,
  );
  const [updatePetitionVariable] = useMutation(
    useCreatePetitionVariableDialog_updatePetitionVariableDocument,
  );

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      closeOnOverlayClick={false}
      initialFocusRef={isUpdating ? initValueRef : nameRef}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            try {
              const variable = {
                type: "NUMBER" as PetitionVariableType,
                name: data.name,
                defaultValue: data.defaultValue,
                showInReplies: data.showInReplies,
                valueLabels: data.addValueLabels ? data.valueLabels : [],
              };

              if (isUpdating) {
                await updatePetitionVariable({
                  variables: {
                    petitionId,
                    name: variable.name,
                    data: pick(variable, ["defaultValue", "showInReplies", "valueLabels"]),
                  },
                });
              } else {
                await createPetitionVariable({
                  variables: { petitionId, data: variable },
                });
              }

              props.onResolve({
                variable,
              });
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
        isUpdating ? (
          <FormattedMessage
            id="component.create-or-update-petition-variable-dialog.edit-variable-title"
            defaultMessage="Edit {variableName}"
            values={{
              variableName: variable?.name,
            }}
          />
        ) : (
          <FormattedMessage
            id="component.create-or-update-petition-variable-dialog.numeric-variable-title"
            defaultMessage="Create numeric variable"
          />
        )
      }
      body={
        <Stack gap={4} flex="1">
          <Stack gap={2}>
            <HStack alignItems="flex-start">
              <FormControl id="name" isInvalid={!!errors.name}>
                <FormLabel fontWeight="normal">
                  <FormattedMessage
                    id="component.create-or-update-petition-variable-dialog.variable-name"
                    defaultMessage="Variable name"
                  />
                </FormLabel>
                <Input
                  maxLength={30}
                  disabled={isUpdating}
                  {...nameRegisterProps}
                  placeholder={intl.formatMessage({
                    id: "component.create-or-update-petition-variable-dialog.variable-name-placeholder",
                    defaultMessage: "e.g: price, score",
                  })}
                />
              </FormControl>

              <FormControl id="defaultValue" isInvalid={!!errors.defaultValue}>
                <FormLabel fontWeight="normal">
                  <FormattedMessage
                    id="component.create-or-update-petition-variable-dialog.variable-initial-value"
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
                    id="component.create-or-update-petition-variable-dialog.unique-identifier-alredy-exists"
                    defaultMessage="This identifier is already in use"
                  />
                ) : (
                  <FormattedMessage
                    id="component.create-or-update-petition-variable-dialog.variable-invalid-error"
                    defaultMessage="The name must begin with letters and can only contain letters, numbers and _"
                  />
                )}
              </Text>
            ) : null}

            <Text fontSize="sm">
              <FormattedMessage
                id="component.create-or-update-petition-variable-dialog.info-name-variable"
                defaultMessage="Once the variable is added, its name cannot be edited."
              />
            </Text>
          </Stack>

          <FormControl as={HStack}>
            <Stack flex={1} gap={1}>
              <FormLabel margin={0}>
                <FormattedMessage
                  id="component.create-or-update-petition-variable-dialog.show-in-replies"
                  defaultMessage="Show in the review section"
                />
              </FormLabel>
              <FormHelperText margin={0}>
                <FormattedMessage
                  id="component.create-or-update-petition-variable-dialog.show-in-replies-description"
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
                  id="component.create-or-update-petition-variable-dialog.add-value-labels"
                  defaultMessage="Add value labels"
                />
              </FormLabel>
              <FormHelperText margin={0}>
                <FormattedMessage
                  id="component.create-or-update-petition-variable-dialog.add-value-labels-description"
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
                  id="component.create-or-update-petition-variable-dialog.value"
                  defaultMessage="Value"
                />
              </FormLabel>
              <FormLabel margin={0} fontWeight="normal">
                <FormattedMessage
                  id="component.create-or-update-petition-variable-dialog.label"
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
                              id: "component.create-or-update-petition-variable-dialog.value-placeholder",
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
                          id: "component.create-or-update-petition-variable-dialog.label-placeholder",
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
                    id="component.create-or-update-petition-variable-dialog.add-label"
                    defaultMessage="Add label"
                  />
                </Button>
              </Box>
            </Grid>
          ) : null}
        </Stack>
      }
      alternative={
        isUpdating ? (
          <Button variant="outline" colorScheme="red" onClick={handleDelete}>
            <FormattedMessage id="generic.delete" defaultMessage="Delete" />
          </Button>
        ) : undefined
      }
      cancel={
        isUpdating ? undefined : (
          <Button onClick={() => onBack()}>
            <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
          </Button>
        )
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          {isUpdating ? (
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

function CreateOrUpdateEnumVariableDialog({
  variable,
  defaultName,
  petitionId,
  onDelete,
  onBack,
  ...props
}: WizardStepDialogProps<
  CreateOrUpdatePetitionVariableDialogSteps,
  "ENUM_VARIABLE",
  { variable: CreatePetitionVariableInput }
>) {
  const intl = useIntl();
  const isUpdating = isNonNullish(variable);

  if (isUpdating) {
    assertTypename(variable, "PetitionVariableEnum");
  }

  const form = useForm<EnumVariableData>({
    mode: "onSubmit",
    defaultValues: {
      name: variable?.name || defaultName,
      showInReplies: variable?.showInReplies ?? true,
      valueLabels: variable?.enumLabels?.map((v: { value: string; label: string }) => ({
        value: v.value,
        label: v.label,
        isDefault: v.value === variable?.defaultEnum,
      })) ?? [
        {
          value: "",
          label: "",
          isDefault: true,
        },
      ],
    },
  });

  const {
    handleSubmit,
    control,
    register,
    setFocus,
    getValues,
    formState: { errors },
    setError,
  } = form;

  const nameRef = useRef<HTMLInputElement>(null);
  const nameRegisterProps = useRegisterWithRef(nameRef, register, "name", {
    required: true,
    pattern: REFERENCE_REGEX,
    maxLength: 30,
  });

  const { fields, append, remove, reorder, update } = useFieldArrayReorder({
    control,
    name: "valueLabels",
    rules: { required: true },
  });

  const handleDelete = async () => {
    try {
      const isDeleted = await onDelete?.(variable?.name ?? "");
      if (isDeleted) {
        props.onReject();
      }
    } catch {}
  };

  const [createPetitionVariable] = useMutation(
    useCreatePetitionVariableDialog_createPetitionVariableDocument,
  );
  const [updatePetitionVariable] = useMutation(
    useCreatePetitionVariableDialog_updatePetitionVariableDocument,
  );

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      closeOnOverlayClick={false}
      initialFocusRef={nameRef}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            try {
              const variable = {
                type: "ENUM" as PetitionVariableType,
                name: data.name,
                showInReplies: data.showInReplies,
                defaultValue: data.valueLabels.find((v) => v.isDefault)?.value ?? "",
                valueLabels: data.valueLabels.map((v) => ({
                  value: v.value,
                  label: v.label,
                })),
              };

              if (isUpdating) {
                await updatePetitionVariable({
                  variables: {
                    petitionId,
                    name: variable.name,
                    data: pick(variable, ["defaultValue", "showInReplies", "valueLabels"]),
                  },
                });
              } else {
                await createPetitionVariable({
                  variables: { petitionId, data: variable },
                });
              }

              props.onResolve({
                variable,
              });
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
        isUpdating ? (
          <FormattedMessage
            id="component.create-or-update-petition-variable-dialog.edit-variable-title"
            defaultMessage="Edit {variableName}"
            values={{
              variableName: variable?.name,
            }}
          />
        ) : (
          <FormattedMessage
            id="component.create-or-update-petition-variable-dialog.enum-variable-title"
            defaultMessage="Create options list variable"
          />
        )
      }
      body={
        <Stack gap={4} flex="1">
          <Stack gap={2}>
            <HStack alignItems="flex-start">
              <FormControl id="name" isInvalid={!!errors.name}>
                <FormLabel fontWeight="normal">
                  <FormattedMessage
                    id="component.create-or-update-petition-variable-dialog.variable-name"
                    defaultMessage="Variable name"
                  />
                </FormLabel>
                <Input
                  maxLength={30}
                  disabled={isUpdating}
                  {...nameRegisterProps}
                  placeholder={intl.formatMessage({
                    id: "component.create-or-update-petition-variable-dialog.variable-name-placeholder",
                    defaultMessage: "e.g: price, score",
                  })}
                />
              </FormControl>
            </HStack>
            {errors.name ? (
              <Text color="red.500">
                {errors.name?.type === "unavailable" ? (
                  <FormattedMessage
                    id="component.create-or-update-petition-variable-dialog.unique-identifier-alredy-exists"
                    defaultMessage="This identifier is already in use"
                  />
                ) : (
                  <FormattedMessage
                    id="component.create-or-update-petition-variable-dialog.variable-invalid-error"
                    defaultMessage="The name must begin with letters and can only contain letters, numbers and _"
                  />
                )}
              </Text>
            ) : null}

            <Text fontSize="sm">
              <FormattedMessage
                id="component.create-or-update-petition-variable-dialog.info-name-variable"
                defaultMessage="Once the variable is added, its name cannot be edited."
              />
            </Text>
          </Stack>
          <Text fontSize="sm">
            <FormattedMessage
              id="component.create-or-update-petition-variable-dialog.enum-variable-description-help"
              defaultMessage="Sort the options from lowest to highest priority. This order will allow you to use comparison operators in calculations."
            />
          </Text>
          <FormProvider {...form}>
            <Table variant="unstyled" insetInlineStart={-2.5} position="relative">
              <Thead>
                <Tr>
                  <Th
                    paddingEnd={1}
                    paddingBlock={2}
                    width="50%"
                    fontWeight="normal"
                    fontSize="md"
                    textTransform="none"
                    letterSpacing="normal"
                  >
                    <FormattedMessage
                      id="component.create-or-update-petition-variable-dialog.options-label"
                      defaultMessage="Label"
                    />
                  </Th>
                  <Th
                    paddingInline={1}
                    paddingBlock={2}
                    width="50%"
                    fontWeight="normal"
                    fontSize="md"
                    textTransform="none"
                    letterSpacing="normal"
                  >
                    <FormattedMessage
                      id="component.create-or-update-petition-variable-dialog.options-value-label"
                      defaultMessage="Internal value"
                    />
                    <HelpPopover position="relative" top="-1px">
                      <Text>
                        <FormattedMessage
                          id="component.create-or-update-petition-variable-dialog.options-value-label-help"
                          defaultMessage="This is the value stored internally. If you plan on integrating with the Parallel API, this is the value that you will obtain."
                        />
                      </Text>
                    </HelpPopover>
                  </Th>
                  <Th paddingInline={1} paddingBlock={2}></Th>
                  <Th paddingInline={1} paddingBlock={2}></Th>
                </Tr>
              </Thead>
              <MotionConfig reducedMotion="always">
                <Reorder.Group as={Tbody as any} axis="y" values={fields} onReorder={reorder}>
                  {fields.map((field, index) => {
                    return (
                      <EnumVariableOption
                        key={field.id}
                        index={index}
                        field={field}
                        fields={fields}
                        onRemove={() => {
                          const _valueLabels = getValues("valueLabels");
                          if (_valueLabels[index].isDefault) {
                            update(0, {
                              value: _valueLabels[0].value,
                              label: _valueLabels[0].label,
                              isDefault: true,
                            });
                          }
                          remove(index);
                        }}
                        onUpdate={update}
                        isUpdating={
                          isUpdating && variable?.enumLabels?.some((v) => v.value === field.value)
                        }
                      />
                    );
                  })}
                </Reorder.Group>
              </MotionConfig>
              <Tfoot>
                <Tr>
                  <Td colSpan={4} paddingTop={1} paddingInlineStart={6}>
                    <Button
                      variant="outline"
                      leftIcon={<PlusCircleIcon />}
                      onClick={() => {
                        append({ value: "", label: "", isDefault: false });
                        setTimeout(() => {
                          setFocus(`valueLabels.${fields.length}.label`);
                        }, 0);
                      }}
                    >
                      <FormattedMessage
                        id="component.create-or-update-petition-variable-dialog.add-label"
                        defaultMessage="Add label"
                      />
                    </Button>
                  </Td>
                </Tr>
              </Tfoot>
            </Table>
          </FormProvider>
          <FormControl as={HStack}>
            <Stack flex={1} gap={1}>
              <FormLabel margin={0}>
                <FormattedMessage
                  id="component.create-or-update-petition-variable-dialog.show-in-replies"
                  defaultMessage="Show in the review section"
                />
              </FormLabel>
              <FormHelperText margin={0}>
                <FormattedMessage
                  id="component.create-or-update-petition-variable-dialog.show-in-replies-description"
                  defaultMessage="If you enable this option, the variable will appear in the review section."
                />
              </FormHelperText>
            </Stack>
            <Center>
              <Switch {...register("showInReplies")} />
            </Center>
          </FormControl>
        </Stack>
      }
      alternative={
        isUpdating ? (
          <Button variant="outline" colorScheme="red" onClick={handleDelete}>
            <FormattedMessage id="generic.delete" defaultMessage="Delete" />
          </Button>
        ) : undefined
      }
      cancel={
        isUpdating ? undefined : (
          <Button onClick={() => onBack()}>
            <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
          </Button>
        )
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          {isUpdating ? (
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

function EnumVariableOption({
  index,
  field,
  fields,
  onRemove,
  onUpdate,
  isUpdating,
}: {
  index: number;
  field: {
    value: string;
    label: string;
  };
  fields: FieldArrayWithId<EnumVariableData, "valueLabels", "id">[];
  onRemove: (index: number) => void;
  onUpdate: UseFieldArrayUpdate<EnumVariableData, "valueLabels">;
  isUpdating: boolean;
}) {
  const intl = useIntl();
  const {
    formState: { errors },
    register,
    setFocus,
    getValues,
    control,
  } = useFormContext<EnumVariableData>();

  const controls = useDragControls();

  const onKeyDownHandler =
    (property: "label" | "value") => (event: KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case "ArrowDown":
          if (index < fields.length - 1) {
            event.preventDefault();
            setFocus(`valueLabels.${index + 1}.${property}`);
          }
          break;
        case "ArrowUp":
          if (index > 0) {
            event.preventDefault();
            setFocus(`valueLabels.${index - 1}.${property}`);
          }
          break;
        case "ArrowLeft": {
          const input = event.target as HTMLInputElement;
          if (
            input.selectionStart === input.selectionEnd &&
            input.selectionStart === 0 &&
            property === "value"
          ) {
            event.preventDefault();
            setFocus(`valueLabels.${index}.label`);
          }
          break;
        }
        case "ArrowRight": {
          const input = event.target as HTMLInputElement;
          if (
            input.selectionStart === input.selectionEnd &&
            input.selectionStart === input.value.length &&
            property === "label"
          ) {
            event.preventDefault();
            setFocus(`valueLabels.${index}.value`);
          }
          break;
        }
      }
    };

  return (
    <Reorder.Item
      as={Tr as any}
      value={field}
      dragListener={false}
      dragControls={controls}
      {...{
        _hover: {
          ".drag-handle": {
            opacity: 1,
          },
        },
        backgroundColor: "white",
        position: "relative",
      }}
    >
      <FormControl
        as={Td}
        verticalAlign="top"
        paddingEnd={1}
        paddingBlock={1}
        width="50%"
        isInvalid={!!errors.valueLabels?.[index]?.label}
      >
        <Box
          className="drag-handle"
          position="absolute"
          top="50%"
          insetStart={0}
          paddingInline={1}
          height="38px"
          transform="translateY(-50%)"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          cursor="grab"
          color="gray.400"
          opacity={0}
          _hover={{ color: "gray.700" }}
          aria-label={intl.formatMessage({
            id: "generic.drag-to-sort",
            defaultMessage: "Drag to sort",
          })}
          onPointerDown={(e) => controls.start(e)}
        >
          <DragHandleIcon role="presentation" pointerEvents="none" boxSize={3} />
        </Box>
        <Input
          {...register(`valueLabels.${index}.label`, { required: true })}
          placeholder={intl.formatMessage({
            id: "component.create-or-update-petition-variable-dialog.label-placeholder",
            defaultMessage: "e.g. Low, Medium, High",
          })}
        />
        <FormErrorMessage>
          <FormattedMessage
            id="generic.required-field-error"
            defaultMessage="The field is required"
          />
        </FormErrorMessage>
      </FormControl>
      <FormControl
        as={Td}
        verticalAlign="top"
        paddingInline={1}
        paddingBlock={1}
        width="50%"
        isInvalid={!!errors.valueLabels?.[index]?.value}
        isDisabled={isUpdating}
      >
        <Input
          {...register(`valueLabels.${index}.value`, {
            required: true,
            pattern: REFERENCE_REGEX,
            maxLength: 50,
            validate: {
              isAvailable: (value, { valueLabels }) => {
                return !valueLabels?.some(({ value: v }, i) => v === value && i < index);
              },
            },
          })}
          onKeyDown={onKeyDownHandler("value")}
          placeholder={intl.formatMessage({
            id: "component.create-or-update-petition-variable-dialog.internal-value-placeholder",
            defaultMessage: "e.g. low, medium, high",
          })}
        />
        <FormErrorMessage>
          {errors?.valueLabels?.[index]?.value?.type === "isAvailable" ? (
            <FormattedMessage
              id="component.create-or-update-property-dialog.unique-identifier-alredy-exists"
              defaultMessage="This identifier is already in use"
            />
          ) : (
            <FormattedMessage
              id="component.create-or-update-property-dialog.options-alias-error"
              defaultMessage="The field is required and only accepts up to {max} letters, numbers or _"
              values={{ max: 50 }}
            />
          )}
        </FormErrorMessage>
      </FormControl>

      <FormControl as={Td} verticalAlign="top" paddingInline={1} paddingBlock={1}>
        <Controller
          name={`valueLabels.${index}.isDefault`}
          control={control}
          render={({ field: { value, onChange } }) => (
            <IconButtonWithTooltip
              isDisabled={fields.length === 1}
              variant="outline"
              onClick={() => {
                const defaultOptionIndex = fields.findIndex((f) => f.isDefault);
                if (defaultOptionIndex !== -1) {
                  const _valueLabels = getValues("valueLabels");
                  onUpdate(defaultOptionIndex, {
                    value: _valueLabels[defaultOptionIndex].value,
                    label: _valueLabels[defaultOptionIndex].label,
                    isDefault: false,
                  });
                }
                onChange(true);
              }}
              icon={value ? <StarIcon color="primary.400" fill="primary.400" /> : <StarEmptyIcon />}
              label={intl.formatMessage({
                id: "generic.set-as-default-value",
                defaultMessage: "Set as default",
              })}
            />
          )}
        />
      </FormControl>

      <Td verticalAlign="top" paddingInline={1} paddingBlock={1}>
        <IconButtonWithTooltip
          isDisabled={fields.length === 1 || isUpdating}
          onClick={() => onRemove(index)}
          icon={<DeleteIcon />}
          variant="outline"
          label={intl.formatMessage({
            id: "component.create-or-update-property-dialog.remove-option-button",
            defaultMessage: "Remove option",
          })}
        />
      </Td>
    </Reorder.Item>
  );
}

interface VariableTypeRadioElement {
  key: PetitionVariableType;
  icon: ReactNode;
  background: string;
  title: string;
  description: string;
}

interface PetitionVariableTypeRadioProps {
  value?: PetitionVariableType;
  onChange: (value: PetitionVariableType) => void;
}

const PetitionVariableTypeRadio = forwardRef<HTMLInputElement, PetitionVariableTypeRadioProps>(
  function PetitionVariableTypeRadio({ value, onChange }, ref) {
    const intl = useIntl();
    const { getRootProps, getRadioProps } = useRadioGroup({
      name: "type",
      value,
      defaultValue: "NUMBER",
      onChange,
    });

    const variableTypes = useMemo(
      () =>
        [
          {
            key: "NUMBER",
            icon: <CalculatorIcon color="blue.800" boxSize={6} />,
            background: "blue.100",
            title: intl.formatMessage({
              id: "component.create-or-update-petition-variable-dialog.variable-type-number",
              defaultMessage: "Number",
            }),
            description: intl.formatMessage({
              id: "component.create-or-update-petition-variable-dialog.variable-type-number-description",

              defaultMessage:
                "A number variable that can be used to do calculations and comparisons.",
            }),
          },
          {
            key: "ENUM",
            icon: <ListIcon color="green.800" boxSize={6} />,
            background: "green.100",
            title: intl.formatMessage({
              id: "component.create-or-update-petition-variable-dialog.variable-type-enum",
              defaultMessage: "Options list",
            }),
            description: intl.formatMessage({
              id: "component.create-or-update-petition-variable-dialog.variable-type-enum-description",
              defaultMessage:
                "A variable that can be used to select a value from a list of options.",
            }),
          },
        ] as VariableTypeRadioElement[],
      [intl.locale],
    );

    return (
      <Stack {...getRootProps()}>
        {variableTypes.map(({ key, icon, background, title, description }) => (
          <PetitionVariableTypeRadioButton
            key={key}
            inputRef={key === value ? ref : undefined}
            {...getRadioProps({ value: key })}
          >
            <Center padding={2} borderRadius="md" backgroundColor={background}>
              {icon}
            </Center>
            <Stack gap={0}>
              <Text fontWeight="bold">{title}</Text>
              <Text fontSize="sm" whiteSpace="break-spaces" fontWeight="normal">
                {description}
              </Text>
            </Stack>
          </PetitionVariableTypeRadioButton>
        ))}
      </Stack>
    );
  },
);

interface PetitionVariableTypeRadioButtonProps extends RadioProps {
  inputRef?: Ref<HTMLInputElement>;
}

function PetitionVariableTypeRadioButton({
  inputRef,
  ...props
}: PetitionVariableTypeRadioButtonProps) {
  const { getInputProps, getRadioProps } = useRadio(props);

  return (
    <Button
      as="label"
      variant="unstyled"
      display="flex"
      maxHeight="auto"
      height="auto"
      cursor="pointer"
      gridArea={props.value}
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      fontWeight={500}
      _checked={{
        borderColor: "primary.500",
        backgroundColor: "primary.50",
      }}
      _hover={{
        backgroundColor: "primary.50",
      }}
      flex="1"
      padding={4}
      paddingY={3}
      {...getRadioProps()}
    >
      <input {...getInputProps()} ref={inputRef} />
      <HStack gap={4} paddingY={0.5}>
        {props.children}
      </HStack>
    </Button>
  );
}

export function useCreatePetitionVariableDialog() {
  return useWizardDialog(
    {
      SELECT_VARIABLE_TYPE: SelectVariableTypeDialog,
      NUMERIC_VARIABLE: CreateOrUpdateNumericVariableDialog,
      ENUM_VARIABLE: CreateOrUpdateEnumVariableDialog,
    },
    "SELECT_VARIABLE_TYPE",
  );
}

const _fragments = {
  PetitionVariable: gql`
    fragment useCreatePetitionVariableDialog_PetitionVariable on PetitionVariable {
      name
      showInReplies
      ... on PetitionVariableNumber {
        defaultValue
        valueLabels {
          value
          label
        }
      }
      ... on PetitionVariableEnum {
        defaultEnum: defaultValue
        enumLabels: valueLabels {
          value
          label
        }
      }
    }
  `,
};

export function useUpdateEnumPetitionVariableDialog() {
  return useWizardDialog({ ENUM_VARIABLE: CreateOrUpdateEnumVariableDialog }, "ENUM_VARIABLE");
}

export function useUpdateNumericPetitionVariableDialog() {
  return useWizardDialog(
    { NUMERIC_VARIABLE: CreateOrUpdateNumericVariableDialog },
    "NUMERIC_VARIABLE",
  );
}

const _queries = [
  gql`
    mutation useCreatePetitionVariableDialog_createPetitionVariable(
      $petitionId: GID!
      $data: CreatePetitionVariableInput!
    ) {
      createPetitionVariable(petitionId: $petitionId, data: $data) {
        id
        variables {
          ...useCreatePetitionVariableDialog_PetitionVariable
        }
      }
    }
  `,
  gql`
    mutation useCreatePetitionVariableDialog_updatePetitionVariable(
      $petitionId: GID!
      $data: UpdatePetitionVariableInput!
      $name: String!
    ) {
      updatePetitionVariable(petitionId: $petitionId, data: $data, name: $name) {
        id
        variables {
          ...useCreatePetitionVariableDialog_PetitionVariable
        }
      }
    }
  `,
];
