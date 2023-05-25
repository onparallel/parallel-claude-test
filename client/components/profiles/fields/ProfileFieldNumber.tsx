import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { Controller } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";

interface ProfileFieldNumberProps extends ProfileFieldProps {
  showExpiryDateDialog: (force?: boolean) => void;
  expiryDate?: string | null;
}

export function ProfileFieldNumber({
  index,
  field,
  control,
  expiryDate,
  showExpiryDateDialog,
}: ProfileFieldNumberProps) {
  return (
    <ProfileFieldInputGroup field={field} expiryDate={expiryDate}>
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
