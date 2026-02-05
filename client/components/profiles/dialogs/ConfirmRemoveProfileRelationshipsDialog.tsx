import { Button, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import React from "react";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

export function ConfirmRemoveProfileRelationshipsDialog({
  relatedProfileName,
  profileName,
  selectedProfiles,
  ...props
}: DialogProps<{
  relatedProfileName?: React.ReactNode | null;
  profileName?: React.ReactNode | null;
  selectedProfiles?: number;
}>) {
  return (
    <ConfirmDialog
      closeOnNavigation
      header={
        <FormattedMessage
          id="component.confirm-remove-profile-relationships-dialog.header"
          defaultMessage="Remove {count, plural, =1{association} other {# associations}}"
          values={{
            count: selectedProfiles,
          }}
        />
      }
      body={
        <Stack>
          <Text>
            {selectedProfiles && selectedProfiles > 1 ? (
              <FormattedMessage
                id="component.confirm-remove-profile-relationships-dialog.body-profiles-multiple"
                defaultMessage="Are you sure you want to remove the association with the selected profiles?"
              />
            ) : (
              <FormattedMessage
                id="component.confirm-remove-profile-relationships-dialog.body"
                defaultMessage="Are you sure you want to remove the association between {profileName} and profile {relatedProfileName}?"
                values={{
                  profileName,
                  relatedProfileName,
                }}
              />
            )}
          </Text>
          <Text>
            <FormattedMessage
              id="component.confirm-remove-profile-relationships-dialog.body-2"
              defaultMessage="If you continue, the data will remain intact and only the association will be removed."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-remove-profile-relationships-dialog.confirm"
            defaultMessage="Yes, remove association"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmRemoveProfileRelationshipsDialog() {
  return useDialog(ConfirmRemoveProfileRelationshipsDialog);
}
