import { Center, FormControl, FormHelperText, FormLabel, HStack } from "@chakra-ui/react";
import { ShortTextFormatSelect } from "@parallel/components/common/ShortTextFormatSelect";
import { Stack, Switch } from "@parallel/components/ui";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { CreateOrUpdateProfileTypeFieldDialogFormData } from "../dialogs/CreateOrUpdateProfileTypeFieldDialog";

export function ProfileFieldShortTextSettings({ isDisabled }: { isDisabled?: boolean }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CreateOrUpdateProfileTypeFieldDialogFormData>();

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
      <FormControl as={HStack} isInvalid={!!errors.isUnique}>
        <Stack flex={1} gap={1}>
          <FormLabel margin={0}>
            <FormattedMessage
              id="component.create-or-update-property-dialog.unique"
              defaultMessage="Unique"
            />
          </FormLabel>
          <FormHelperText margin={0}>
            <FormattedMessage
              id="component.profile-field-short-text-settings.unique-description"
              defaultMessage="Ensure that the value is unique across all profiles. Example: Tax IDs, external system IDs, etc."
            />
          </FormHelperText>
        </Stack>
        <Center>
          <Switch {...register("isUnique")} />
        </Center>
      </FormControl>
    </>
  );
}
