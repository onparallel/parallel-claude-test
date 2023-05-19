import { PhoneInputLazy } from "@parallel/components/common/PhoneInputLazy";
import { ProfilesFormData } from "@parallel/pages/app/profiles/[profileId]";
import { Controller, useFormContext } from "react-hook-form";
import { isDefined } from "remeda";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";

interface ProfileFieldPhoneProps extends ProfileFieldProps {
  showExpiryDateDialog: (force?: boolean) => void;
}

export function ProfileFieldPhone({ index, field, showExpiryDateDialog }: ProfileFieldPhoneProps) {
  const { control, setError, clearErrors } = useFormContext<ProfilesFormData>();

  return (
    <ProfileFieldInputGroup index={index} field={field}>
      <Controller
        name={`fields.${index}.content.value`}
        control={control}
        render={({ field: { ref, onChange, value, ...rest } }) => (
          <PhoneInputLazy
            borderColor="transparent"
            value={value ?? ""}
            onChange={(value: string, { isValid }) => {
              onChange(value ?? "");

              if (isDefined(value) && !isValid) {
                setError(`fields.${index}.content.value`, { type: "validate" });
              } else {
                clearErrors(`fields.${index}.content.value`);
              }
            }}
            inputRef={ref}
            {...rest}
            onBlur={(value) => {
              if (value) {
                return showExpiryDateDialog();
              }
            }}
          />
        )}
      />
    </ProfileFieldInputGroup>
  );
}
