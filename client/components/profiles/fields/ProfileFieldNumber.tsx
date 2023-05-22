import { ProfilesFormData } from "@parallel/pages/app/profiles/[profileId]";
import { Controller, useFormContext } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";
import { NumeralInput } from "@parallel/components/common/NumeralInput";

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
        render={({ field: { value, onChange, ...rest } }) => {
          return (
            <NumeralInput
              {...rest}
              borderColor="transparent"
              value={value.length ? value : undefined}
              onChange={(value) => {
                onChange(value?.toString() ?? "");
              }}
              onBlur={() => {
                if (value) {
                  return showExpiryDateDialog();
                }
              }}
            />
          );
        }}
      />
    </ProfileFieldInputGroup>
  );
}
