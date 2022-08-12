import { gql } from "@apollo/client";
import { Button } from "@chakra-ui/react";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ConfirmDeactivateAccessDialog_PetitionAccessFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";

export function ConfirmDeactivateAccessDialog({
  access,
  ...props
}: DialogProps<{ access: ConfirmDeactivateAccessDialog_PetitionAccessFragment }>) {
  return (
    <ConfirmDialog
      closeOnNavigation
      header={
        <FormattedMessage
          id="component.confirm-deactivate-access-dialog.header"
          defaultMessage="Remove contact access"
        />
      }
      body={
        isDefined(access.contact) ? (
          <FormattedMessage
            id="component.confirm-deactivate-access-dialog.body"
            defaultMessage="Are you sure you want to <b>remove access</b> to {contact}?"
            values={{ contact: <ContactReference contact={access.contact} /> }}
          />
        ) : (
          <FormattedMessage
            id="component.confirm-deactivate-access-dialog.body-contactless-access"
            defaultMessage="Are you sure you want to deactivate the link access?"
          />
        )
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-deactivate-access-dialog.confirm"
            defaultMessage="Yes, remove access"
          />
        </Button>
      }
      {...props}
    />
  );
}

ConfirmDeactivateAccessDialog.fragments = {
  PetitionAccess: gql`
    fragment ConfirmDeactivateAccessDialog_PetitionAccess on PetitionAccess {
      contact {
        ...ContactReference_Contact
      }
    }
    ${ContactReference.fragments.Contact}
  `,
};

export function useConfirmDeactivateAccessDialog() {
  return useDialog(ConfirmDeactivateAccessDialog);
}
