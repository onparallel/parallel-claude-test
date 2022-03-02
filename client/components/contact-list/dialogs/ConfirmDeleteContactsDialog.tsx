import { gql } from "@apollo/client";
import { Alert, AlertIcon, Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useConfirmDeleteContactsDialog_ContactFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

function ConfirmDeleteContactsDialog({
  contacts,
  extra,
  ...props
}: DialogProps<{
  contacts: useConfirmDeleteContactsDialog_ContactFragment[];
  extra: { PENDING: number; COMPLETED: number; CLOSED: number };
}>) {
  const intl = useIntl();
  return (
    <ConfirmDialog
      size="lg"
      header={
        <FormattedMessage
          id="component.confirm-delete-contacts-dialog.header"
          defaultMessage="Delete {count, plural, =1{{email}} other {# contacts}}"
          values={{ email: contacts[0].email, count: contacts.length }}
        />
      }
      body={
        <Stack spacing={4}>
          <Alert status="warning" borderRadius="md">
            <AlertIcon color="yellow.500" />
            {contacts.length === 1 ? (
              <FormattedMessage
                id="component.confirm-delete-contacts-dialog.alert.single.text"
                defaultMessage="We have found: {petitionsCount} with this contact."
                values={{
                  petitionsCount: intl.formatList(
                    [
                      extra.PENDING > 0
                        ? intl.formatMessage(
                            {
                              id: "component.confirm-delete-contacts-dialog.alert.pending-petitions",
                              defaultMessage:
                                "{count} pending {count, plural, =1{petition} other{petitions}}",
                            },
                            { count: extra.PENDING }
                          )
                        : null,
                      extra.COMPLETED > 0
                        ? intl.formatMessage(
                            {
                              id: "component.confirm-delete-contacts-dialog.alert.completed-petitions",
                              defaultMessage:
                                "{count} completed {count, plural, =1{petition} other{petitions}}",
                            },
                            { count: extra.COMPLETED }
                          )
                        : null,
                      extra.CLOSED > 0
                        ? intl.formatMessage(
                            {
                              id: "component.confirm-delete-contacts-dialog.alert.closed-petitions",
                              defaultMessage:
                                "{count} closed {count, plural, =1{petition} other{petitions}}",
                            },
                            { count: extra.CLOSED }
                          )
                        : null,
                    ].filter(isDefined)
                  ),
                }}
              />
            ) : (
              <FormattedMessage
                id="component.confirm-delete-contacts-dialog.alert.multiple.text"
                defaultMessage="There are petitions sent to at least one of these contacts."
              />
            )}
          </Alert>
          <Text>
            <FormattedMessage
              id="component.confirm-delete-contacts-dialog.body.1"
              defaultMessage="If you continue, the {count, plural, =1{contact} other{contacts}} will be removed from the organization and will no longer be able to access any of them."
              values={{ count: contacts.length }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.confirm-delete-contacts-dialog.body.2"
              defaultMessage="Are you sure you want to delete {count, plural, =1{<b>{fullName} <{email}></b>} other{these contacts}}?"
              values={{
                count: contacts.length,
                fullName: contacts[0].fullName,
                email: contacts[0].email,
              }}
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-delete-contacts-dialog.delete-button"
            defaultMessage="Yes, delete {count, plural, =1{contact} other {contacts}}"
            values={{ count: contacts.length }}
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDeleteContactsDialog() {
  return useDialog(ConfirmDeleteContactsDialog);
}

useConfirmDeleteContactsDialog.fragments = {
  Contact: gql`
    fragment useConfirmDeleteContactsDialog_Contact on Contact {
      fullName
      email
    }
  `,
};
