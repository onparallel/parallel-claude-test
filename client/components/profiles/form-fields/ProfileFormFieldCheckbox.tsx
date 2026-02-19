import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import {
  MultiCheckboxSimpleSelect,
  MultiCheckboxSimpleSelectInstance,
  MultiCheckboxSimpleSelectProps,
} from "@parallel/components/common/MultiCheckboxSimpleSelect";
import { ProfileFormField_ProfileTypeFieldFragment } from "@parallel/graphql/__types";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { OptimizedMenuList } from "@parallel/utils/react-select/OptimizedMenuList";
import { UnwrapArray } from "@parallel/utils/types";
import { RefAttributes, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useIntl } from "react-intl";
import {
  IndicatorsContainerProps,
  MultiValueProps,
  MultiValueRemoveProps,
  ValueContainerProps,
  components,
  createFilter,
} from "react-select";
import { isNonNullish, sortBy } from "remeda";
import { ProfileFormInnerData } from "../ProfileFormInner";
import { ProfileFormFieldProps } from "./ProfileFormField";
import {
  ProfileFormFieldInputGroup,
  ProfileFormFieldInputGroupProps,
} from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldCheckboxProps
  extends ProfileFormFieldProps,
    Omit<ProfileFormFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

type SelectOptionValue = UnwrapArray<ProfileTypeFieldOptions<"CHECKBOX">["values"]>;

export function ProfileFormFieldCheckbox({
  field,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
  showBaseStyles,
}: ProfileFormFieldCheckboxProps) {
  const { control } = useFormContext<ProfileFormInnerData>();
  return (
    <ProfileFormFieldInputGroup
      field={field}
      expiryDate={expiryDate}
      isDisabled={isDisabled}
      showSuggestionsButton={showSuggestionsButton}
      areSuggestionsVisible={areSuggestionsVisible}
      onToggleSuggestions={onToggleSuggestions}
    >
      <Controller
        name={`fields.${field.id}.content.value`}
        control={control}
        render={({ field: { value, onChange, onBlur } }) => {
          return (
            <ProfileFormFieldCheckboxInner
              isDisabled={isDisabled}
              field={field}
              value={value}
              onChange={(value) => onChange(value.length > 0 ? value : null)}
              onBlur={() => {
                if (isNonNullish(value)) {
                  return showExpiryDateDialog({});
                }
                onBlur();
              }}
              styles={
                showBaseStyles
                  ? undefined
                  : {
                      control: (baseStyles) => ({
                        ...baseStyles,
                        borderColor: "transparent",
                        ":hover": {
                          borderColor: "inherit",
                        },
                        ":focus-within": {
                          borderColor: baseStyles.borderColor,
                          "[data-rs='multi-value']": { backgroundColor: "#e2e8f0" },

                          "[data-rs='multi-value-remove']": { display: "flex" },
                          "[data-rs='value-container'] > :last-child": {
                            height: "auto",
                            position: "relative",
                          },
                          "[data-rs='value-container'] > :last-child > input": {
                            height: "auto",
                          },
                        },
                        ":hover, :focus-within": {
                          "[data-rs='value-container']": { paddingInlineEnd: 0 },
                          "[data-rs='indicators-container']": { display: "flex" },
                        },
                      }),
                      valueContainer: (baseStyles) => ({
                        ...baseStyles,
                        paddingInlineEnd: "16px",
                        paddingInlineStart: "10px",
                        paddingBlock: "2px",
                        display: "flex",
                        flexDirection: "column",
                        flexWrap: "nowrap",
                        alignItems: "flex-start",
                      }),
                      multiValue: (baseStyles) => ({
                        ...baseStyles,
                        backgroundColor: "transparent",
                      }),
                      multiValueRemove: (baseStyles) => ({
                        ...baseStyles,
                        display: "none",
                      }),
                      multiValueLabel: (baseStyles) => ({
                        ...baseStyles,
                        fontSize: "16px",
                        whiteSpace: "wrap",
                      }),
                      indicatorsContainer: (baseStyles) => ({
                        ...baseStyles,
                        display: "none",
                      }),
                      placeholder: (baseStyles) => ({
                        ...baseStyles,
                        display: "none",
                      }),
                      input: (baseStyles) => ({
                        ...baseStyles,
                        height: "auto",
                        position: "absolute",
                        "> input": {
                          height: "auto",
                        },
                      }),
                    }
              }
            />
          );
        }}
      />
    </ProfileFormFieldInputGroup>
  );
}

interface ProfileFormFieldSelectInnerProps extends MultiCheckboxSimpleSelectProps {
  field: ProfileFormField_ProfileTypeFieldFragment;
}

export function ProfileFormFieldCheckboxInner({
  field,
  value,
  ...props
}: ProfileFormFieldSelectInnerProps & RefAttributes<MultiCheckboxSimpleSelectInstance>) {
  const intl = useIntl();

  const { values, standardList } = field.options as ProfileTypeFieldOptions<"CHECKBOX">;

  const valuesOrderedByLocale = useMemo(
    // only sort by label if options are from standard list
    () => {
      const options = values.map((v) => ({
        value: v.value,
        label: localizableUserTextRender({ intl, value: v.label, default: "" }),
        isHidden: v.isHidden,
      }));
      return standardList ? sortBy(options, (v) => v.label) : options;
    },
    [values, standardList, intl.locale],
  );

  const customFilterOption = useMemo(() => {
    const baseFilter = createFilter({
      // this improves search performance on long lists
      ignoreAccents: valuesOrderedByLocale.length > 1000 ? false : true,
    });

    return (option: any, inputValue: string) => {
      // Hide options that are hidden and not selected
      if (option.data.isHidden) {
        return false;
      }
      return baseFilter(option, inputValue);
    };
  }, [valuesOrderedByLocale.length]);

  return (
    <MultiCheckboxSimpleSelect
      {...props}
      options={valuesOrderedByLocale}
      value={value}
      filterOption={customFilterOption}
      components={
        {
          ValueContainer,
          IndicatorsContainer,
          MultiValueRemove,
          MultiValue,
          ...(valuesOrderedByLocale.length > 100 ? { MenuList: OptimizedMenuList as any } : {}),
        } as any
      }
    />
  );
}

function ValueContainer(props: ValueContainerProps<SelectOptionValue, true, never>) {
  return (
    <components.ValueContainer
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "value-container" } }}
    />
  );
}

function MultiValue(props: MultiValueProps<SelectOptionValue, true, never>) {
  return (
    <components.MultiValue
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "multi-value" } }}
    />
  );
}

function MultiValueRemove(props: MultiValueRemoveProps<SelectOptionValue, true, never>) {
  return (
    <components.MultiValueRemove
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "multi-value-remove" } }}
    />
  );
}

function IndicatorsContainer(props: IndicatorsContainerProps<SelectOptionValue, true, never>) {
  return (
    <components.IndicatorsContainer
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "indicators-container" } }}
    />
  );
}
