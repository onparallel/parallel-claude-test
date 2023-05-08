import { PhoneInputLazy } from "@parallel/components/common/PhoneInputLazy";
import { Controller, useFormContext } from "react-hook-form";
import { ProfileFieldProps } from "./ProfileField";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";
import { isDefined } from "remeda";
import { ProfilesFormData } from "@parallel/pages/app/profiles/[profileId]";

interface ProfileFieldPhoneProps extends ProfileFieldProps {}

export function ProfileFieldPhone({ index }: ProfileFieldPhoneProps) {
  const { control, setError, clearErrors } = useFormContext<ProfilesFormData>();
  return (
    <ProfileFieldInputGroup>
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
          />
        )}
      />
    </ProfileFieldInputGroup>
  );
}
