import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmReopenPetitionDialog(props: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <Text>
          <FormattedMessage id="petition.reopen.dialog-heading" defaultMessage="Reopen petition?" />
        </Text>
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="petition.reopen.dialog-subheading"
              defaultMessage="You are about to reopen the petition and it will be registered internally. You can always close it again manually."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve()}>
          <FormattedMessage id="petition.reopen.confirm" defaultMessage="Yes, reopen" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmReopenPetitionDialog() {
  return useDialog(ConfirmReopenPetitionDialog);
}
