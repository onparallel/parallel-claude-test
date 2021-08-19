import { Button, Input, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/DialogProvider";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function DeleteAccessTokenDialog({
  selectedCount,
  ...props
}: DialogProps & { selectedCount: number }) {
  const intl = useIntl();
  const confirmation = intl
    .formatMessage({
      id: "generic.delete",
      defaultMessage: "Delete",
    })
    .toLocaleLowerCase(intl.locale);
  const [value, setValue] = useState("");
  return (
    <ConfirmDialog
      content={{
        as: "form",
        onSubmit: () => props.onResolve(),
      }}
      header={
        <FormattedMessage
          id="component.delete-access-token-dialog.header"
          defaultMessage="Revoke access {count, plural, =1 {token} other {tokens}}"
          values={{ count: selectedCount }}
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.delete-access-token-dialog.body"
              defaultMessage="Are you sure you want to delete the {count, plural, =1 {selected access token} other {# selected access tokens}}?"
              values={{ count: selectedCount }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="settings.api-tokens.confirm-delete-tokens-dialog.warning"
              defaultMessage="Any applications or scripts using this {count, plural, =1 {token} other {tokens}} will no longer be able to access the Parallel API. This action <b>cannot be undone</b>."
              values={{ count: selectedCount }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="generic.type-to-confirm"
              defaultMessage="Please type {confirmation} to confirm"
              values={{
                confirmation: <Text as="strong">{confirmation}</Text>,
              }}
            />
          </Text>
          <Input
            aria-label={intl.formatMessage(
              {
                id: "generic.type-to-confirm",
                defaultMessage: "Please type {confirmation} to confirm",
              },
              { confirmation }
            )}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Stack>
      }
      confirm={
        <Button colorScheme="red" isDisabled={confirmation !== value} type="submit">
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
        </Button>
      }
      {...props}
    />
  );
}

export function useDeleteAccessTokenDialog() {
  return useDialog(DeleteAccessTokenDialog);
}
