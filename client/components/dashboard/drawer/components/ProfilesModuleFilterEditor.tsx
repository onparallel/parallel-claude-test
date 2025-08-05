import { gql } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  Grid,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { AddIcon, CloseIcon, PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { MultiCheckboxSimpleSelect } from "@parallel/components/common/MultiCheckboxSimpleSelect";
import { ProfileTypeFieldSelect } from "@parallel/components/common/ProfileTypeFieldSelect";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { Spacer } from "@parallel/components/common/Spacer";
import { ProfilesModuleFilterEditor_ProfileTypeFieldFragment } from "@parallel/graphql/__types";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { ProfileFieldValuesFilterCondition } from "@parallel/utils/ProfileFieldValuesFilter";
import { useLogicalOperators } from "@parallel/utils/useLogicalOperators";
import { useProfileStatusOptions } from "@parallel/utils/useProfileStatusOptions";
import { ProfileValueFilterLine } from "@parallel/utils/useProfileTableColumns";
import { format, startOfMonth } from "date-fns";
import { useCallback } from "react";
import { Controller, get, useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { DashboardModuleFilterContainer } from "./DashboardModuleFilterContainer";

const MAX_GROUP_DEPTH = 2;

interface ProfilesModuleFilterEditorProps {
  field: string;
  profileTypeFields: ProfilesModuleFilterEditor_ProfileTypeFieldFragment[];
  isDisabled?: boolean;
  isUpdating?: boolean;
}

export function ProfilesModuleFilterEditor({
  field,
  profileTypeFields,
  isDisabled,
  isUpdating,
}: ProfilesModuleFilterEditorProps) {
  const { control } = useFormContext();
  return (
    <Stack spacing={4}>
      <Controller
        control={control}
        name={`${field}.status` as any}
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
            field={`${field}.status`}
            isUpdating={isUpdating}
          >
            <ProfileStatusFilter value={value} onChange={onChange} isDisabled={isDisabled} />
          </DashboardModuleFilterContainer>
        )}
      />
      <DashboardModuleFilterContainer
        label={
          <FormattedMessage
            id="component.profiles-module-filter-editor.properties"
            defaultMessage="Properties"
          />
        }
        field={`${field}.values`}
        isUpdating={isUpdating}
      >
        <FilterGroupComponent
          path={`${field}.values`}
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
        id: "component.profiles-module-filter-editor.all-profile-status-placeholder",
        defaultMessage: "Select a status...",
      })}
      onChange={handleChange}
      isDisabled={isDisabled}
    />
  );
}

