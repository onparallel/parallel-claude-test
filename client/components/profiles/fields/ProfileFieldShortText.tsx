import { Input } from "@chakra-ui/react";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";

interface ProfileFieldShortTextProps extends ProfileFieldProps {
  showExpiryDateDialog: (force?: boolean) => void;
  expiryDate?: string | null;
}

export function ProfileFieldShortText({
  index,
  field,
  register,
  expiryDate,
  showExpiryDateDialog,
}: ProfileFieldShortTextProps) {
  return (
    <ProfileFieldInputGroup field={field} expiryDate={expiryDate}>
      <Input
        borderColor="transparent"
        maxLength={1_000}
        {...register(`fields.${index}.content.value`)}
        onBlur={(e) => {
          if (e.target.value) {
            showExpiryDateDialog();
          }
        }}
      />
    </ProfileFieldInputGroup>
  );
}
