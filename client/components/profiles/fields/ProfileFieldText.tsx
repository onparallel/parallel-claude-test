import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";

interface ProfileFieldTextProps extends ProfileFieldProps {
  showExpiryDateDialog: (force?: boolean) => void;
  expiryDate?: string | null;
}

export function ProfileFieldText({
  index,
  field,
  register,
  expiryDate,
  showExpiryDateDialog,
}: ProfileFieldTextProps) {
  return (
    <ProfileFieldInputGroup field={field} expiryDate={expiryDate}>
      <GrowingTextarea
        borderColor="transparent"
        maxLength={10_000}
        {...register(`fields.${index}.content.value`)}
        onBlur={(e) => {
          if (e.target.value) {
            return showExpiryDateDialog();
          }
        }}
      />
    </ProfileFieldInputGroup>
  );
}
