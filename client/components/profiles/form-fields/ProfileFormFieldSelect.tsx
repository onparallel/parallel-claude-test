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
  OptionProps,
  SelectInstance,
  Props as SelectProps,
  SingleValueProps,
  components,
} from "react-select";
import { sortBy } from "remeda";
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
  register,
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
                onBlur={onBlur}
                styles={{
                  control: (baseStyles) => ({
                    ...baseStyles,
                    borderColor: "transparent",
                    "&:hover": {
                      borderColor: "inherit",
                    },
                    "&:hover *, :focus-within *": {
                      opacity: 1,
                    },
                  }),
                  indicatorsContainer: (baseStyles) => ({
                    ...baseStyles,
                    opacity: 0,
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
