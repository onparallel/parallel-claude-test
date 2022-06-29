import { gql } from "@apollo/client";
import { Alert, AlertIcon, Box, Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmInput } from "@parallel/components/common/ConfirmInput";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useConfirmDeleteContactsDialog_ContactFragment } from "@parallel/graphql/__types";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

function ConfirmDeleteContactsDialog({
  contacts,
  extra,
  ...props
}: DialogProps<{
  contacts: useConfirmDeleteContactsDialog_ContactFragment[];
  extra: { PENDING: number; COMPLETED: number; CLOSED: number };
}>) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    confirm: boolean;
  }>();

  return (
    <ConfirmDialog
      content={{ as: "form", onSubmit: handleSubmit(() => props.onResolve()) }}
      size="lg"
      header={
        <FormattedMessage
          id="component.confirm-delete-contacts-dialog.header"
          defaultMessage="Delete {count, plural, =1{{email}} other {# contacts}}"
          values={{ email: contacts[0].email, count: contacts.length }}
        />
      }
      body={
        <Stack spacing={2}>
          <Alert status="warning" borderRadius="md">
            <AlertIcon color="yellow.500" />
            {contacts.length === 1 ? (
              <Box>
                <FormattedMessage
                  id="component.confirm-delete-contacts-dialog.alert-single-text"
                  defaultMessage="This contact has access to:"
                />
                <Stack as="ul" paddingLeft={8} spacing={0}>
                  {extra.PENDING > 0 ? (
                    <Text as="li">
                      <FormattedMessage
                        id="component.confirm-delete-contacts-dialog.alert.pending-petitions"
                        defaultMessage="{count} pending {count, plural, =1{parallel} other{parallels}}"
                        values={{ count: extra.PENDING }}
                      />
                    </Text>
                  ) : null}
                  {extra.COMPLETED > 0 ? (
                    <Text as="li">
                      <FormattedMessage
                        id="component.confirm-delete-contacts-dialog.alert.completed-petitions"
                        defaultMessage="{count} completed {count, plural, =1{parallel} other{parallels}}"
                        values={{ count: extra.COMPLETED }}
                      />
                    </Text>
                  ) : null}
                  {extra.CLOSED > 0 ? (
                    <Text as="li">
                      <FormattedMessage
                        id="component.confirm-delete-contacts-dialog.alert.closed-petitions"
                        defaultMessage="{count} closed {count, plural, =1{parallel} other{parallels}}"
                        values={{ count: extra.CLOSED }}
                      />
                    </Text>
                  ) : null}
                </Stack>
              </Box>
            ) : (
              <FormattedMessage
                id="component.confirm-delete-contacts-dialog.alert-multiple-text"
                defaultMessage="We have found parallels sent to some of these contacts."
              />
            )}
          </Alert>
          <Text>
            <FormattedMessage
              id="component.confirm-delete-contacts-dialog.body.1"
              defaultMessage="If you continue, the {count, plural, =1{contact} other{contacts}} won't be able to access their replies anymore."
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
          <Controller
            name="confirm"
            control={control}
            rules={{ required: true }}
            render={({ field }) => <ConfirmInput {...field} isInvalid={!!errors.confirm} />}
          />
        </Stack>
      }
      confirm={
        <Button colorScheme="red" type="submit">
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
