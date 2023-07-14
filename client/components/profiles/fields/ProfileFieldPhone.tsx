import { PhoneInputLazy } from "@parallel/components/common/PhoneInputLazy";
import { Controller } from "react-hook-form";
import { isDefined } from "remeda";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup, ProfileFieldInputGroupProps } from "./ProfileFieldInputGroup";

interface ProfileFieldPhoneProps
  extends ProfileFieldProps,
    Omit<ProfileFieldInputGroupProps, "field"> {
  showExpiryDateDialog: (props: { force?: boolean; isDirty?: boolean }) => void;
}

export function ProfileFieldPhone({
  index,
  field,
  control,
  clearErrors,
  setError,
  expiryDate,
  showExpiryDateDialog,
  ...props
}: ProfileFieldPhoneProps) {
  return (
    <ProfileFieldInputGroup {...props} field={field} expiryDate={expiryDate}>
      <Controller
        name={`fields.${index}.content.value`}
        control={control}
        render={({ field: { ref, onChange, value, ...rest }, fieldState }) => (
          <PhoneInputLazy
            borderColor="transparent"
            value={value ?? ""}
            onChange={(value: string, { isValid }) => {
              onChange(value ?? "");
              if (isDefined(value) && !isValid && !fieldState.error) {
                setError(`fields.${index}.content.value`, { type: "validate" });
              } else if (isValid && fieldState.error) {
                clearErrors(`fields.${index}.content.value`);
              }
            }}
            inputRef={ref}
            {...rest}
            onBlur={(value) => {
              if (value) {
                return showExpiryDateDialog({});
              }
            }}
          />
        )}
      />
    </ProfileFieldInputGroup>
  );
}
