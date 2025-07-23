import { FormatFormErrorMessage, ShortTextInput } from "@parallel/components/common/ShortTextInput";
import { useShortTextFormats } from "@parallel/utils/useShortTextFormats";
import { Controller, useFormContext } from "react-hook-form";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { ProfileFormData } from "../ProfileForm";
import { ProfileFormFieldProps } from "./ProfileFormField";
import {
  ProfileFormFieldInputGroup,
  ProfileFormFieldInputGroupProps,
} from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldShortTextProps
  extends ProfileFormFieldProps,
    Omit<ProfileFormFieldInputGroupProps, "field"> {
  showExpiryDateDialog?: (props: { force?: boolean; isDirty?: boolean }) => void;
}

export function ProfileFormFieldShortText({
  field,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
  showBaseStyles,
  isRequired,
}: ProfileFormFieldShortTextProps) {
  const { control } = useFormContext<ProfileFormData>();
  const intl = useIntl();
  const formats = useShortTextFormats();
  const format = isNonNullish(field.options.format)
    ? formats.find((f) => f.value === field.options.format)
    : null;

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
        name={`fields.${field.id}.content.value` as const}
        control={control}
        rules={{
          validate: (value) => {
            return isNonNullish(format) && value?.length
              ? (format.validate?.(value) ?? true)
              : true;
          },
          required: isRequired,
        }}
        render={({ field: { onChange, value, ...rest } }) => {
          return (
            <ShortTextInput
              value={value ?? ""}
              style={
                showBaseStyles
                  ? undefined
                  : {
                      borderColor: "transparent",
                    }
              }
              placeholder={
                isNonNullish(format)
                  ? intl.formatMessage(
                      {
                        id: "generic.for-example",
                        defaultMessage: "E.g. {example}",
                      },
                      {
                        example: format.example,
                      },
                    )
                  : undefined
              }
              maxLength={1_000}
              onChange={(_value) => {
                onChange(_value);
              }}
              {...rest}
              onBlur={(e) => {
                if (e.target.value) {
                  showExpiryDateDialog?.({});
                }
              }}
              format={format}
            />
          );
        }}
      />

      {isNonNullish(format) ? <FormatFormErrorMessage format={format} /> : null}
    </ProfileFormFieldInputGroup>
  );
}
