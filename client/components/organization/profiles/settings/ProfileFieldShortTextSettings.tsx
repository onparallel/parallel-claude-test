import { FormControl, FormLabel } from "@chakra-ui/react";
import { ShortTextFormatSelect } from "@parallel/components/common/ShortTextFormatSelect";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { CreateOrUpdateProfileTypeFieldDialogData } from "../dialogs/CreateOrUpdateProfileTypeFieldDialog";

export function ProfileFieldShortTextSettings({ isDisabled }: { isDisabled?: boolean }) {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateOrUpdateProfileTypeFieldDialogData>();

  return (
    <>
      <FormControl isInvalid={!!errors.options?.format} isDisabled={isDisabled}>
        <FormLabel fontWeight={400}>
          <FormattedMessage
            id="component.profile-field-short-text-settings.format"
            defaultMessage="Format"
          />
        </FormLabel>
        <Controller
          name="options.format"
          control={control}
          render={({ field: { onChange, value } }) => (
            <ShortTextFormatSelect onChange={onChange} value={value ?? null} />
          )}
        />
      </FormControl>
    </>
  );
}
