import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmDeassociateProfileDialog({
  petitionName,
  profileName,
  isPetition,
  ...props
}: DialogProps<{ petitionName: string; profileName: string; isPetition?: boolean }>) {
  return (
    <ConfirmDialog
      closeOnNavigation
      header={
        <FormattedMessage
          id="component.confirm-deassociate-profile-dialog.header"
          defaultMessage="Remove association"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.confirm-deassociate-profile-dialog.body"
              defaultMessage="Are you sure you want to deassoaciate <b>{profileName}</b> from parallel <b>{petitionName}</b>?"
              values={{
                profileName,
                petitionName,
              }}
            />
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
            defaultMessage="Yes, deassociate"
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
