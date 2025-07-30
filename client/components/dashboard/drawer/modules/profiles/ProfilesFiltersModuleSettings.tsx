import { gql } from "@apollo/client";
import { Box, Button, FormControl, Grid, HStack, Stack, Text } from "@chakra-ui/react";
import { AddIcon, CloseIcon, PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { MultiCheckboxSimpleSelect } from "@parallel/components/common/MultiCheckboxSimpleSelect";
import { ProfileTypeFieldSelect } from "@parallel/components/common/ProfileTypeFieldSelect";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { Spacer } from "@parallel/components/common/Spacer";
import { ProfilesFiltersModuleSettings_ProfileTypeFieldFragment } from "@parallel/graphql/__types";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { useLogicalOperators } from "@parallel/utils/useLogicalOperators";
import { useProfileStatusOptions } from "@parallel/utils/useProfileStatusOptions";
import { ProfileValueFilterLine } from "@parallel/utils/useProfileTableColumns";
import { format, startOfMonth } from "date-fns";
import { useCallback } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { DashboardModuleFilterContainer } from "../../components/DashboardModuleFilterContainer";
import { DashboardModuleDrawerFormData } from "../../DashboardModuleDrawer";

const MAX_GROUP_DEPTH = 2;

interface ProfilesFiltersModuleSettingsProps {
  index?: number;
  path?: string;
  profileTypeFields: ProfilesFiltersModuleSettings_ProfileTypeFieldFragment[];
  isDisabled?: boolean;
}

export function ProfilesFiltersModuleSettings({
  index = 0,
  path,
  profileTypeFields,
  isDisabled,
}: ProfilesFiltersModuleSettingsProps) {
  const { control } = useFormContext<DashboardModuleDrawerFormData>();
  const basePath = path ?? `settings.filters.${index}`;
  return (
    <Stack spacing={4}>
      <Controller
        control={control}
        name={`${basePath}.status` as any}
        defaultValue={["OPEN"]}
        rules={{ required: true }}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <DashboardModuleFilterContainer
            label={
              <FormattedMessage
                id="component.petition-filters-module-settings.petition-status-label"
                defaultMessage="Status"
              />
            }
            isInvalid={isNonNullish(error)}
            field={`${basePath}.status`}
          >
            <ProfileStatusFilter value={value} onChange={onChange} isDisabled={isDisabled} />
          </DashboardModuleFilterContainer>
        )}
      />
      <DashboardModuleFilterContainer
        label={
          <FormattedMessage
            id="component.profiles-filters-module-settings.properties"
            defaultMessage="Properties"
          />
        }
        field={`${basePath}.values`}
      >
        <FilterGroupComponent
          path={path ? path + ".values" : `settings.filters.${index}.values`}
          profileTypeFields={profileTypeFields}
          isDisabled={isDisabled}
        />
      </DashboardModuleFilterContainer>
    </Stack>
  );
}

function ProfileStatusFilter({
  value,
  onChange,
  isDisabled,
}: {
  value?: string[];
  onChange: (v: string[]) => void;
  isDisabled?: boolean;
}) {
  const intl = useIntl();
  const profileStatusesOptions = useProfileStatusOptions();

  const handleChange = useCallback(
    (newValue: string[]) => {
      onChange(newValue);
    },
    [onChange],
  );

  return (
    <MultiCheckboxSimpleSelect
      options={profileStatusesOptions}
      value={value ?? []}
      isClearable
      isSearchable
      placeholder={intl.formatMessage({
        id: "component.profiles-filters-module-settings.all-profile-status-placeholder",
        defaultMessage: "Select a status...",
      })}
      onChange={handleChange}
      isDisabled={isDisabled}
    />
  );
}

interface FilterGroupComponentProps {
  path: string;
  profileTypeFields: ProfilesFiltersModuleSettings_ProfileTypeFieldFragment[];
  depth?: number;
  onRemove?: () => void;
  isDisabled?: boolean;
}

