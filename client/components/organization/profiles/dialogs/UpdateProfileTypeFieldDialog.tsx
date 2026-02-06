import { gql } from "@apollo/client";
import {
  Box,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Stack,
} from "@chakra-ui/react";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button } from "@parallel/components/ui";
import { useUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment } from "@parallel/graphql/__types";
import {
  ExpirationOption,
  durationToExpiration,
  useExpirationOptions,
} from "@parallel/utils/useExpirationOptions";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { unique } from "remeda";

interface UpdateProfileTypeFieldDialogProps {
  fields: useUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment[];
}

function UpdateProfileTypeFieldDialog({
  fields,
  ...props
}: DialogProps<
  UpdateProfileTypeFieldDialogProps,
  { isExpirable: boolean; expiryAlertAheadTime: ExpirationOption }
>) {
  const uniqueExpiryAlertAheadTimes = unique(
    fields.map((f) =>
      f.isExpirable && f.expiryAlertAheadTime === null
        ? "DO_NOT_REMIND"
        : f.expiryAlertAheadTime
          ? durationToExpiration(f.expiryAlertAheadTime)
          : null,
    ),
  );

  const {
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<{
    isExpirable: boolean | null;
    expiryAlertAheadTime: ExpirationOption | null;
  }>({
    defaultValues: {
      isExpirable: fields.every((f) => f.isExpirable)
        ? true
        : fields.some((f) => f.isExpirable)
          ? null
          : false,
      expiryAlertAheadTime:
        uniqueExpiryAlertAheadTimes.length === 1 ? uniqueExpiryAlertAheadTimes[0] : undefined,
    },
  });

  const _isExpirable = watch("isExpirable");

  const expirationOptions = useExpirationOptions();

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((data) => {
            props.onResolve({
              isExpirable: data.isExpirable!,
              expiryAlertAheadTime: data.expiryAlertAheadTime!,
            });
          }),
        },
      }}
      header={
        <FormattedMessage
          id="component.update-profile-type-field-dialog.title"
          defaultMessage="Edit {count} properties"
          values={{
            count: fields.length,
          }}
        />
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.isExpirable}>
            <HStack>
              <Stack as={FormLabel} spacing={1} margin={0}>
                <Box>
                  <FormattedMessage
                    id="component.update-profile-type-field-dialog.is-expirable-label"
                    defaultMessage="Expiration"
                  />
                </Box>
                <Box color="gray.600" fontSize="sm" fontWeight="normal">
                  <FormattedMessage
                    id="component.update-profile-type-field-dialog.is-expirable-description"
                    defaultMessage="Select if these properties have an expiration date (e.g., passports and contracts)."
                  />
                </Box>
              </Stack>
              <Controller
                name="isExpirable"
                control={control}
                rules={{ required: _isExpirable === null ? true : false }}
                render={({ field: { value, onChange } }) => {
                  return (
                    <Checkbox
                      size="lg"
                      isChecked={value === true}
                      isIndeterminate={value === null}
                      onChange={onChange}
                    />
                  );
                }}
              />
            </HStack>
            <FormErrorMessage>
              <FormattedMessage id="generic.required-field" defaultMessage="Required field" />
            </FormErrorMessage>
          </FormControl>
          {_isExpirable !== false ? (
            <FormControl isInvalid={!!errors.expiryAlertAheadTime}>
              <HStack spacing={4}>
                <FormLabel fontSize="sm" whiteSpace="nowrap" fontWeight="normal" margin={0}>
                  <FormattedMessage
                    id="component.create-or-update-property-dialog.expiry-alert-ahead-time-label"
                    defaultMessage="Remind on:"
                  />
                </FormLabel>
                <Box width="100%">
                  <Controller
                    name="expiryAlertAheadTime"
                    control={control}
                    rules={{ required: _isExpirable ? true : false }}
                    render={({ field: { value, onChange, ref } }) => (
                      <SimpleSelect
                        ref={ref}
                        size="sm"
                        value={value}
                        options={expirationOptions}
                        placeholder="-"
                        onChange={(value) => {
                          onChange(value);
                          setValue("isExpirable", true);
                        }}
                      />
                    )}
                  />
                </Box>
              </HStack>
              <FormErrorMessage>
                <FormattedMessage id="generic.required-field" defaultMessage="Required field" />
              </FormErrorMessage>
            </FormControl>
          ) : null}
        </Stack>
      }
      confirm={
        <Button colorPalette="primary" type="submit">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

const _fragments = {
  ProfileTypeField: gql`
    fragment useUpdateProfileTypeFieldDialog_ProfileTypeField on ProfileTypeField {
      id
      isExpirable
      expiryAlertAheadTime
    }
  `,
};

export function useUpdateProfileTypeFieldDialog() {
  return useDialog(UpdateProfileTypeFieldDialog);
}
