import { Input } from "@chakra-ui/react";
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
  register,
  expiryDate,
  showExpiryDateDialog,
  ...props
}: ProfileFieldShortTextProps) {
  return (
    <ProfileFieldInputGroup {...props} field={field} expiryDate={expiryDate}>
      <Input
        borderColor="transparent"
        maxLength={1_000}
        {...register(`fields.${index}.content.value`)}
        onBlur={(e) => {
          if (e.target.value) {
            showExpiryDateDialog({});
          }
        }}
      />
    </ProfileFieldInputGroup>
  );
}
