import { gql } from "@apollo/client";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button } from "@parallel/components/ui";
import { ConfirmReactivateAccessDialog_PetitionAccessFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";

export function ConfirmReactivateAccessDialog({
  access,
  ...props
}: DialogProps<{ access: ConfirmReactivateAccessDialog_PetitionAccessFragment }>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-reactivate-access-dialog.header"
          defaultMessage="Reactivate contact access"
        />
      }
      body={
        isNonNullish(access.contact) ? (
          <FormattedMessage
            id="component.confirm-reactivate-access-dialog.body"
            defaultMessage="Are you sure you want to <b>reactivate access</b> to {contact}?"
            values={{ contact: <ContactReference contact={access.contact} /> }}
          />
        ) : (
          <FormattedMessage
            id="component.confirm-reactivate-access-dialog.body-contactless-access"
            defaultMessage="Are you sure you want to reactivate the link access?"
          />
        )
      }
      confirm={
        <Button colorPalette="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-reactivate-access-dialog.confirm"
            defaultMessage="Yes, activate access"
          />
        </Button>
      }
      {...props}
    />
  );
}

const _fragments = {
  PetitionAccess: gql`
    fragment ConfirmReactivateAccessDialog_PetitionAccess on PetitionAccess {
      contact {
        ...ContactReference_Contact
      }
    }
  `,
};

export function useConfirmReactivateAccessDialog() {
  return useDialog(ConfirmReactivateAccessDialog);
}
