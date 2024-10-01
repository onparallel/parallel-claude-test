import { Box } from "@chakra-ui/react";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileFormField_ProfileTypeFieldFragment, UserLocale } from "@parallel/graphql/__types";
import { ValueProps } from "@parallel/utils/ValueProps";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { UseReactSelectProps, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { UnwrapArray } from "@parallel/utils/types";
import { PropsWithChildren, forwardRef, useMemo } from "react";
import { Controller } from "react-hook-form";
import { useIntl } from "react-intl";
import Select, {
  IndicatorsContainerProps,
  OptionProps,
  SelectInstance,
  Props as SelectProps,
  SingleValueProps,
  ValueContainerProps,
  components,
} from "react-select";
import { isNonNullish, sortBy } from "remeda";
import { ProfileFormFieldProps } from "./ProfileFormField";
import {
  ProfileFormFieldInputGroup,
  ProfileFormFieldInputGroupProps,
} from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldSelectProps
  extends ProfileFormFieldProps,
    Omit<ProfileFormFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

type SelectOptionValue = UnwrapArray<ProfileTypeFieldOptions<"SELECT">["values"]>;

export function ProfileFormFieldSelect({
  index,
  field,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  control,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
}: ProfileFormFieldSelectProps) {
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
          name={`fields.${index}.content.value`}
          control={control}
          render={({ field: { value, onChange, onBlur } }) => {
            return (
              <ProfileFormFieldSelectInner
                isDisabled={isDisabled}
                field={field}
                value={value}
                onChange={onChange}
                onBlur={() => {
                  if (isNonNullish(value)) {
                    return showExpiryDateDialog({});
                  }
                  onBlur();
                }}
                styles={{
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
                }}
              />
            );
          }}
        />
      </Box>
    </ProfileFormFieldInputGroup>
  );
}

interface ProfileFormFieldSelectInnerProps
  extends UseReactSelectProps<SelectOptionValue, false, never>,
    Omit<SelectProps<SelectOptionValue, false, never>, "value" | "onChange">,
    ValueProps<string> {
  field: ProfileFormField_ProfileTypeFieldFragment;
}

export const ProfileFormFieldSelectInner = forwardRef<
  SelectInstance<SelectOptionValue, false, never>,
  ProfileFormFieldSelectInnerProps
>(function ProfileFieldSelectInner({ field, value, onChange, ...props }, ref) {
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
      SingleValue,
      Option,
      ValueContainer,
      IndicatorsContainer,
      ...props.components,
    },
  });

  const _value = useMemo(() => {
    return valuesOrderedByLocale.find((v) => v.value === value) ?? null;
  }, [props.options, props.isMulti, value]);

  const extensions = {
    showOptionsWithColors,
  };

  const getOptionLabel = (option: SelectOptionValue) => {
    return localizableUserTextRender({ intl, value: option.label, default: "" });
  };

  const getOptionValue = (option: SelectOptionValue) => option.value;

  return (
    <Select<SelectOptionValue, false, never>
      ref={ref}
      value={_value}
      options={valuesOrderedByLocale}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      isClearable
      isMulti={false}
      onChange={(x) => onChange(x ? x.value : null)}
      placeholder={intl.formatMessage({
        id: "component.profile-field-select.placeholder",
        defaultMessage: "Select an option",
      })}
      {...props}
      {...rsProps}
      {...(extensions as any)}
    />
  );
});

interface ReactSelectExtraProps {
  showOptionsWithColors?: boolean;
}

function ValueContainer(
  props: ValueContainerProps<SelectOptionValue, false, never> & {
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
  props: IndicatorsContainerProps<SelectOptionValue, false, never> & {
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

function SingleValue({
  children,
  ...props
}: SingleValueProps<SelectOptionValue, false, never> & { selectProps: ReactSelectExtraProps }) {
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
}: OptionProps<SelectOptionValue, false, never> & { selectProps: ReactSelectExtraProps }) {
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
