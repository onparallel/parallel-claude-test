import { gql } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  List,
  ListItem,
  Radio,
  RadioGroup,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import {
  DeleteIcon,
  DragHandleIcon,
  EyeIcon,
  EyeOffIcon,
  PlusCircleIcon,
} from "@parallel/chakra/icons";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { LocalizableUserTextInput } from "@parallel/components/common/LocalizableUserTextInput";
import {
  isValidLocalizableUserText,
  LocalizableUserTextRender,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { StandardListSelect } from "@parallel/components/common/StandardListSelect";
import { TagColorSelect } from "@parallel/components/common/TagColorSelect";
import { useImportSelectOptionsDialog } from "@parallel/components/common/dialogs/ImportSelectOptionsDialog";
import { Button, Text } from "@parallel/components/ui";
import {
  ProfileFieldSelectSettings_ProfileTypeFieldFragment,
  ProfileFieldSelectSettings_ProfileTypeFragment,
  ProfileTypeFieldType,
} from "@parallel/graphql/__types";
import { generateExcel } from "@parallel/utils/generateExcel";
import { getFieldsReferencedInAutoSearchConfig } from "@parallel/utils/getFieldsReferencedInAutoSearchConfig";
import { getFieldsReferencedInMonitoring } from "@parallel/utils/getFieldsReferencedInMonitoring";
import { parseProfileSelectOptionsFromExcel } from "@parallel/utils/parseProfileSelectOptionsFromExcel";
import { useFieldArrayReorder } from "@parallel/utils/react-form-hook/useFieldArrayReorder";
import { sanitizeFilenameWithSuffix } from "@parallel/utils/sanitizeFilenameWithSuffix";
import { UnwrapArray } from "@parallel/utils/types";
import { REFERENCE_REGEX } from "@parallel/utils/validation";
import ASCIIFolder from "fold-to-ascii";
import { MotionConfig, Reorder, useDragControls } from "framer-motion";
import { nanoid } from "nanoid";
import { KeyboardEvent, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { isNonNullish, times, zip } from "remeda";
import { CreateOrUpdateProfileTypeFieldDialogFormData } from "../dialogs/CreateOrUpdateProfileTypeFieldDialog";

const DEFAULT_TAG_COLOR = "#E2E8F0";

export type SelectOptionValue = UnwrapArray<
  CreateOrUpdateProfileTypeFieldDialogFormData["options"]["values"]
>;

interface ProfileFieldSelectSettingsProps {
  profileType: ProfileFieldSelectSettings_ProfileTypeFragment;
  profileTypeField?: ProfileFieldSelectSettings_ProfileTypeFieldFragment;
  profileFieldType: ProfileTypeFieldType;
}

export function ProfileFieldSelectSettings({
  profileType,
  profileTypeField,
  profileFieldType,
}: ProfileFieldSelectSettingsProps) {
  const intl = useIntl();
  const isUpdating = isNonNullish(profileTypeField) && "id" in profileTypeField;
  const isStandard = isUpdating ? profileTypeField.isStandard : false;

  const referencedByFields =
    isUpdating && profileTypeField.type === "SELECT"
      ? getFieldsReferencedInMonitoring({
          profileTypeFields: profileType.fields,
          profileTypeFieldId: profileTypeField.id,
        })
      : [];

  const referencedInAutoSearchConfig =
    isUpdating && profileTypeField.type === "SELECT"
      ? getFieldsReferencedInAutoSearchConfig({
          profileTypeFields: profileType.fields,
          profileTypeFieldId: profileTypeField.id,
        })
      : [];

  const isReferenced = referencedByFields.length > 0 || referencedInAutoSearchConfig.length > 0;

  const {
    control,
    register,
    watch,
    setFocus,
    getValues,
    formState: { errors },
  } = useFormContext<CreateOrUpdateProfileTypeFieldDialogFormData>();

  const { fields, append, remove, reorder, replace } = useFieldArrayReorder({
    name: "options.values",
    keyName: "key",
    control,
    rules: {
      required: true,
      minLength: 1,
      maxLength: 1000,
      validate: {
        atLeastOneVisible: (values) => {
          return values?.some((v) => !v.isHidden) ?? false;
        },
      },
    },
    shouldUnregister: true,
  });

  const handleRemoveOption = useCallback((index: number) => {
    remove(index);
  }, []);

  const showOptionsWithColors = watch("options.showOptionsWithColors");
  const listingType = watch("options.listingType");
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
                ...(profileTypeField?.type === "CHECKBOX"
                  ? {}
                  : { color: showOptionsWithColors ? DEFAULT_TAG_COLOR : undefined }),
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
      <FormControl>
        <FormLabel fontWeight={400}>
          <FormattedMessage
            id="component.create-or-update-property-dialog.type-of-options"
            defaultMessage="Options:"
          />
        </FormLabel>
        {referencedByFields.length ? (
          <Alert status="warning" rounded="md" marginBottom={2}>
            <AlertIcon />
            <AlertDescription>
              <Stack spacing={2}>
                <FormattedMessage
                  id="component.property-referenced-alert.referenced-by-monitored-fields-1"
                  defaultMessage="This options of this property cannot be changed as it is currently referenced by the monitoring configuration of the following {count, plural, =1{property} other {properties}}:"
                  values={{ count: fields.length }}
                />

                <List paddingInlineStart={5} listStyleType="disc">
                  {referencedByFields.map((field) => (
                    <ListItem key={field.id} fontWeight="bold">
                      <LocalizableUserTextRender value={field.name} default={null} />
                    </ListItem>
                  ))}
                </List>
                <FormattedMessage
                  id="component.property-referenced-alert.referenced-by-monitored-fields-2"
                  defaultMessage="To make changes, you must first remove it from the monitoring configuration."
                />
              </Stack>
            </AlertDescription>
          </Alert>
        ) : null}
        {referencedInAutoSearchConfig.length ? (
          <Alert status="warning" rounded="md" marginBottom={2}>
            <AlertIcon />
            <AlertDescription>
              <Stack spacing={2}>
                <FormattedMessage
                  id="component.property-referenced-alert.referenced-by-auto-search-config-1"
                  defaultMessage="This options of this property cannot be changed as it is currently referenced by the auto search configuration of the following {count, plural, =1{property} other {properties}}:"
                  values={{ count: fields.length }}
                />

                <List paddingInlineStart={5} listStyleType="disc">
                  {referencedInAutoSearchConfig.map((field) => (
                    <ListItem key={field.id} fontWeight="bold">
                      <LocalizableUserTextRender value={field.name} default={null} />
                    </ListItem>
                  ))}
                </List>
                <FormattedMessage
                  id="component.property-referenced-alert.referenced-by-auto-search-config-2"
                  defaultMessage="To make changes, you must first remove it from the auto search configuration."
                />
              </Stack>
            </AlertDescription>
          </Alert>
        ) : null}
        <Controller
          name="options.listingType"
          defaultValue="CUSTOM"
          control={control}
          render={({ field: { onChange, value } }) => (
            <RadioGroup
              onChange={(value) => onChange(value)}
              value={value}
              as={HStack}
              spacing={2}
              isDisabled={isReferenced || isStandard}
            >
              <Radio value="CUSTOM">
                <FormattedMessage
                  id="component.create-or-update-property-dialog.custom-list"
                  defaultMessage="Custom list"
                />
              </Radio>
              <Radio value="STANDARD">
                <FormattedMessage
                  id="component.create-or-update-property-dialog.standard-list"
                  defaultMessage="Standard list"
                />
              </Radio>
            </RadioGroup>
          )}
        />
      </FormControl>
      {listingType === "STANDARD" ? (
        <FormControl
          isInvalid={!!errors.options?.standardList}
          isDisabled={isReferenced || isStandard}
        >
          <Controller
            name="options.standardList"
            rules={{
              required: true,
            }}
            control={control}
            render={({ field: { onChange, value } }) => (
              <Box>
                <StandardListSelect onChange={(value) => onChange(value)} value={value ?? null} />
              </Box>
            )}
          />
        </FormControl>
      ) : (
        <>
          {profileFieldType === "CHECKBOX" ? null : (
            <FormControl as={HStack} spacing={0} isDisabled={isReferenced || isStandard}>
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
          )}

          <Box maxHeight="360px" overflowY="auto">
            <Table variant="unstyled">
              <Thead>
                <Tr>
                  <Th paddingEnd={1} paddingBlock={2} width="50%">
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
                  <Th paddingInline={1} paddingBlock={2} display="flex" justifyContent="center">
                    <HelpPopover position="relative" margin="0" top="3px" popoverWidth="280px">
                      <Stack spacing={2}>
                        <Text>
                          <FormattedMessage
                            id="component.create-or-update-property-dialog.hidden-options-help"
                            defaultMessage="If the option is hidden from the user, it will not be displayed in the UI, but it will be available for use in the API."
                          />
                        </Text>
                        <List paddingInlineStart={1} listStyleType="disc">
                          <ListItem display="flex" alignItems="center" gap={2}>
                            <EyeIcon />
                            <FormattedMessage
                              id="component.create-or-update-property-dialog.hidden-options-help-hidden"
                              defaultMessage="Hidden option, press to show it"
                            />
                          </ListItem>
                          <ListItem display="flex" alignItems="center" gap={2}>
                            <EyeOffIcon />
                            <FormattedMessage
                              id="component.create-or-update-property-dialog.hidden-options-help-visible"
                              defaultMessage="Visible option, press to hide it"
                            />
                          </ListItem>
                        </List>
                      </Stack>
                    </HelpPopover>
                  </Th>
                  <Th paddingInline={1} paddingBlock={2}></Th>
                </Tr>
              </Thead>
              <MotionConfig reducedMotion="always">
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
                        isDisabled={isReferenced} // standard fields can still add options
                        showOptionsWithColors={showOptionsWithColors ?? false}
                      />
                    );
                  })}
                </Reorder.Group>
              </MotionConfig>
            </Table>
          </Box>
          {errors.options?.values?.root ? (
            <FormControl isInvalid>
              <FormErrorMessage>
                <FormattedMessage
                  id="component.create-or-update-property-dialog.at-least-one-visible-option-error"
                  defaultMessage="At least one option must be visible"
                />
              </FormErrorMessage>
            </FormControl>
          ) : null}
          <HStack>
            <Button
              leftIcon={<PlusCircleIcon />}
              variant="outline"
              disabled={fields.length >= 1000 || isReferenced} // standard fields can still add options
              onClick={() => {
                append({
                  id: nanoid(),
                  label: { [intl.locale]: "" },
                  value: "",
                  ...(profileFieldType === "CHECKBOX"
                    ? {}
                    : { color: showOptionsWithColors ? DEFAULT_TAG_COLOR : undefined }),
                });
                setTimeout(() => setFocus(`options.values.${fields.length}.label`));
              }}
            >
              <FormattedMessage
                id="component.create-or-update-property-dialog.add-option-button"
                defaultMessage="Add option"
              />
            </Button>
            <Button
              variant="outline"
              onClick={handleImportOptions}
              disabled={isReferenced || isStandard}
            >
              <FormattedMessage
                id="component.create-or-update-property-dialog.import-options-button"
                defaultMessage="Import options..."
              />
            </Button>
          </HStack>
        </>
      )}
    </Stack>
  );
}

