import { NumberInput, NumberInputField } from "@chakra-ui/react";
import { ProfilesFormData } from "@parallel/pages/app/profiles/[profileId]";
import { Controller, useFormContext } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";

interface ProfileFieldNumberProps extends ProfileFieldProps {
  showExpiryDateDialog: (force?: boolean) => void;
}

export function ProfileFieldNumber({
  index,
  field,
  showExpiryDateDialog,
}: ProfileFieldNumberProps) {
  const { control } = useFormContext<ProfilesFormData>();

  return (
    <ProfileFieldInputGroup index={index} field={field}>
      <Controller
        name={`fields.${index}.content.value`}
        control={control}
        render={({ field: { value, ...rest } }) => (
          <NumberInput
            width="full"
            value={value ?? ""}
            onBlur={(e) => {
              console.log(value);
              if (value) {
                return showExpiryDateDialog();
              }
            }}
          >
            <NumberInputField borderColor="transparent" {...rest} />
          </NumberInput>
        )}
      />
    </ProfileFieldInputGroup>
  );
}
