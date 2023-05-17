import { Input } from "@chakra-ui/react";
import { ProfilesFormData } from "@parallel/pages/app/profiles/[profileId]";
import { useFormContext } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";

interface ProfileFieldShortTextProps extends ProfileFieldProps {
  showExpiryDateDialog: (force?: boolean) => void;
}

export function ProfileFieldShortText({
  index,
  field,
  showExpiryDateDialog,
}: ProfileFieldShortTextProps) {
  const { register } = useFormContext<ProfilesFormData>();
  return (
    <ProfileFieldInputGroup index={index} field={field}>
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
