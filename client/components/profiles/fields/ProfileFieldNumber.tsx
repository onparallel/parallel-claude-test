import { NumberInput, NumberInputField } from "@chakra-ui/react";
import { Controller, useFormContext } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";
import { ProfilesFormData } from "@parallel/pages/app/profiles/[profileId]";

interface ProfileFieldNumberProps extends ProfileFieldProps {}

export function ProfileFieldNumber({ index }: ProfileFieldNumberProps) {
  const { control } = useFormContext<ProfilesFormData>();
  return (
    <ProfileFieldInputGroup>
      <Controller
        name={`fields.${index}.content.value`}
        control={control}
        render={({ field: { value, ...rest } }) => (
          <NumberInput width="full" value={value ?? ""}>
            <NumberInputField borderColor="transparent" {...rest} />
          </NumberInput>
        )}
      />
    </ProfileFieldInputGroup>
  );
}
