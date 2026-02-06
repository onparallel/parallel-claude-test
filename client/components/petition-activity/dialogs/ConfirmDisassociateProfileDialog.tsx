import { Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

export function ConfirmDisassociateProfileDialog({
  petitionName,
  profileName,
  selectedPetitions,
  selectedProfiles,
  ...props
}: DialogProps<{
  petitionName?: string | null;
  profileName?: React.ReactNode | null;
  selectedPetitions?: number;
  selectedProfiles?: number;
}>) {
  return (
    <ConfirmDialog
      closeOnNavigation
      header={
        <FormattedMessage
          id="component.confirm-disassociate-profile-dialog.header"
          defaultMessage="Remove {count, plural, =1{association} other {# associations}}"
          values={{
            count: selectedPetitions || selectedProfiles,
          }}
        />
      }
      body={
        <Stack>
          <Text>
            {selectedPetitions && selectedPetitions > 1 ? (
              <FormattedMessage
                id="component.confirm-disassociate-profile-dialog.body-parallels-multiple"
                defaultMessage="Are you sure you want to remove the association with the selected parallels?"
              />
            ) : selectedProfiles && selectedProfiles > 1 ? (
              <FormattedMessage
                id="component.confirm-disassociate-profile-dialog.body-profiles-multiple"
                defaultMessage="Are you sure you want to remove the association with the selected profiles?"
              />
            ) : (
              <FormattedMessage
                id="component.confirm-disassociate-profile-dialog.body"
                defaultMessage="Are you sure you want to remove the association between <b>{profileName}</b> and parallel {petitionName}?"
                values={{
                  profileName,
                  petitionName: petitionName ? (
                    <Text as="strong">{petitionName}</Text>
                  ) : (
                    <Text as="span" textStyle="hint">
                      <FormattedMessage
                        id="generic.unnamed-parallel"
                        defaultMessage="Unnamed parallel"
                      />
                    </Text>
                  ),
                }}
              />
            )}
          </Text>
          <Text>
            <FormattedMessage
              id="component.confirm-disassociate-profile-dialog.body-2"
              defaultMessage="If you continue, the data will remain intact and only the association will be removed."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorPalette="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-disassociate-profile-dialog.confirm"
            defaultMessage="Yes, remove association"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDisassociateProfileDialog() {
  return useDialog(ConfirmDisassociateProfileDialog);
}
