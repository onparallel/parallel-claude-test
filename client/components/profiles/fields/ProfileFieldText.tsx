import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { useFormContext } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";
import { ProfilesFormData } from "@parallel/pages/app/profiles/[profileId]";

interface ProfileFieldTextProps extends ProfileFieldProps {}

export function ProfileFieldText({ index }: ProfileFieldTextProps) {
  const { register } = useFormContext<ProfilesFormData>();
  return (
    <ProfileFieldInputGroup>
      <GrowingTextarea
        borderColor="transparent"
        maxLength={10_000}
        {...register(`fields.${index}.content.value`)}
      />
    </ProfileFieldInputGroup>
  );
}
