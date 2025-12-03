import { PhoneInputLazy } from "@parallel/components/common/PhoneInputLazy";
import { Controller, useFormContext } from "react-hook-form";
import { isNonNullish } from "remeda";
import { ProfileFormData } from "../ProfileForm";
import { ProfileFormFieldProps } from "./ProfileFormField";
import {
  ProfileFormFieldInputGroup,
  ProfileFormFieldInputGroupProps,
} from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldPhoneProps
  extends ProfileFormFieldProps,
    Omit<ProfileFormFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

export function ProfileFormFieldPhone({
  field,

  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
  showBaseStyles,
}: ProfileFormFieldPhoneProps) {
  const { control, clearErrors, setError } = useFormContext<ProfileFormData>();

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
        render={({ field: { ref, onChange, value, ...rest }, fieldState }) => (
          <PhoneInputLazy
            borderColor={showBaseStyles ? undefined : "transparent"}
            value={value ?? ""}
            onChange={(value: string, { isValid }) => {
              onChange(value ?? "");
              if (isNonNullish(value) && !isValid && !fieldState.error) {
                setError(`fields.${field.id}.content.value`, { type: "validate" });
              } else if (isValid && fieldState.error) {
                clearErrors(`fields.${field.id}.content.value`);
              }
            }}
            inputRef={ref}
            {...rest}
            onBlur={(value) => {
              if (isNonNullish(value)) {
                return showExpiryDateDialog({});
              }
            }}
            isDisabled={isDisabled}
          />
        )}
      />
    </ProfileFormFieldInputGroup>
  );
}
