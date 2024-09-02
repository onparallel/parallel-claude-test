import { PhoneInputLazy } from "@parallel/components/common/PhoneInputLazy";
import { Controller } from "react-hook-form";
import { isNonNullish } from "remeda";
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
  index,
  field,
  control,
  clearErrors,
  setError,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
}: ProfileFormFieldPhoneProps) {
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
        name={`fields.${index}.content.value`}
        control={control}
        render={({ field: { ref, onChange, value, ...rest }, fieldState }) => (
          <PhoneInputLazy
            borderColor="transparent"
            value={value ?? ""}
            onChange={(value: string, { isValid }) => {
              onChange(value ?? "");
              if (isNonNullish(value) && !isValid && !fieldState.error) {
                setError(`fields.${index}.content.value`, { type: "validate" });
              } else if (isValid && fieldState.error) {
                clearErrors(`fields.${index}.content.value`);
              }
            }}
            inputRef={ref}
            {...rest}
            onBlur={(value) => {
              if (value) {
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
