import { Box } from "@chakra-ui/react";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileFormField_ProfileTypeFieldFragment, UserLocale } from "@parallel/graphql/__types";
import { ValueProps } from "@parallel/utils/ValueProps";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { UseReactSelectProps, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { UnwrapArray } from "@parallel/utils/types";
import { ForwardedRef, PropsWithChildren, ReactElement, forwardRef, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useIntl } from "react-intl";
import Select, {
  IndicatorsContainerProps,
  MultiValue,
  OptionProps,
  SelectInstance,
  Props as SelectProps,
  SingleValue,
  SingleValueProps,
  ValueContainerProps,
  components,
} from "react-select";
import { isNonNullish, sortBy } from "remeda";
import { ProfileFormInnerData } from "../ProfileFormInner";
import { ProfileFormFieldProps } from "./ProfileFormField";
import {
  ProfileFormFieldInputGroup,
  ProfileFormFieldInputGroupProps,
} from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldSelectProps
  extends ProfileFormFieldProps,
    Omit<ProfileFormFieldInputGroupProps, "field"> {
  showExpiryDateDialog?: (props: { force?: boolean; isDirty?: boolean }) => void;
}

type SelectOptionValue = UnwrapArray<ProfileTypeFieldOptions<"SELECT">["values"]>;

export function ProfileFormFieldSelect({
  field,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
  showBaseStyles,
  isRequired,
}: ProfileFormFieldSelectProps) {
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
      <Box width="100%">
        <Controller
          name={`fields.${field.id}.content.value` as const}
          control={control}
          rules={{
            required: isRequired,
          }}
          render={({ field: { value, onChange, onBlur } }) => {
            return (
              <ProfileFormFieldSelectInner
                isDisabled={isDisabled}
                field={field}
                value={value}
                onChange={onChange}
                onBlur={() => {
                  if (isNonNullish(value)) {
                    return showExpiryDateDialog?.({});
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
                          },
                          ":hover, :focus-within": {
                            "[data-rs='value-container']": { paddingInlineEnd: 0 },
                            "[data-rs='indicators-container']": { display: "flex" },
                          },
                        }),
                        valueContainer: (baseStyles) => ({
                          ...baseStyles,
                          paddingInlineEnd: "16px",
                        }),
                        indicatorsContainer: (baseStyles) => ({
                          ...baseStyles,
                          display: "none",
                        }),
                        placeholder: (baseStyles) => ({
                          ...baseStyles,
                          opacity: 0,
                        }),
                      }
                }
              />
            );
          }}
        />
      </Box>
    </ProfileFormFieldInputGroup>
  );
}

interface ProfileFormFieldSelectInnerProps<IsMulti extends boolean = false>
  extends UseReactSelectProps<SelectOptionValue, IsMulti, never>,
    Omit<SelectProps<SelectOptionValue, IsMulti, never>, "value" | "onChange">,
    ValueProps<IsMulti extends true ? string[] : string | null, false> {
  field: ProfileFormField_ProfileTypeFieldFragment;
}

function _ProfileFieldSelectInner<IsMulti extends boolean = false>(
  { field, value, onChange, ...props }: ProfileFormFieldSelectInnerProps<IsMulti>,
  ref: ForwardedRef<SelectInstance<SelectOptionValue, IsMulti, never>>,
) {
  const intl = useIntl();

  const { values, showOptionsWithColors, standardList } =
    field.options as ProfileTypeFieldOptions<"SELECT">;

  const valuesOrderedByLocale = useMemo(
    // only sort by locale if options are from standard list
    () => (standardList ? sortBy(values, (v) => v.label[intl.locale as UserLocale]!) : values),
    [values],
  );

  const rsProps = useReactSelectProps({
    ...props,
    components: {
      SingleValue: _SingleValue,
      Option,
      ValueContainer,
      IndicatorsContainer,
      ...props.components,
    } as any,
  });

  const _value = useMemo(() => {
    return props.isMulti
      ? (value as string[])
          .map((value) => values.find((v) => v.value === value))
          .filter(isNonNullish)
      : (values.find((v) => v.value === value) ?? null);
  }, [props.options, props.isMulti, value]);

  const extensions = {
    showOptionsWithColors,
  };

  const getOptionLabel = (option: SelectOptionValue) => {
    return localizableUserTextRender({ intl, value: option.label, default: "" });
  };

  const getOptionValue = (option: SelectOptionValue) => option.value;

  return (
    <Select<SelectOptionValue, boolean, never>
      ref={ref}
      value={_value}
      options={valuesOrderedByLocale}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      isClearable
      onChange={(x) =>
        onChange(
          (props.isMulti
            ? (x as MultiValue<SelectOptionValue>).map((i) => i.value)
            : ((x as SingleValue<SelectOptionValue>)?.value ?? null)) as any,
        )
      }
      placeholder={intl.formatMessage({
        id: "component.profile-field-select.placeholder",
        defaultMessage: "Select an option",
      })}
      {...props}
      {...rsProps}
      {...(extensions as any)}
    />
  );
}

export const ProfileFormFieldSelectInner = forwardRef<
  SelectInstance<SelectOptionValue, boolean, never>,
  ProfileFormFieldSelectInnerProps
>(_ProfileFieldSelectInner as any) as <IsMulti extends boolean = false>(
  props: ProfileFormFieldSelectInnerProps<IsMulti>,
) => ReactElement;

interface ReactSelectExtraProps {
  showOptionsWithColors?: boolean;
}

function ValueContainer(
  props: ValueContainerProps<SelectOptionValue, boolean, never> & {
    selectProps: ReactSelectExtraProps;
  },
) {
  return (
    <components.ValueContainer
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "value-container" } }}
    />
  );
}

function IndicatorsContainer(
  props: IndicatorsContainerProps<SelectOptionValue, boolean, never> & {
    selectProps: ReactSelectExtraProps;
  },
) {
  return (
    <components.IndicatorsContainer
      {...props}
      innerProps={{ ...props.innerProps, ...{ "data-rs": "indicators-container" } }}
    />
  );
}

function _SingleValue({
  children,
  ...props
}: SingleValueProps<SelectOptionValue, boolean, never> & { selectProps: ReactSelectExtraProps }) {
  return (
    <components.SingleValue {...props}>
      <ProfileFormFieldSelectOptionItem
        color={props.selectProps.showOptionsWithColors ? props.data.color : undefined}
      >
        {children}
      </ProfileFormFieldSelectOptionItem>
    </components.SingleValue>
  );
}

function Option({
  children,
  ...props
}: OptionProps<SelectOptionValue, boolean, never> & { selectProps: ReactSelectExtraProps }) {
  return (
    <components.Option {...props}>
      <ProfileFormFieldSelectOptionItem
        color={props.selectProps.showOptionsWithColors ? props.data.color : undefined}
      >
        {children}
      </ProfileFormFieldSelectOptionItem>
    </components.Option>
  );
}

export function ProfileFormFieldSelectOptionItem({
  color,
  children,
}: PropsWithChildren<{ color?: string | undefined }>) {
  return (
    <>
      {color ? (
        <Box
          as="span"
          display="inline-block"
          color="gray.800"
          paddingInline={2}
          lineHeight={6}
          height={6}
          fontSize="sm"
          backgroundColor={color}
          borderRadius="full"
        >
          {children}
        </Box>
      ) : (
        <Box as="span" color="inherit">
          {children}
        </Box>
      )}
    </>
  );
}
