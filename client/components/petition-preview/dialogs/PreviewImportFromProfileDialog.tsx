import { Button, FormControl, FormErrorMessage, FormLabel, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ProfileSelect, ProfileSelectInstance } from "@parallel/components/common/ProfileSelect";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface PreviewImportFromProfileDialogData {
  profileId: string | null;
}

export function PreviewImportFromProfileDialog({
  profileTypeId,
  ...props
}: DialogProps<{ profileTypeId: string }, string>) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PreviewImportFromProfileDialogData>({
    defaultValues: { profileId: null },
  });

  const selectRef = useRef<ProfileSelectInstance<false>>(null);
  return (
    <ConfirmDialog
      initialFocusRef={selectRef}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(({ profileId }) => props.onResolve(profileId!)),
        },
      }}
      {...props}
      header={
        <FormattedMessage
          id="component.preview-import-from-profile-dialog.header"
          defaultMessage="Import from profile"
        />
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.profileId}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.preview-import-from-profile-dialog.select-profile-label"
                defaultMessage="Select a profile to import the information from"
              />
            </FormLabel>
            <Controller
              name="profileId"
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <ProfileSelect
                  ref={selectRef}
                  defaultOptions
                  value={value}
                  onChange={(v) => onChange(v?.id ?? null)}
                  profileTypeId={profileTypeId}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.preview-import-from-profile-dialog.profile-error"
                defaultMessage="Please, select a profile"
              />
            </FormErrorMessage>
          </FormControl>
          <Text fontStyle="italic">
            <FormattedMessage
              id="component.preview-import-from-profile-dialog.body"
              defaultMessage="All replies to linked fields will be overwritten."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.import" defaultMessage="Import" />
        </Button>
      }
      {...props}
    />
  );
}

export function usePreviewImportFromProfileDialog() {
  return useDialog(PreviewImportFromProfileDialog);
}