interface FilterGroupComponentProps {
  path: string;
  profileTypeFields: ProfilesModuleFilterEditor_ProfileTypeFieldFragment[];
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
  const isRoot = depth === 0;
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const logicalOperators = useLogicalOperators();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${path}.conditions`,
    rules: isRoot ? undefined : { required: true, minLength: 1 },
  });

  return (
    <FormControl
      isInvalid={get(errors, `${path}.conditions`)?.root}
      {...(isRoot
        ? {}
        : {
            border: "1px",
            borderColor: "gray.200",
            padding: 4,
            borderRadius: "md",
          })}
      _invalid={{
        borderColor: "red.500",
        boxShadow: "error",
      }}
      flex="1"
      width="100%"
    >
      <Stack spacing={4}>
        {fields.length > 1 || depth > 0 ? (
          <HStack>
            {fields.length > 1 ? (
              <Controller
                control={control}
                name={`${path}.logicalOperator`}
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
            ) : null}
            <Spacer />
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
        ) : null}
        {fields.length > 0 ? (
          fields.map((field, index) => (
            <Stack key={field.id} align="flex-start" spacing={2} width="100%">
              {"logicalOperator" in field ? (
                <FilterGroupComponent
                  path={`${path}.conditions.${index}`}
                  depth={depth + 1}
                  onRemove={() => remove(index)}
                  profileTypeFields={profileTypeFields}
                />
              ) : (
                <ConditionComponent
                  path={`${path}.conditions.${index}`}
                  onRemove={() => remove(index)}
                  profileTypeFields={profileTypeFields}
                />
              )}
            </Stack>
          ))
        ) : (
          <Box>
            <Text textStyle="hint" textAlign="center">
              <FormattedMessage
                id="generic.no-filter-applied"
                defaultMessage="No filter is being applied."
              />
            </Text>
            <FormErrorMessage display="block" textAlign="center">
              <FormattedMessage
                id="component.profiles-module-filter-editor.filter-group-required-condition"
                defaultMessage="At least one condition is required."
              />
            </FormErrorMessage>
          </Box>
        )}
        <HStack>
          {depth < MAX_GROUP_DEPTH ? (
            <Button
              isDisabled={fields.length >= 5 || isDisabled}
              variant="outline"
              leftIcon={<AddIcon boxSize={3} />}
              size="sm"
              onClick={() => append({ conditions: [], logicalOperator: "AND" })}
              fontWeight={400}
            >
              <FormattedMessage
                id="component.profiles-module-filter-editor.add-group"
                defaultMessage="Add group"
              />
            </Button>
          ) : null}

          <Button
            isDisabled={fields.length >= 5 || isDisabled}
            variant="outline"
            leftIcon={<PlusCircleFilledIcon color="primary.500" boxSize={5} />}
            size="sm"
            onClick={() => append({ profileTypeFieldId: null, operator: "CONTAIN", value: "" })}
            fontWeight={400}
          >
            <FormattedMessage id="generic.add-condition" defaultMessage="Add condition" />
          </Button>
        </HStack>
      </Stack>
    </FormControl>
  );
}

const defaultConditionForField = (
  field: ProfilesModuleFilterEditor_ProfileTypeFieldFragment,
): ProfileFieldValuesFilterCondition => {
  if (field.type === "TEXT" || field.type === "SHORT_TEXT") {
    return { profileTypeFieldId: field.id, operator: "CONTAIN", value: "" };
  } else if (field.type === "NUMBER") {
    return { profileTypeFieldId: field.id, operator: "GREATER_THAN", value: 0 };
  } else if (field.type === "DATE") {
    return {
      profileTypeFieldId: field.id,
      operator: "GREATER_THAN_OR_EQUAL",
      value: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    };
  } else if (field.type === "PHONE") {
    return { profileTypeFieldId: field.id, operator: "EQUAL", value: "" };
  } else if (field.type === "SELECT") {
    return {
      profileTypeFieldId: field.id,
      operator: "EQUAL",
      value: (field.options as ProfileTypeFieldOptions<"SELECT">).values?.at(0)?.value ?? null,
    };
  } else if (field.type === "CHECKBOX") {
    return { profileTypeFieldId: field.id, operator: "CONTAIN", value: [] };
  } else if (field.type === "BACKGROUND_CHECK") {
    return { profileTypeFieldId: field.id, operator: "HAS_BG_CHECK_RESULTS", value: null };
  } else {
    return { profileTypeFieldId: field.id, operator: "HAS_VALUE", value: null };
  }
};

interface ConditionComponentProps {
  path: string;
  onRemove: () => void;
  profileTypeFields: ProfilesModuleFilterEditor_ProfileTypeFieldFragment[];
}

function ConditionComponent({ path, onRemove, profileTypeFields }: ConditionComponentProps) {
  const intl = useIntl();
  const { control, setValue, watch, clearErrors } = useFormContext();
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
          render={({ field: { value, onChange, ref, ...rest }, fieldState: { error } }) => (
            <FormControl isInvalid={isNonNullish(error)}>
              <ProfileTypeFieldSelect
                size="sm"
                value={profileTypeFields.find((f) => f.id === value) ?? null}
                fields={profileTypeFields}
                {...rest}
                onChange={(v) => {
                  setValue(path, defaultConditionForField(v!));
                  clearErrors(`${path}.profileTypeFieldId`);
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

ProfilesModuleFilterEditor.fragments = {
  ProfileTypeField: gql`
    fragment ProfilesModuleFilterEditor_ProfileTypeField on ProfileTypeField {
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
