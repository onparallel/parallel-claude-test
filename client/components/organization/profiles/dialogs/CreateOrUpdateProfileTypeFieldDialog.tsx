import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Stack,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { DeleteIcon, DragHandleIcon, PlusCircleIcon } from "@parallel/chakra/icons";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { LocalizableUserTextInput } from "@parallel/components/common/LocalizableUserTextInput";
import {
  isValidLocalizableUserText,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { TagColorSelect } from "@parallel/components/common/TagColorSelect";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  CreateProfileTypeFieldInput,
  useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment,
  useCreateOrUpdateProfileTypeFieldDialog_createProfileTypeFieldDocument,
  useCreateOrUpdateProfileTypeFieldDialog_updateProfileTypeFieldDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { useFieldArrayReorder } from "@parallel/utils/react-form-hook/useFieldArrayReorder";
import { useSetFocusRef } from "@parallel/utils/react-form-hook/useSetFocusRef";
import { UnwrapArray } from "@parallel/utils/types";
import { useConstant } from "@parallel/utils/useConstant";
import {
  ExpirationOption,
  durationToExpiration,
  expirationToDuration,
  useExpirationOptions,
} from "@parallel/utils/useExpirationOptions";
import { REFERENCE_REGEX } from "@parallel/utils/validation";
import ASCIIFolder from "fold-to-ascii";
import { Reorder, useDragControls } from "framer-motion";
import { nanoid } from "nanoid";
import { KeyboardEvent, useCallback } from "react";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { isDefined, omit, pick, times, zip } from "remeda";
import { ProfileTypeFieldTypeSelect } from "../ProfileTypeFieldTypeSelect";
import { useConfirmRemovedSelectOptionsReplacementDialog } from "./ConfirmRemovedSelectOptionsReplacementDialog";
import { useImportSelectOptionsDialog } from "@parallel/components/common/dialogs/ImportSelectOptionsDialog";
import { sanitizeFilenameWithSuffix } from "@parallel/utils/sanitizeFilenameWithSuffix";
import { generateExcel } from "@parallel/utils/generateExcel";
import { parseProfileSelectOptionsFromExcel } from "@parallel/utils/parseProfileSelectOptionsFromExcel";

interface CreateOrUpdateProfileTypeFieldDialogProps {
  profileTypeId: string;
  profileTypeField?: useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment;
}

type SelectOptionValue = UnwrapArray<ProfileTypeFieldOptions["SELECT"]["values"]>;

interface SelectOptionValueData extends SelectOptionValue {
  id: string;
  existing?: boolean;
}

interface CreateOrUpdateProfileTypeFieldDialogData
  extends Omit<CreateProfileTypeFieldInput, "expiryAlertAheadTime" | "options"> {
  expiryAlertAheadTime: ExpirationOption;
  options: {
    useReplyAsExpiryDate?: boolean;
    showOptionsWithColors?: boolean;
    values?: SelectOptionValueData[];
  };
}

const DEFAULT_TAG_COLOR = "#E2E8F0";

function CreateOrUpdateProfileTypeFieldDialog({
  profileTypeId,
  profileTypeField,
  ...props
}: DialogProps<CreateOrUpdateProfileTypeFieldDialogProps>) {
  const intl = useIntl();

  const isUpdating = isDefined(profileTypeField);

  const initialOptionValues = useConstant(() => {
    if (profileTypeField?.type === "SELECT") {
      return (profileTypeField.options as ProfileTypeFieldOptions["SELECT"]).values.map(
        (option) => ({
          ...option,
          id: nanoid(),
          existing: true,
        }),
      );
    }
  });

  const form = useForm<CreateOrUpdateProfileTypeFieldDialogData>({
    mode: "onSubmit",
    defaultValues: {
      name: profileTypeField?.name ?? { [intl.locale]: "" },
      type: profileTypeField?.type ?? "SHORT_TEXT",
      alias: profileTypeField?.alias ?? "",
      isExpirable: profileTypeField?.isExpirable ?? false,
      options: {
        ...(profileTypeField?.options ?? {}),
        ...(profileTypeField?.type === "SELECT" ? { values: initialOptionValues } : {}),
      },
      expiryAlertAheadTime:
        isDefined(profileTypeField) &&
        profileTypeField.isExpirable &&
        profileTypeField.expiryAlertAheadTime === null
          ? "DO_NOT_REMEMBER"
          : durationToExpiration(profileTypeField?.expiryAlertAheadTime ?? { months: 1 }),
    },
  });
  const {
    control,
    formState: { errors },
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    setFocus,
  } = form;

  const isExpirable = watch("isExpirable");
  const selectedType = watch("type");

  const showConfirmRemovedSelectOptionsReplacementDialog =
    useConfirmRemovedSelectOptionsReplacementDialog();

  const expirationOptions = useExpirationOptions();

  const [createProfileTypeField] = useMutation(
    useCreateOrUpdateProfileTypeFieldDialog_createProfileTypeFieldDocument,
  );

  function useUpdateProfileTypeFieldWithForce() {
    const intl = useIntl();
    const [updateProfileTypeField] = useMutation(
      useCreateOrUpdateProfileTypeFieldDialog_updateProfileTypeFieldDocument,
    );
    const showRemoveProfileTypeFieldIsExpirableErrorDialog = useConfirmDeleteDialog();

    return async (options: Parameters<typeof updateProfileTypeField>[0]) => {
      try {
        await updateProfileTypeField(options);
      } catch (e) {
        if (isApolloError(e, "REMOVE_PROFILE_TYPE_FIELD_IS_EXPIRABLE_ERROR")) {
          await showRemoveProfileTypeFieldIsExpirableErrorDialog({
            header: intl.formatMessage({
              id: "component.create-or-update-profile-type-field-dialog.remove-profile-type-field-is-expirable-error-dialog-header",
              defaultMessage: "Remove expiration dates",
            }),
            description: (
              <FormattedMessage
                id="component.create-or-update-profile-type-field-dialog.remove-profile-type-field-is-expirable-error-dialog-description"
                defaultMessage="There are some properties with expiration dates set. If you remove the expiration from this field, these dates will be removed. Would you like to continue?"
              />
            ),
            confirmation: intl
              .formatMessage({
                id: "generic.confirm",
                defaultMessage: "Confirm",
              })
              .toLocaleLowerCase(),
            cancel: (
              <Button onClick={() => props.onReject("CANCEL")}>
                <FormattedMessage id="generic.no-go-back" defaultMessage="No, go back" />
              </Button>
            ),
            confirm: (
              <Button colorScheme="red" type="submit">
                <FormattedMessage id="generic.yes-continue" defaultMessage="Yes, continue" />
              </Button>
            ),
          });
          await updateProfileTypeField({
            ...options,
            variables: {
              ...options!.variables!,
              force: true,
            },
          });
        } else {
          throw e;
        }
      }
    };
  }

  const updateProfileTypeField = useUpdateProfileTypeFieldWithForce();

  return (
    <ConfirmDialog
      {...props}
      initialFocusRef={useSetFocusRef(setFocus, "name")}
      closeOnEsc
      closeOnOverlayClick={false}
      size={selectedType === "SELECT" ? "3xl" : "lg"}
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          try {
            const expiryAlertAheadTime =
              data.isExpirable && data.expiryAlertAheadTime !== "DO_NOT_REMEMBER"
                ? expirationToDuration(data.expiryAlertAheadTime)
                : null;

            if (isUpdating) {
              if (data.type === "SELECT") {
                const options = {
                  ...pick(data.options, ["showOptionsWithColors"]),
                  values: data.options.values!.map(omit(["id", "existing"])),
                };
                try {
                  await updateProfileTypeField({
                    variables: {
                      profileTypeId,
                      profileTypeFieldId: profileTypeField.id,
                      data: {
                        ...omit(data, ["expiryAlertAheadTime", "type", "alias"]),
                        alias: data.alias || null,
                        options,
                        expiryAlertAheadTime,
                      },
                    },
                  });
                } catch (error) {
                  if (isApolloError(error, "REMOVE_PROFILE_TYPE_FIELD_SELECT_OPTIONS_ERROR")) {
                    const removedOptions = error.graphQLErrors[0].extensions
                      ?.options as (SelectOptionValue & { count: number })[];

                    const optionValuesToUpdate =
                      await showConfirmRemovedSelectOptionsReplacementDialog({
                        currentOptions: data.options.values!,
                        removedOptions: removedOptions,
                        showOptionsWithColors: data.options.showOptionsWithColors ?? false,
                      });

                    await updateProfileTypeField({
                      variables: {
                        profileTypeId,
                        profileTypeFieldId: profileTypeField.id,
                        data: {
                          ...omit(data, ["expiryAlertAheadTime", "type", "alias"]),
                          alias: data.alias || null,
                          options,
                          expiryAlertAheadTime,
                          substitutions: optionValuesToUpdate,
                        },
                      },
                    });
                  } else {
                    throw error;
                  }
                }
              } else {
                await updateProfileTypeField({
                  variables: {
                    profileTypeId,
                    profileTypeFieldId: profileTypeField.id,
                    data: {
                      ...omit(data, ["expiryAlertAheadTime", "type", "alias"]),
                      alias: data.alias || null,
                      options:
                        data.type === "DATE" ? pick(data.options, ["useReplyAsExpiryDate"]) : {},
                      expiryAlertAheadTime,
                    },
                  },
                });
              }
            } else {
              const options =
                data.type === "SELECT"
                  ? {
                      ...pick(data.options, ["showOptionsWithColors"]),
                      values: data.options.values!.map(omit(["id", "existing"])),
                    }
                  : data.type === "DATE"
                    ? pick(data.options, ["useReplyAsExpiryDate"])
                    : {};
              await createProfileTypeField({
                variables: {
                  profileTypeId,
                  data: {
                    ...omit(data, ["expiryAlertAheadTime", "alias"]),
                    alias: data.alias || null,
                    options,
                    expiryAlertAheadTime,
                  },
                },
              });
            }

            props.onResolve();
          } catch (e) {
            if (isApolloError(e, "ALIAS_ALREADY_EXISTS")) {
              setError("alias", { type: "unavailable" });
            }
          }
        }),
      }}
      header={
        isUpdating ? (
          <FormattedMessage
            id="component.create-or-update-property-dialog.edit-profile-type-field"
            defaultMessage="Edit property"
          />
        ) : (
          <FormattedMessage
            id="component.create-or-update-property-dialog.new-property"
            defaultMessage="New property"
          />
        )
      }
      body={
        <Stack spacing={4}>
          <FormControl isInvalid={!!errors.name}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-or-update-property-dialog.property-name"
                defaultMessage="Property name"
              />
            </FormLabel>
            <Controller
              name="name"
              control={control}
              rules={{
                required: true,
                validate: { isValidLocalizableUserText },
              }}
              render={({ field: { ref, ...field } }) => (
                <LocalizableUserTextInput
                  inputProps={{ "data-1p-ignore": "" } as any}
                  {...field}
                  inputRef={ref}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.type} isDisabled={isUpdating}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-or-update-property-dialog.type-of-property"
                defaultMessage="Type of property"
              />
            </FormLabel>
            <Controller
              name="type"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, ...field } }) => (
                <ProfileTypeFieldTypeSelect
                  {...field}
                  onChange={(value) => {
                    onChange(value!);
                    setValue(
                      "options",
                      value === "DATE"
                        ? { useReplyAsExpiryDate: true }
                        : value === "SELECT"
                          ? { values: [{ id: nanoid(), label: { [intl.locale]: "" }, value: "" }] }
                          : {},
                    );
                    setTimeout(() => setFocus("options.values.0.label"));
                  }}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.alias}>
            <FormLabel display="flex" alignItems="center" fontWeight={400}>
              <FormattedMessage
                id="component.create-or-update-property-dialog.unique-identifier"
                defaultMessage="Unique identifier"
              />
              <HelpPopover>
                <Text>
                  <FormattedMessage
                    id="component.create-or-update-property-dialog.unique-identifier-help"
                    defaultMessage="Allows to easily identify the property in API replies."
                  />
                </Text>
              </HelpPopover>
            </FormLabel>
            <Input
              {...register("alias", {
                validate: (value) => {
                  return value ? REFERENCE_REGEX.test(value) : true;
                },
              })}
              maxLength={50}
            />
            <FormErrorMessage>
              {errors.alias?.type === "unavailable" ? (
                <FormattedMessage
                  id="component.create-or-update-property-dialog.unique-identifier-alredy-exists"
                  defaultMessage="This identifier is already in use"
                />
              ) : (
                <FormattedMessage
                  id="component.create-or-update-property-dialog.only-letters-numbers-alias-error"
                  defaultMessage="Use only letters, numbers or _"
                />
              )}
            </FormErrorMessage>
          </FormControl>

          <FormProvider {...form}>
            {selectedType === "SELECT" ? <ProfileFieldSelectSettings /> : null}
          </FormProvider>
          <Stack spacing={2}>
            <FormControl as={HStack} isInvalid={!!errors.isExpirable}>
              <Stack flex={1} spacing={1}>
                <FormLabel margin={0}>
                  <FormattedMessage
                    id="component.create-or-update-property-dialog.expiration"
                    defaultMessage="Expiration"
                  />
                </FormLabel>
                <FormHelperText margin={0}>
                  <FormattedMessage
                    id="component.create-or-update-property-dialog.expiration-description"
                    defaultMessage="Select if this property will have an expiration date. Example: Passports and contracts."
                  />
                </FormHelperText>
              </Stack>
              <Center>
                <Switch {...register("isExpirable")} />
              </Center>
            </FormControl>
            {isExpirable ? (
              <>
                {selectedType === "DATE" ? (
                  <FormControl>
                    <Checkbox {...register("options.useReplyAsExpiryDate")}>
                      <FormattedMessage
                        id="component.create-or-update-property-dialog.use-reply-as-expiry-date"
                        defaultMessage="Use reply as expiry date"
                      />
                    </Checkbox>
                  </FormControl>
                ) : null}
                <FormControl as={HStack} isInvalid={!!errors.expiryAlertAheadTime}>
                  <FormLabel fontSize="sm" whiteSpace="nowrap" fontWeight="normal" margin={0}>
                    <FormattedMessage
                      id="component.create-or-update-property-dialog.expiry-alert-ahead-time-label"
                      defaultMessage="Remind on:"
                    />
                  </FormLabel>
                  <Box width="100%">
                    <Controller
                      name="expiryAlertAheadTime"
                      control={control}
                      rules={{
                        required: isExpirable ? true : false,
                      }}
                      render={({ field }) => (
                        <SimpleSelect size="sm" options={expirationOptions} {...field} />
                      )}
                    />
                  </Box>
                </FormControl>
              </>
            ) : null}
          </Stack>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

