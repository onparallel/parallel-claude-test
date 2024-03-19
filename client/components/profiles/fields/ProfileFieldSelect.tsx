import { Box } from "@chakra-ui/react";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { UserLocale } from "@parallel/graphql/__types";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { UnwrapArray } from "@parallel/utils/types";
import { PropsWithChildren } from "react";
import { Controller } from "react-hook-form";
import { useIntl } from "react-intl";
import Select, { OptionProps, SingleValueProps, components } from "react-select";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup, ProfileFieldInputGroupProps } from "./ProfileFieldInputGroup";

interface ProfileFieldSelectProps
  extends ProfileFieldProps,
    Omit<ProfileFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

type SelectOptionValue = UnwrapArray<ProfileTypeFieldOptions["SELECT"]["values"]>;

export function ProfileFieldSelect({
  index,
  field,
  register,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  control,
  ...props
}: ProfileFieldSelectProps) {
  const intl = useIntl();

  const { values, showOptionsWithColors } = field.options as ProfileTypeFieldOptions["SELECT"];

  const reactSelectProps = useReactSelectProps({
    components: {
      SingleValue,
      Option,
    },
  });

  const extensions = {
    showOptionsWithColors,
  };

  const getOptionLabel = (option: SelectOptionValue) => {
    return option.label[intl.locale as UserLocale] ?? "";
  };

  const getOptionValue = (option: SelectOptionValue) => option.value;

  return (
    <ProfileFieldInputGroup
      {...props}
      field={field}
      expiryDate={expiryDate}
      isDisabled={isDisabled}
    >
      <Box width="100%">
        <Controller
          name={`fields.${index}.content.value`}
          control={control}
          render={({ field: { value, onChange, onBlur } }) => {
            return (
              <Select
                options={values}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                isClearable
                isMulti={false}
                value={values?.find((v) => v.value === value) ?? null}
                onChange={(value) => {
                  const { value: _value = null } = (value as SelectOptionValue) ?? {};
                  onChange(_value);
                }}
                onBlur={onBlur}
                placeholder={intl.formatMessage({
                  id: "component.profile-field-select.placeholder",
                  defaultMessage: "Select an option",
                })}
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
                {...reactSelectProps}
                {...(extensions as any)}
              />
            );
          }}
        />
      </Box>
    </ProfileFieldInputGroup>
  );
}

interface ReactSelectExtraProps {
  showOptionsWithColors?: boolean;
}

function SingleValue(
  props: SingleValueProps<SelectOptionValue> & { selectProps: ReactSelectExtraProps },
) {
  return (
    <components.SingleValue {...props}>
      <ProfileFieldSelectOptionItem
        color={props.selectProps.showOptionsWithColors ? props.data.color : undefined}
      >
        <LocalizableUserTextRender value={props.data.label} default={<></>} />
      </ProfileFieldSelectOptionItem>
    </components.SingleValue>
  );
}

function Option({
  children,
  ...props
}: OptionProps<SelectOptionValue> & { selectProps: ReactSelectExtraProps }) {
  return (
    <components.Option {...props}>
      <ProfileFieldSelectOptionItem
        color={props.selectProps.showOptionsWithColors ? props.data.color : undefined}
      >
        <LocalizableUserTextRender value={props.data.label} default={<></>} />
      </ProfileFieldSelectOptionItem>
    </components.Option>
  );
}

export function ProfileFieldSelectOptionItem({
  color,
  children,
}: PropsWithChildren<{ color: string | undefined }>) {
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