function FilterGroupComponent({
  path,
  profileTypeFields,
  depth = 0,
  onRemove,
  isDisabled,
}: FilterGroupComponentProps) {
  const intl = useIntl();
  const { control, setValue } = useFormContext();
  const logicalOperators = useLogicalOperators();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${path}.conditions`,
  });

  const handleAddGroup = () => {
    append({
      conditions: [],
      logicalOperator: "AND",
    });
    if (fields.length === 0) {
      setValue(`${path}.logicalOperator`, "AND");
    }
  };

  const handleAddCondition = () => {
    append({
      profileTypeFieldId: null,
      operator: "CONTAIN",
      value: "",
    });
    if (fields.length === 0) {
      setValue(`${path}.logicalOperator`, "AND");
    }
  };

  const handleRemoveCondition = (index: number) => {
    remove(index);
    if (fields.length === 1) {
      setValue(path, null);
    }
  };

  return (
    <Box
      border={depth === 0 ? undefined : "1px"}
      borderColor="gray.200"
      p={depth === 0 ? 0 : 4}
      borderRadius="md"
      flex="1"
      width="100%"
    >
      <Stack spacing={4}>
        <HStack justify="space-between">
          {fields.length > 1 ? (
            <Controller
              control={control}
              name={`${path}.logicalOperator`}
              defaultValue="AND"
              render={({ field }) => (
                <SimpleSelect
                  size="sm"
                  isDisabled={isDisabled}
                  isSearchable={false}
                  options={logicalOperators}
                  {...field}
                />
              )}
            />
          ) : (
            <Spacer />
          )}

          {depth > 0 ? (
            <IconButtonWithTooltip
              variant="ghost"
              icon={<CloseIcon boxSize={3} />}
              label={intl.formatMessage({
                id: "generic.remove",
                defaultMessage: "Remove",
              })}
              size="sm"
              onClick={onRemove}
            />
          ) : null}
        </HStack>

        {fields.length > 0 ? (
          fields.map((field, index) => (
            <Stack key={field.id} align="flex-start" spacing={2} width="100%">
              {"conditions" in field ? (
                <FilterGroupComponent
                  path={`${path}.conditions.${index}`}
                  depth={depth + 1}
                  onRemove={() => handleRemoveCondition(index)}
                  profileTypeFields={profileTypeFields}
                />
              ) : (
                <ConditionComponent
                  path={`${path}.conditions.${index}`}
                  onRemove={() => handleRemoveCondition(index)}
                  profileTypeFields={profileTypeFields}
                />
              )}
            </Stack>
          ))
        ) : (
          <Text textStyle="hint" textAlign="center">
            <FormattedMessage
              id="generic.no-filter-applied"
              defaultMessage="No filter is being applied."
            />
          </Text>
        )}
        <HStack>
          {depth < MAX_GROUP_DEPTH ? (
            <Button
              isDisabled={fields.length >= 5 || isDisabled}
              variant="outline"
              leftIcon={<AddIcon boxSize={3} />}
              size="sm"
              onClick={handleAddGroup}
              fontWeight={400}
            >
              <FormattedMessage
                id="component.profiles-filters-module-settings.add-group"
                defaultMessage="Add group"
              />
            </Button>
          ) : null}

          <Button
            isDisabled={fields.length >= 5 || isDisabled}
            variant="outline"
            leftIcon={<PlusCircleFilledIcon color="primary.500" boxSize={5} />}
            size="sm"
            onClick={handleAddCondition}
            fontWeight={400}
          >
            <FormattedMessage
              id="component.profiles-filters-module-settings.add-condition"
              defaultMessage="Add condition"
            />
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
}

interface DefaultValueConfig {
  operator: string;
  value: any;
}

const DEFAULT_VALUE_MAP: Record<
  string,
  (field: ProfilesFiltersModuleSettings_ProfileTypeFieldFragment) => DefaultValueConfig
> = {
  TEXT: () => ({ operator: "CONTAIN", value: "" }),
  SHORT_TEXT: () => ({ operator: "CONTAIN", value: "" }),
  NUMBER: () => ({ operator: "GREATER_THAN", value: 0 }),
  DATE: () => ({
    operator: "GREATER_THAN_OR_EQUAL",
    value: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  }),
  PHONE: () => ({ operator: "EQUAL", value: "" }),
  SELECT: (field) => ({
    operator: "EQUAL",
    value: (field.options as ProfileTypeFieldOptions<"SELECT">).values?.at(0)?.value ?? null,
  }),
  CHECKBOX: (field) => ({
    operator: "CONTAIN",
    value: [],
  }),
  BACKGROUND_CHECK: () => ({ operator: "HAS_BG_CHECK_RESULTS", value: null }),
};

const getDefaultValuesForField = (
  field: ProfilesFiltersModuleSettings_ProfileTypeFieldFragment,
): DefaultValueConfig => {
  const getDefaultValue = DEFAULT_VALUE_MAP[field.type];
  return getDefaultValue ? getDefaultValue(field) : { operator: "HAS_VALUE", value: null };
};

interface ConditionComponentProps {
  path: string;
  onRemove: () => void;
  profileTypeFields: ProfilesFiltersModuleSettings_ProfileTypeFieldFragment[];
}

function ConditionComponent({ path, onRemove, profileTypeFields }: ConditionComponentProps) {
  const intl = useIntl();
  const { control, setValue, watch } = useFormContext();
  const profileTypeFieldId = watch(`${path}.profileTypeFieldId`);
  const profileTypeField = profileTypeFields.find((f) => f.id === profileTypeFieldId);

  return (
    <Stack spacing={2} width="100%">
      <HStack flex="1">
        <IconButtonWithTooltip
          variant="ghost"
          icon={<CloseIcon boxSize={3} />}
          label={intl.formatMessage({
            id: "generic.remove",
            defaultMessage: "Remove",
          })}
          size="sm"
          onClick={onRemove}
        />
        <Controller
          control={control}
          name={`${path}.profileTypeFieldId`}
          rules={{ required: true }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <FormControl isInvalid={isNonNullish(error)}>
              <ProfileTypeFieldSelect
                size="sm"
                value={profileTypeFields.find((f) => f.id === value) ?? null}
                fields={profileTypeFields}
                onChange={(v) => {
                  onChange(v?.id);

                  if (v) {
                    const selectedField = profileTypeFields.find((f) => f.id === v.id);
                    if (selectedField) {
                      const defaultValues = getDefaultValuesForField(selectedField);
                      setValue(`${path}.operator`, defaultValues.operator);
                      setValue(`${path}.value`, defaultValues.value);
                    }
                  }
                }}
              />
            </FormControl>
          )}
        />
      </HStack>

      {profileTypeField ? (
        <Grid templateColumns="0px auto" alignItems="center" columnGap={2} rowGap={2}>
          <ProfileValueFilterLine profileTypeField={profileTypeField} path={path} />
        </Grid>
      ) : null}
    </Stack>
  );
}

ProfilesFiltersModuleSettings.fragments = {
  ProfileTypeField: gql`
    fragment ProfilesFiltersModuleSettings_ProfileTypeField on ProfileTypeField {
      id
      type
      options
      ...ProfileTypeFieldSelect_ProfileTypeField
      ...ProfileValueFilterLine_ProfileTypeField
    }
    ${ProfileTypeFieldSelect.fragments.ProfileTypeField}
    ${ProfileValueFilterLine.fragments.ProfileTypeField}
  `,
};
