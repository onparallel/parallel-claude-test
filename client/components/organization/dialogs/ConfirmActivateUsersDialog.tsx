import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

function ConfirmActivateUsersDialog({ count, ...props }: DialogProps<{ count: number }>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-activate-user-dialog.activate-users"
          defaultMessage="Activate {count, plural, =1{user} other {users}}"
          values={{ count }}
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-activate-user-dialog.body"
          defaultMessage="Are you sure you want to <b>activate</b> the selected {count, plural, =1{user} other {users}}?"
          values={{ count }}
        />
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-activate-user-dialog.activate-users"
            defaultMessage="Activate {count, plural, =1{user} other {users}}"
            values={{ count }}
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmActivateUsersDialog() {
  return useDialog(ConfirmActivateUsersDialog);
}