function ProfileFieldSelectSettings() {
  const intl = useIntl();

  const { control, register, watch, setFocus, getValues } =
    useFormContext<CreateOrUpdateProfileTypeFieldDialogData>();

  const { fields, append, remove, reorder, replace } = useFieldArrayReorder({
    name: "options.values",
    keyName: "key",
    control,
    rules: { required: true, minLength: 1, maxLength: 1000 },
    shouldUnregister: true,
  });

  const handleRemoveOption = useCallback((index: number) => {
    remove(index);
  }, []);

  const showOptionsWithColors = watch("options.showOptionsWithColors");
  const name = watch("name");

  const showImportSelectOptionsDialog = useImportSelectOptionsDialog();
  const handleImportOptions = async () => {
    try {
      const values = getValues("options.values");
      await showImportSelectOptionsDialog({
        hasOptions: values ? values.length > 0 : false,
        onDownloadEmptyOptions: async () => {
          await generateValueLabelExcel(intl, {
            fileName: sanitizeFilenameWithSuffix(
              intl.formatMessage({
                id: "component.import-options-settings-row.default-file-name",
                defaultMessage: "options",
              }),
              ".xlsx",
            ),
            values: [],
            labels: [],
          });
        },
        onDownloadExistingOptions: async () => {
          const values = getValues("options.values");
          await generateValueLabelExcel(intl, {
            fileName: sanitizeFilenameWithSuffix(
              localizableUserTextRender({
                value: name,
                intl,
                default: intl.formatMessage({
                  id: "component.import-options-settings-row.default-file-name",
                  defaultMessage: "options",
                }),
              }),
              ".xlsx",
            ),
            values: values?.map((field) => field.value) ?? [],
            labels: values?.map((field) => field.label) ?? [],
          });
        },
        onExcelDrop: async (file) => {
          const options = await parseProfileSelectOptionsFromExcel(file);
          if (options.length > 0) {
            replace(
              options.map(({ label, value }) => ({
                id: nanoid(),
                label,
                value,
                color: showOptionsWithColors ? DEFAULT_TAG_COLOR : undefined,
              })),
            );
          } else {
            // show empty inputs when uploaded file is empty
            replace([{ id: nanoid(), label: { [intl.locale]: "" }, value: "" }]);
          }
        },
      });
    } catch {}
  };

  return (
    <Stack spacing={4}>
      <FormControl as={HStack} spacing={0}>
        <Checkbox {...register("options.showOptionsWithColors")}>
          <FormattedMessage
            id="component.create-or-update-property-dialog.enable-colored-options"
            defaultMessage="Enable colored options"
          />
        </Checkbox>
        <HelpPopover>
          <FormattedMessage
            id="component.create-or-update-property-dialog.enable-colored-options-help"
            defaultMessage="This setting allows you to assign colors to each option, enhancing visual distinction and aiding in quick identification."
          />
        </HelpPopover>
      </FormControl>
      <Table variant="unstyled">
        <Thead>
          <Tr>
            <Th paddingInlineEnd={1} paddingBlock={2} width="50%">
              <FormattedMessage
                id="component.create-or-update-property-dialog.options-label"
                defaultMessage="Label"
              />
            </Th>
            <Th paddingInline={1} paddingBlock={2} width="50%">
              <FormattedMessage
                id="component.create-or-update-property-dialog.options-value-label"
                defaultMessage="Internal value"
              />
              <HelpPopover position="relative" top="-1px">
                <Text>
                  <FormattedMessage
                    id="component.create-or-update-property-dialog.options-value-label-help"
                    defaultMessage="This is the value stored internally. If you plan on integrating with the Parallel API, this is the value that you will obtain."
                  />
                </Text>
              </HelpPopover>
            </Th>
            {showOptionsWithColors ? (
              <Th paddingInline={1} paddingBlock={2} minWidth="158px">
                <FormattedMessage
                  id="component.manage-tags-dialog.color-label"
                  defaultMessage="Color"
                />
              </Th>
            ) : null}
            <Th paddingInline={1} paddingBlock={2}></Th>
          </Tr>
        </Thead>
        <Reorder.Group as={Tbody as any} axis="y" values={fields} onReorder={reorder}>
          {fields.map((field, index) => {
            return (
              <ProfileFieldSelectOption
                key={field.id}
                index={index}
                field={field}
                fields={fields}
                onRemove={handleRemoveOption}
                canRemoveOption={fields.length > 1}
                showOptionsWithColors={showOptionsWithColors ?? false}
              />
            );
          })}
        </Reorder.Group>
      </Table>
      <HStack>
        <Button
          leftIcon={<PlusCircleIcon />}
          variant="outline"
          isDisabled={fields.length >= 1000}
          onClick={() => {
            append({
              id: nanoid(),
              label: { [intl.locale]: "" },
              value: "",
              color: showOptionsWithColors ? DEFAULT_TAG_COLOR : undefined,
            });
            setTimeout(() => setFocus(`options.values.${fields.length}.label`));
          }}
        >
          <FormattedMessage
            id="component.create-or-update-property-dialog.add-option-button"
            defaultMessage="Add option"
          />
        </Button>
        <Button variant="outline" onClick={handleImportOptions}>
          <FormattedMessage
            id="component.create-or-update-property-dialog.import-options-button"
            defaultMessage="Import options..."
          />
        </Button>
      </HStack>
    </Stack>
  );
}

