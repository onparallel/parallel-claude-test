import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { Controller } from "react-hook-form";
import { isNonNullish } from "remeda";
import { ProfileFormFieldProps } from "./ProfileFormField";
import {
  ProfileFormFieldInputGroup,
  ProfileFormFieldInputGroupProps,
} from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldNumberProps
  extends ProfileFormFieldProps,
    Omit<ProfileFormFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

export function ProfileFormFieldNumber({
  index,
  field,
  control,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
}: ProfileFormFieldNumberProps) {
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
        render={({ field: { name, value, onChange } }) => {
          return (
            <NumeralInput
              name={name}
              borderColor="transparent"
              value={value ?? undefined}
              onChange={(value) => onChange(value ?? null)}
              onBlur={() => {
                if (isNonNullish(value)) {
                  return showExpiryDateDialog({});
                }
              }}
              isDisabled={isDisabled}
            />
          );
        }}
      />
    </ProfileFormFieldInputGroup>
  );
}
