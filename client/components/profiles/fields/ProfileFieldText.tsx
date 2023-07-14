import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup, ProfileFieldInputGroupProps } from "./ProfileFieldInputGroup";

interface ProfileFieldTextProps
  extends ProfileFieldProps,
    Omit<ProfileFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

export function ProfileFieldText({
  index,
  field,
  register,
  expiryDate,
  showExpiryDateDialog,
  ...props
}: ProfileFieldTextProps) {
  return (
    <ProfileFieldInputGroup {...props} field={field} expiryDate={expiryDate}>
      <GrowingTextarea
        borderColor="transparent"
        maxLength={10_000}
        {...register(`fields.${index}.content.value`)}
        onBlur={(e) => {
          if (e.target.value) {
            return showExpiryDateDialog({});
          }
        }}
      />
    </ProfileFieldInputGroup>
  );
}