const _fragments = {
  ProfileType: gql`
    fragment ProfileFieldSelectSettings_ProfileType on ProfileType {
      id
      fields {
        ...getFieldsReferencedInMonitoring_ProfileTypeField
        ...getFieldsReferencedInAutoSearchConfig_ProfileTypeField
      }
    }
  `,
  ProfileTypeField: gql`
    fragment ProfileFieldSelectSettings_ProfileTypeField on ProfileTypeField {
      id
      type
      isStandard
    }
  `,
};

function ProfileFieldSelectOption({
  index,
  field,
  fields,
  onRemove,
  canRemoveOption,
  showOptionsWithColors,
  isDisabled,
}: {
  index: number;
  field: SelectOptionValue;
  fields: SelectOptionValue[];
  onRemove: (index: number) => void;
  canRemoveOption: boolean;
  showOptionsWithColors: boolean;
  isDisabled?: boolean;
}) {
  const intl = useIntl();
  const isUpdating = field.existing ?? false;
  const isOptionDisabled = isDisabled || (field.isStandard ?? false);
  const {
    control,
    formState: { errors, touchedFields },
    register,
    setValue,
    setFocus,
  } = useFormContext<CreateOrUpdateProfileTypeFieldDialogFormData>();

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
        paddingEnd={1}
        paddingBlock={2}
        width="50%"
        isInvalid={!!errors.options?.values?.[index]?.label}
        isDisabled={isOptionDisabled}
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
        isDisabled={isUpdating || isOptionDisabled}
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
          isDisabled={isOptionDisabled}
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
      <FormControl as={Td} verticalAlign="top" paddingInline={1} paddingBlock={2}>
        <Controller
          name={`options.values.${index}.isHidden` as const}
          control={control}
          rules={{
            required: false,
          }}
          defaultValue={false}
          render={({ field }) => (
            <IconButtonWithTooltip
              onClick={() => field.onChange(!field.value)}
              icon={field.value ? <EyeIcon /> : <EyeOffIcon />}
              variant="outline"
              label={
                field.value
                  ? intl.formatMessage({
                      id: "component.create-or-update-property-dialog.show-option-button",
                      defaultMessage: "Show option",
                    })
                  : intl.formatMessage({
                      id: "component.create-or-update-property-dialog.hide-option-button",
                      defaultMessage: "Hide option",
                    })
              }
            />
          )}
        />
      </FormControl>
      <Td verticalAlign="top" paddingInline={1} paddingBlock={2}>
        <IconButtonWithTooltip
          isDisabled={!canRemoveOption || isOptionDisabled}
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
