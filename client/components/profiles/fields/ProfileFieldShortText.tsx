import { FormatFormErrorMessage, ShortTextInput } from "@parallel/components/common/ShortTextInput";
import { useShortTextFormats } from "@parallel/utils/useShortTextFormats";
import { Controller } from "react-hook-form";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup, ProfileFieldInputGroupProps } from "./ProfileFieldInputGroup";

interface ProfileFieldShortTextProps
  extends ProfileFieldProps,
    Omit<ProfileFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

export function ProfileFieldShortText({
  index,
  field,
  control,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
}: ProfileFieldShortTextProps) {
  const intl = useIntl();
  const formats = useShortTextFormats();
  const format = isNonNullish(field.options.format)
    ? formats.find((f) => f.value === field.options.format)
    : null;

  return (
    <ProfileFieldInputGroup
      field={field}
      expiryDate={expiryDate}
      isDisabled={isDisabled}
      showSuggestionsButton={showSuggestionsButton}
      areSuggestionsVisible={areSuggestionsVisible}
      onToggleSuggestions={onToggleSuggestions}
    >
      <Controller
        name={`fields.${index}.content.value`}
        control={control}
        rules={{
          validate: (value) => {
            return isNonNullish(format) && value?.length
              ? (format.validate?.(value) ?? true)
              : true;
          },
        }}
        render={({ field: { onChange, value, ...rest } }) => {
          return (
            <ShortTextInput
              value={value ?? ""}
              borderColor="transparent"
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
                  showExpiryDateDialog({});
                }
              }}
              format={format}
            />
          );
        }}
      />

      {isNonNullish(format) ? <FormatFormErrorMessage format={format} /> : null}
    </ProfileFieldInputGroup>
  );
}
