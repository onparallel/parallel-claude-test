import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmDeassociateProfileDialog({
  petitionName,
  profileName,
  selectedPetitions,
  selectedProfiles,
  ...props
}: DialogProps<{
  petitionName?: string | null;
  profileName?: string | null;
  selectedPetitions?: number;
  selectedProfiles?: number;
}>) {
  return (
    <ConfirmDialog
      closeOnNavigation
      header={
        <FormattedMessage
          id="component.confirm-deassociate-profile-dialog.header"
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
                id="component.confirm-deassociate-profile-dialog.body-parallels-multiple"
                defaultMessage="Are you sure you want to remove the association with the selected parallels?"
              />
            ) : selectedProfiles && selectedProfiles > 1 ? (
              <FormattedMessage
                id="component.confirm-deassociate-profile-dialog.body-profiles-multiple"
                defaultMessage="Are you sure you want to remove the association with the selected profiles?"
              />
            ) : (
              <FormattedMessage
                id="component.confirm-deassociate-profile-dialog.body"
                defaultMessage="Are you sure you want to remove the association between {profileName} and parallel {petitionName}?"
                values={{
                  profileName: profileName ? (
                    <Text as="strong">{profileName}</Text>
                  ) : (
                    <Text as="span" textStyle="hint">
                      <FormattedMessage
                        id="generic.unnamed-profile"
                        defaultMessage="Unnamed profile"
                      />
                    </Text>
                  ),
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
              id="component.confirm-deassociate-profile-dialog.body-2"
              defaultMessage="If you continue, the data will remain intact and only the association will be removed."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-deassociate-profile-dialog.confirm"
            defaultMessage="Yes, remove association"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDeassociateProfileDialog() {
  return useDialog(ConfirmDeassociateProfileDialog);
}
