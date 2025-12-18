import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { useFormContext } from "react-hook-form";
import { ProfileFormInnerData } from "../ProfileFormInner";
import { ProfileFormFieldProps } from "./ProfileFormField";
import {
  ProfileFormFieldInputGroup,
  ProfileFormFieldInputGroupProps,
} from "./ProfileFormFieldInputGroup";

interface ProfileFormFieldTextProps
  extends ProfileFormFieldProps,
    Omit<ProfileFormFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

export function ProfileFormFieldText({
  field,
  expiryDate,
  isDisabled,
  showExpiryDateDialog,
  showSuggestionsButton,
  areSuggestionsVisible,
  onToggleSuggestions,
  showBaseStyles,
}: ProfileFormFieldTextProps) {
  const { register } = useFormContext<ProfileFormInnerData>();
  return (
    <ProfileFormFieldInputGroup
      field={field}
      expiryDate={expiryDate}
      isDisabled={isDisabled}
      showSuggestionsButton={showSuggestionsButton}
      areSuggestionsVisible={areSuggestionsVisible}
      onToggleSuggestions={onToggleSuggestions}
    >
      <GrowingTextarea
        borderColor={showBaseStyles ? undefined : "transparent"}
        maxLength={10_000}
        {...register(`fields.${field.id}.content.value`)}
        onBlur={(e) => {
          if (e.target.value) {
            return showExpiryDateDialog({});
          }
        }}
        isDisabled={isDisabled}
      />
    </ProfileFormFieldInputGroup>
  );
}
