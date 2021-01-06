import { Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { FormattedMessage } from "react-intl";

function ConfirmActivateUsersDialog({
  count,
  ...props
}: DialogProps<{ count: number }>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="organization-users.activate"
          defaultMessage="Activate {count, plural, =1{user} other {users}}"
          values={{ count }}
        />
      }
      body={
        <>
          <FormattedMessage
            id="organization.confirm-activate-user-dialog.body"
            defaultMessage="Are you sure you want to <b>activate</b> the selected {count, plural, =1{user} other {users}}?"
            values={{
              b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              count,
            }}
          />
        </>
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="organization-users.activate"
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
