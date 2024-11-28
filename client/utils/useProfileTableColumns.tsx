import { gql } from "@apollo/client";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  Grid,
  HStack,
  IconButton,
  Input,
  Stack,
  Text,
  ThemingProps,
} from "@chakra-ui/react";
import { CloseIcon, PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { DateInput } from "@parallel/components/common/DateInput";
import { DateTime } from "@parallel/components/common/DateTime";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PhoneInputLazy } from "@parallel/components/common/PhoneInputLazy";
import { ProfilePropertyContent } from "@parallel/components/common/ProfilePropertyContent";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import {
  SimpleOption,
  SimpleSelect,
  SimpleSelectInstance,
  SimpleSelectProps,
} from "@parallel/components/common/SimpleSelect";
import { Spacer } from "@parallel/components/common/Spacer";
import { TableColumn, TableColumnFilterProps } from "@parallel/components/common/Table";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { ProfileFormFieldCheckboxInner } from "@parallel/components/profiles/form-fields/ProfileFormFieldCheckbox";
import { ProfileFormFieldSelectInner } from "@parallel/components/profiles/form-fields/ProfileFormFieldSelect";
import {
  FilterSharedWithLogicalOperator,
  useProfileTableColumns_ProfileTypeFragment,
  useProfileTableColumns_ProfileWithPropertiesFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { format, startOfMonth } from "date-fns";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { entries, isNonNullish, isNullish, map, omit, pick, pipe, sortBy } from "remeda";
import { assert, Merge } from "ts-essentials";
import { BACKGROUND_CHECK_TOPICS } from "./backgroundCheckTopics";
import { never } from "./never";
import { ProfileTypeFieldOptions } from "./profileFields";
import {
  ProfileFieldValuesFilterCondition,
  ProfileFieldValuesFilterGroup,
} from "./ProfileFieldValuesFilter";
import { UnwrapArray } from "./types";
import { useProfileFieldValueFilterOperators } from "./useProfileFieldValueFilterOperators";
import { isValidDateString } from "./validation";
import { ValueProps } from "./ValueProps";

export function useProfileTableColumns(
  profileType: useProfileTableColumns_ProfileTypeFragment | null,
): TableColumn<useProfileTableColumns_ProfileWithPropertiesFragment, any>[] {
  const intl = useIntl();

  const profileTypeFields = profileType?.fields ?? [];

  return useMemo(() => {
    return ([] as TableColumn<useProfileTableColumns_ProfileWithPropertiesFragment>[])
      .concat([
        {
          key: "name",
          isFixed: true,
          isSortable: true,
          label: intl.formatMessage({
            id: "generic.name",
            defaultMessage: "Name",
          }),
          headerProps: {
            minWidth: "240px",
          },
          cellProps: {
            maxWidth: 0,
            minWidth: "240px",
          },
          CellContent: ({ row }) => {
            return (
              <OverflownText>
                <ProfileReference profile={row} showNameEvenIfDeleted />
              </OverflownText>
            );
          },
        },
        {
          key: "subscribers",
          label: intl.formatMessage({
            id: "component.profile-table-columns.subscribed",
            defaultMessage: "Subscribed",
          }),
          align: "left",
          headerProps: { minWidth: "132px" },
          cellProps: { minWidth: "132px" },
          CellContent: ({ row, column }) => {
            const { subscribers } = row;

            if (!subscribers?.length) {
              return <></>;
            }
            return (
              <Flex justifyContent={column.align}>
                <UserAvatarList usersOrGroups={subscribers?.map((s) => s.user)} />
              </Flex>
            );
          },
        },
        {
          key: "createdAt",
          isSortable: true,
          label: intl.formatMessage({
            id: "generic.created-at",
            defaultMessage: "Created at",
          }),
          headerProps: {
            minWidth: "160px",
          },
          cellProps: {
            minWidth: "160px",
          },
          CellContent: ({ row: { createdAt } }) => (
            <DateTime value={createdAt} format={FORMATS.LLL} whiteSpace="nowrap" />
          ),
        },
      ])
      .concat(
        profileTypeFields.map((field) => ({
          key: `field_${field.id}`,
          label: localizableUserTextRender({
            intl,
            value: field.name,
            default: intl.formatMessage({
              id: "generic.unnamed-profile-type-field",
              defaultMessage: "Unnamed property",
            }),
          }),
          headerProps: {
            minWidth: 0,
            maxWidth: "340px",
          },
          cellProps: {
            minWidth: "160px",
            whiteSpace: "nowrap",
            maxWidth: "340px",
          },
          Filter: ProfileValueFilter as any,
          CellContent: ({ row: profile }) => {
            const property = profile.properties.find((p) => p.field.id === field.id);
            if (isNonNullish(property)) {
              return (
                <ProfilePropertyContent
                  {...pick(property, ["field", "files", "value"])}
                  profileId={profile.id}
                  singleLine
                />
              );
            } else {
              return null;
            }
          },
        })),
      );
  }, [intl.locale, profileType]);
}

export type ProfileValueColumnFilter = Merge<
  ProfileFieldValuesFilterGroup,
  { conditions: ProfileFieldValuesFilterCondition[] }
>;

interface ProfileValueFilterFormData {
  filter: ProfileValueColumnFilter | undefined;
}

function ProfileValueFilter({
  context,
  column,
}: TableColumnFilterProps<
  ProfileFieldValuesFilterGroup,
  { profileType: useProfileTableColumns_ProfileTypeFragment }
>) {
  const intl = useIntl();
  const id = column.key.slice("field_".length);
  const profileTypeField = context.profileType.fields.find((f) => f.id === id)!;

  const { control, setValue, watch } = useFormContext<ProfileValueFilterFormData>();
  useEffect(() => {
    const logicalOperator = watch("filter.logicalOperator");
    if (isNullish(logicalOperator)) {
      setValue("filter.logicalOperator", "AND");
    }
  }, []);

  const {
    fields: conditions,
    append,
    remove,
  } = useFieldArray({ control, name: "filter.conditions" });

  const handleAddFilter = () => {
    append({
      profileTypeFieldId: profileTypeField.id,
      ...(["TEXT", "SHORT_TEXT"].includes(profileTypeField.type)
        ? {
            operator: "CONTAIN",
            value: "",
          }
        : profileTypeField.type === "NUMBER"
          ? {
              operator: "GREATER_THAN",
              value: 0,
            }
          : profileTypeField.type === "DATE"
            ? {
                operator: "GREATER_THAN_OR_EQUAL",
                value: format(startOfMonth(new Date()), "yyyy-MM-dd"),
              }
            : profileTypeField.type === "PHONE"
              ? { operator: "EQUAL", value: "" }
              : profileTypeField.type === "SELECT"
                ? {
                    operator: "EQUAL",
                    value:
                      (profileTypeField.options as ProfileTypeFieldOptions<"SELECT">).values.at(0)
                        ?.value ?? null,
                  }
                : profileTypeField.type === "CHECKBOX"
                  ? {
                      operator: "CONTAIN",
                      value: [
                        (profileTypeField.options as ProfileTypeFieldOptions<"CHECKBOX">).values.at(
                          0,
                        )?.value ?? null,
                      ].filter(isNonNullish),
                    }
                  : profileTypeField.type === "BACKGROUND_CHECK"
                    ? {
                        operator: "HAS_BG_CHECK_RESULTS",
                        value: null,
                      }
                    : { operator: "HAS_VALUE", value: null }),
    });
  };
  const logicalOperators = useMemo<SimpleOption<FilterSharedWithLogicalOperator>[]>(() => {
    return [
      {
        label: intl.formatMessage({
          id: "generic.condition-logical-join-or",
          defaultMessage: "or",
        }),
        value: "OR",
      },
      {
        label: intl.formatMessage({
          id: "generic.condition-logical-join-and",
          defaultMessage: "and",
        }),
        value: "AND",
      },
    ];
  }, [intl.locale]);

  return (
    <Stack width="280px">
      {conditions.length ? (
        <Grid templateColumns="32px 240px" alignItems="center" columnGap={2} rowGap={2}>
          {conditions.map((c, index) => {
            return (
              <ProfileValueFilterLine
                key={c.id}
                profileTypeField={profileTypeField}
                index={index}
                onRemove={() => remove(index)}
              />
            );
          })}
        </Grid>
      ) : (
        <Text textStyle="hint" textAlign="center" fontSize="sm">
          <FormattedMessage
            id="generic.no-filter-applied"
            defaultMessage="No filter is being applied."
          />
        </Text>
      )}
      {conditions.length > 1 ? (
        <Flex justifyContent="flex-start">
          <Button
            variant="ghost"
            size="sm"
            paddingX={2}
            fontWeight="normal"
            leftIcon={<PlusCircleFilledIcon color="primary.500" position="relative" boxSize={5} />}
            onClick={handleAddFilter}
            isDisabled={conditions.length >= 5}
          >
            <FormattedMessage id="generic.add-filter" defaultMessage="Add filter" />
          </Button>
        </Flex>
      ) : null}
      <HStack>
        {conditions.length > 1 ? (
          <Controller
            control={control}
            name="filter.logicalOperator"
            render={({ field }) => (
              <SimpleSelect size="sm" isSearchable={false} options={logicalOperators} {...field} />
            )}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            paddingX={2}
            fontWeight="normal"
            leftIcon={<PlusCircleFilledIcon color="primary.500" position="relative" boxSize={5} />}
            onClick={handleAddFilter}
            isDisabled={conditions.length >= 5}
          >
            <FormattedMessage id="generic.add-filter" defaultMessage="Add filter" />
          </Button>
        )}
        <Spacer />
        <ButtonGroup spacing={2}>
          <Button size="sm" onClick={() => setValue("filter.conditions", [])}>
            <FormattedMessage id="generic.clear" defaultMessage="Clear" />
          </Button>
          <Button type="submit" colorScheme="primary" size="sm">
            <FormattedMessage id="generic.apply" defaultMessage="Apply" />
          </Button>
        </ButtonGroup>
      </HStack>
    </Stack>
  );
}

export interface ProfileValueFilterLineProps {
  index: number;
  profileTypeField: UnwrapArray<useProfileTableColumns_ProfileTypeFragment["fields"]>;
  onRemove: () => void;
}

export function ProfileValueFilterLine({
  index,
  onRemove,
  profileTypeField,
}: ProfileValueFilterLineProps) {
  const path = `filter.conditions.${index}` as const;
  const intl = useIntl();

  const { setValue, setFocus, control, watch, formState } =
    useFormContext<ProfileValueFilterFormData>();
  const { operator, value } = watch(path);

  const operators = useProfileFieldValueFilterOperators(profileTypeField);
  const error = formState.errors.filter?.conditions?.[index]?.value;
  // workaround phone input validation
  const [validPhone, setValidPhone] = useState(true);

  return (
    <>
      <IconButton
        variant="ghost"
        icon={<CloseIcon boxSize={3} />}
        gridRow={{ base: "span 2", sm: "auto" }}
        aria-label={intl.formatMessage({
          id: "generic.remove",
          defaultMessage: "Remove",
        })}
        size="sm"
        onClick={onRemove}
      />
      <Controller
        control={control}
        name={`${path}.operator`}
        render={({ field: { onChange: _, ...field } }) => (
          <SimpleSelect
            size="sm"
            isSearchable={false}
            options={operators}
            {...field}
            onChange={(op) => {
              assert(isNonNullish(op));
              // here we try to use the same value when possible
              let _value = value;
              const _operator = op.startsWith("NOT_") ? (op.slice("NOT_".length) as typeof op) : op;
              if (operator === "EXPIRES_IN") {
                // if operator was EXPIRES_IN dont try to reuse value
                _value = null;
              }
              if (_operator === "EXPIRES_IN") {
                _value = "P1M";
              } else if (["HAS_VALUE", "IS_EXPIRED", "HAS_EXPIRY"].includes(_operator)) {
                _value = null;
              } else if (["TEXT", "SHORT_TEXT"].includes(profileTypeField.type)) {
                _value ??= "";
              } else if (profileTypeField.type === "NUMBER") {
                _value ??= 0;
              } else if (profileTypeField.type === "DATE") {
                _value ??= "";
              } else if (profileTypeField.type === "PHONE") {
                _value ??= "";
              } else if (profileTypeField.type === "SELECT") {
                if (_operator === "EQUAL") {
                  _value = typeof _value === "string" ? _value : null;
                } else if (_operator === "IS_ONE_OF") {
                  _value = Array.isArray(_value) ? _value : [];
                }
              } else if (profileTypeField.type === "CHECKBOX") {
                _value = Array.isArray(_value) ? _value : [];
              } else if (profileTypeField.type === "BACKGROUND_CHECK") {
                if (_operator === "HAS_BG_CHECK_TOPICS") {
                  _value = Array.isArray(_value) ? _value : [];
                } else {
                  _value = null;
                }
              } else {
                never();
              }
              setValue(`${path}.operator`, op!);
              setValue(`${path}.value`, _value);

              if (!["HAS_VALUE", "NOT_HAS_VALUE"].includes(op!)) {
                setTimeout(() => setFocus(`${path}.value`));
              }
            }}
          />
        )}
      />
      {[
        "HAS_VALUE",
        "HAS_BG_CHECK_MATCH",
        "HAS_BG_CHECK_RESULTS",
        "IS_EXPIRED",
        "HAS_EXPIRY",
      ].includes(operator.startsWith("NOT_") ? operator.slice("NOT_".length) : operator) ? (
        <></>
      ) : (
        <FormControl gridColumn="2" isInvalid={isNonNullish(error)}>
          <Controller<ProfileValueFilterFormData>
            control={control}
            shouldUnregister
            name={`${path}.value`}
            rules={{
              required: true,
              validate: {
                ...(operator === "EXPIRES_IN"
                  ? { validInterval: (value) => /^P\d+[YMWD]$/.test(value as string) }
                  : ["TEXT", "SHORT_TEXT"].includes(profileTypeField.type)
                    ? { minLength: (value) => (value as string).trim().length > 0 }
                    : profileTypeField.type === "DATE"
                      ? { validDate: isValidDateString as any }
                      : profileTypeField.type === "PHONE"
                        ? { validPhone: () => validPhone }
                        : {}),
              },
            }}
            render={({ field: { value, onChange, ...rest } }) =>
              operator === "EXPIRES_IN" ? (
                <SimpleDurationInput
                  size="sm"
                  value={value as string}
                  onChange={onChange}
                  {...rest}
                />
              ) : ["TEXT", "SHORT_TEXT"].includes(profileTypeField.type) ? (
                <Input
                  size="sm"
                  type="text"
                  value={value as string}
                  onChange={(e) => onChange(e.target.value)}
                  {...rest}
                />
              ) : profileTypeField.type === "NUMBER" ? (
                <NumeralInput size="sm" value={value as number} onChange={onChange} {...rest} />
              ) : profileTypeField.type === "DATE" ? (
                <DateInput
                  size="sm"
                  value={value as string}
                  onChange={(e) => onChange(e.target.value)}
                  {...rest}
                />
              ) : profileTypeField.type === "PHONE" ? (
                <PhoneInputLazy
                  size="sm"
                  value={value as string}
                  onChange={(value, { isValid }) => {
                    onChange(value);
                    setValidPhone(isValid);
                  }}
                  {...omit(rest, ["ref"])}
                  inputRef={rest.ref}
                />
              ) : profileTypeField.type === "SELECT" ? (
                <ProfileFormFieldSelectInner
                  field={profileTypeField as any}
                  value={value as any}
                  onChange={onChange}
                  size="sm"
                  isMulti={["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(operator)}
                  isClearable={false}
                  {...rest}
                />
              ) : profileTypeField.type === "CHECKBOX" ? (
                <ProfileFormFieldCheckboxInner
                  field={profileTypeField as any}
                  value={value as any}
                  onChange={onChange}
                  size="sm"
                  {...rest}
                />
              ) : profileTypeField.type === "BACKGROUND_CHECK" ? (
                <>
                  {["HAS_BG_CHECK_TOPICS", "NOT_HAS_BG_CHECK_TOPICS"].includes(operator) ? (
                    <BackgroundCheckTopicSelect
                      size="sm"
                      isMulti
                      value={value as any}
                      onChange={onChange}
                      {...rest}
                    />
                  ) : null}
                </>
              ) : (
                never()
              )
            }
          />
          <FormErrorMessage>
            {error?.type === "required" ? (
              <FormattedMessage
                id="generic.required-field-error"
                defaultMessage="The field is required"
              />
            ) : error?.type === "minLength" ? (
              <FormattedMessage
                id="generic.required-field-error"
                defaultMessage="The field is required"
              />
            ) : error?.type === "validPhone" ? (
              <FormattedMessage
                id="generic.invalid-phone-error"
                defaultMessage="A valid phone is required"
              />
            ) : error?.type === "validDate" ? (
              <FormattedMessage
                id="generic.invalid-date-error"
                defaultMessage="A valid date is required"
              />
            ) : error?.type === "validInterval" ? (
              <FormattedMessage
                id="generic.invalid-interval-error"
                defaultMessage="A valid interval is required"
              />
            ) : null}
          </FormErrorMessage>
        </FormControl>
      )}
    </>
  );
}

const SimpleDurationInput = chakraForwardRef<"input", ValueProps<string> & ThemingProps<"Input">>(
  function SimpleDurationInput({ value, onChange, ...props }, ref) {
    const intl = useIntl();
    const match = value?.match(/^P(\d+)([YMWD])$/);
    const [_, amount, span] = match ?? [, "", "M"];
    const options = useMemo(
      () => [
        {
          value: "Y",
          label: intl.formatMessage({ id: "generic.years", defaultMessage: "years" }),
        },
        {
          value: "M",
          label: intl.formatMessage({ id: "generic.months", defaultMessage: "months" }),
        },
        {
          value: "W",
          label: intl.formatMessage({ id: "generic.weeks", defaultMessage: "weeks" }),
        },
        {
          value: "D",
          label: intl.formatMessage({ id: "generic.days", defaultMessage: "days" }),
        },
      ],
      [intl.locale],
    );
    return (
      <HStack>
        <NumeralInput
          ref={ref}
          value={amount as any}
          decimals={0}
          onChange={(value) => onChange(`P${value ?? "_"}${span}`)}
          {...props}
        />
        <Box minWidth="120px">
          <SimpleSelect
            size={props.size as any}
            value={span}
            options={options}
            onChange={(value) => onChange(`P${amount}${value}`)}
          />
        </Box>
      </HStack>
    );
  },
);

const BackgroundCheckTopicSelect = forwardRef<
  SimpleSelectInstance<string, boolean>,
  Omit<SimpleSelectProps<string, boolean>, "options">
>(function BackgroundCheckTopicSelect(props, ref) {
  const options = useMemo(() => {
    return pipe(
      BACKGROUND_CHECK_TOPICS,
      entries(),
      map(([value, label]) => ({ value, label })),
      sortBy((i) => i.label),
    );
  }, []);
  return <SimpleSelect ref={ref} options={options} {...props} />;
});

useProfileTableColumns.fragments = {
  ProfileType: gql`
    fragment useProfileTableColumns_ProfileType on ProfileType {
      id
      fields {
        id
        type
        name
        options
        isExpirable
      }
    }
  `,
  Profile: gql`
    fragment useProfileTableColumns_Profile on Profile {
      id
      createdAt
      subscribers {
        id
        user {
          id
          ...UserAvatarList_User
        }
      }
      ...ProfileReference_Profile
    }
    ${ProfileReference.fragments.Profile}
    ${UserAvatarList.fragments.User}
  `,
  ProfileFieldProperty: gql`
    fragment useProfileTableColumns_ProfileFieldProperty on ProfileFieldProperty {
      field {
        ...ProfilePropertyContent_ProfileTypeField
      }
      files {
        ...ProfilePropertyContent_ProfileFieldFile
      }
      value {
        ...ProfilePropertyContent_ProfileFieldValue
      }
    }
    ${ProfilePropertyContent.fragments.ProfileTypeField}
    ${ProfilePropertyContent.fragments.ProfileFieldFile}
    ${ProfilePropertyContent.fragments.ProfileFieldValue}
  `,
  get _Profile() {
    return gql`
      fragment useProfileTableColumns_ProfileWithProperties on Profile {
        ...useProfileTableColumns_Profile
        properties {
          ...useProfileTableColumns_ProfileFieldProperty
        }
      }
      ${this.Profile}
      ${this.ProfileFieldProperty}
    `;
  },
};