function ProfileFieldSelectOption({
  index,
  field,
  fields,
  onRemove,
  canRemoveOption,
  showOptionsWithColors,
}: {
  index: number;
  field: SelectOptionValueData;
  fields: SelectOptionValueData[];
  onRemove: (index: number) => void;
  canRemoveOption: boolean;
  showOptionsWithColors: boolean;
}) {
  const intl = useIntl();
  const isUpdating = field.existing ?? false;

  const {
    control,
    formState: { errors, touchedFields },
    register,
    setValue,
    setFocus,
  } = useFormContext<CreateOrUpdateProfileTypeFieldDialogData>();

  const controls = useDragControls();

  const onKeyDownHandler =
    (property: "label" | "value") => (event: KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case "ArrowDown":
          if (index < fields.length - 1) {
            event.preventDefault();
            setFocus(`options.values.${index + 1}.${property}`);
          }
          break;
        case "ArrowUp":
          if (index > 0) {
            event.preventDefault();
            setFocus(`options.values.${index - 1}.${property}`);
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
            setFocus(`options.values.${index}.label`);
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
            setFocus(`options.values.${index}.value`);
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
        paddingInlineEnd={1}
        paddingBlock={2}
        width="50%"
        isInvalid={!!errors.options?.values?.[index]?.label}
      >
        <Box
          className="drag-handle"
          position="absolute"
          top="50%"
          left={0}
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
        <Controller
          name={`options.values.${index}.label` as const}
          control={control}
          rules={{
            required: true,
            validate: {
              isValidLocalizableUserText,
            },
          }}
          render={({ field: { ref, onChange, ...field } }) => (
            <LocalizableUserTextInput
              {...field}
              inputRef={ref}
              inputProps={{
                onKeyDown: onKeyDownHandler("label"),
              }}
              onChange={(value) => {
                onChange(value);
                if (!isUpdating && !touchedFields.options?.values?.[index]?.value) {
                  const alias = localizableUserTextRender({
                    value,
                    intl,
                    default: "",
                  });
                  setValue(
                    `options.values.${index}.value`,
                    ASCIIFolder.foldReplacing(alias.trim().toLowerCase()) // replace all non ASCII chars with their ASCII equivalent
                      .replace(/\s/g, "_") // replace spaces with _
                      .slice(0, 50), // max 50 chars
                  );
                }
              }}
            />
          )}
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
        paddingBlock={2}
        width="50%"
        isInvalid={!!errors.options?.values?.[index]?.value}
        isDisabled={isUpdating}
      >
        <Input
          {...register(`options.values.${index}.value` as const, {
            required: true,
            pattern: REFERENCE_REGEX,
            maxLength: 50,
            validate: {
              isAvailable: (value, { options }) => {
                return !options.values?.some(({ value: v }, i) => v === value && i < index);
              },
            },
          })}
          onKeyDown={onKeyDownHandler("value")}
          maxLength={50}
        />
        <FormErrorMessage>
          {errors?.options?.values?.[index]?.value?.type === "isAvailable" ? (
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
      {showOptionsWithColors ? (
        <FormControl
          as={Td}
          verticalAlign="top"
          paddingInline={1}
          paddingBlock={2}
          minWidth="158px"
        >
          <Controller
            name={`options.values.${index}.color` as const}
            control={control}
            rules={{ required: showOptionsWithColors }}
            defaultValue={DEFAULT_TAG_COLOR}
            render={({ field }) => <TagColorSelect {...field} value={field.value ?? null} />}
          />
        </FormControl>
      ) : null}
      <Td verticalAlign="top" paddingInline={1} paddingBlock={2}>
        <IconButtonWithTooltip
          isDisabled={!canRemoveOption}
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

export function useCreateOrUpdateProfileTypeFieldDialog() {
  return useDialog(CreateOrUpdateProfileTypeFieldDialog);
}

useCreateOrUpdateProfileTypeFieldDialog.fragments = {
  ProfileTypeField: gql`
    fragment useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeField on ProfileTypeField {
      id
      name
      type
      alias
      options
      isExpirable
      expiryAlertAheadTime
      options
    }
  `,
};

const _mutations = [
  gql`
    mutation useCreateOrUpdateProfileTypeFieldDialog_createProfileTypeField(
      $profileTypeId: GID!
      $data: CreateProfileTypeFieldInput!
    ) {
      createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
        ...useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeField
      }
    }
    ${useCreateOrUpdateProfileTypeFieldDialog.fragments.ProfileTypeField}
  `,
  gql`
    mutation useCreateOrUpdateProfileTypeFieldDialog_updateProfileTypeField(
      $profileTypeId: GID!
      $profileTypeFieldId: GID!
      $data: UpdateProfileTypeFieldInput!
      $force: Boolean
    ) {
      updateProfileTypeField(
        profileTypeId: $profileTypeId
        profileTypeFieldId: $profileTypeFieldId
        data: $data
        force: $force
      ) {
        ...useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeField
      }
    }
    ${useCreateOrUpdateProfileTypeFieldDialog.fragments.ProfileTypeField}
  `,
];

async function generateValueLabelExcel(
  intl: IntlShape,
  {
    fileName,
    values,
    labels,
  }: {
    fileName: string;
    values: SelectOptionValue["value"][];
    labels: SelectOptionValue["label"][];
  },
) {
  return await generateExcel({
    fileName,
    columns: [
      {
        key: "value",
        cell: {
          value: intl.formatMessage({
            id: "util.generate-value-label-excel.header-value",
            defaultMessage: "Internal value",
          }),
          fontWeight: "bold",
        },
      },
      {
        key: "label_en",
        cell: {
          value: intl.formatMessage({
            id: "util.generate-value-label-excel.header-label-english",
            defaultMessage: "Label (English)",
          }),
          fontWeight: "bold",
        },
      },
      {
        key: "label_es",
        cell: {
          value: intl.formatMessage({
            id: "util.generate-value-label-excel.header-label-spanish",
            defaultMessage: "Label (Spanish)",
          }),
          fontWeight: "bold",
        },
      },
    ],
    rows: zip(values, labels ?? times(values.length, () => null)).map(([value, label]) => ({
      value,
      label_es: label?.es ?? null,
      label_en: label?.en ?? null,
    })),
  });
}
