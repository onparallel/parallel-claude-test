import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { Controller } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup, ProfileFieldInputGroupProps } from "./ProfileFieldInputGroup";

interface ProfileFieldNumberProps
  extends ProfileFieldProps,
    Omit<ProfileFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

export function ProfileFieldNumber({
  index,
  field,
  control,
  expiryDate,
  showExpiryDateDialog,
  ...props
}: ProfileFieldNumberProps) {
  return (
    <ProfileFieldInputGroup {...props} field={field} expiryDate={expiryDate}>
      <Controller
        name={`fields.${index}.content.value`}
        control={control}
        render={({ field: { name, value, onChange } }) => {
          return (
            <NumeralInput
              name={name}
              borderColor="transparent"
              value={value || undefined}
              onChange={(value) => {
                onChange(value?.toString() ?? "");
              }}
              onBlur={() => {
                if (value) {
                  return showExpiryDateDialog({});
                }
              }}
            />
          );
        }}
      />
    </ProfileFieldInputGroup>
  );
}
