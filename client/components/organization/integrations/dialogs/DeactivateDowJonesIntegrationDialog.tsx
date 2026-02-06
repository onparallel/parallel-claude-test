import { Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

export function DeactivateDowJonesIntegrationDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      hasCloseButton
      header={
        <Text>
          <FormattedMessage
            id="component.deactivate-dow-jones-integration-dialog.title"
            defaultMessage="Deactivate integration"
          />
        </Text>
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.deactivate-dow-jones-integration-dialog.description-1"
              defaultMessage="If you continue, the integration with Dow Jones will be disabled and Parallel will not be able to access your Dow Jones account to perform searches."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.deactivate-dow-jones-integration-dialog.description-2"
              defaultMessage="Are you sure you want to deactivate the integration?"
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button onClick={() => props.onResolve()} colorPalette="red" variant="solid">
          <FormattedMessage id="generic.deactivate" defaultMessage="Deactivate" />
        </Button>
      }
      {...props}
    />
  );
}

export function useDeactivateDowJonesIntegrationDialog() {
  return useDialog(DeactivateDowJonesIntegrationDialog);
}
