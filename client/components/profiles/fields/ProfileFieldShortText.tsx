import { Input } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";
import { ProfilesFormData } from "@parallel/pages/app/profiles/[profileId]";

interface ProfileFieldShortTextProps extends ProfileFieldProps {}

export function ProfileFieldShortText({ index }: ProfileFieldShortTextProps) {
  const { register } = useFormContext<ProfilesFormData>();
  return (
    <ProfileFieldInputGroup>
      <Input
        borderColor="transparent"
        maxLength={1_000}
        {...register(`fields.${index}.content.value`)}
      />
    </ProfileFieldInputGroup>
  );
}
