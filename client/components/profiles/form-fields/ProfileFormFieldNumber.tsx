import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { Controller, useFormContext } from "react-hook-form";
import { isNonNullish } from "remeda";
import { ProfileFormData } from "../ProfileForm";
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
  field,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
  showBaseStyles,
}: ProfileFormFieldNumberProps) {
  const { control } = useFormContext<ProfileFormData>();
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
        render={({ field: { name, value, onChange } }) => {
          return (
            <NumeralInput
              name={name}
              borderColor={showBaseStyles ? undefined : "transparent"}
              value={value}
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
