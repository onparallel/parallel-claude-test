import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { ProfilesFormData } from "@parallel/pages/app/profiles/[profileId]";
import { useFormContext } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";

interface ProfileFieldTextProps extends ProfileFieldProps {
  showExpiryDateDialog: (force?: boolean) => void;
}

export function ProfileFieldText({ index, field, showExpiryDateDialog }: ProfileFieldTextProps) {
  const { register } = useFormContext<ProfilesFormData>();

  return (
    <ProfileFieldInputGroup index={index} field={field}>
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
