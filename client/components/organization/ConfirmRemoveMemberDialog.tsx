import { Button, Stack, Text } from "@chakra-ui/react";
import { UserXIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/DialogProvider";
import { OrganizationGroup_UserGroupMemberFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { UserSelectSelection } from "../common/UserSelect";

function ConfirmRemoveMemberDialog({
  selected,
  ...props
}: DialogProps<{ selected: OrganizationGroup_UserGroupMemberFragment[] }, UserSelectSelection>) {
  return (
    <ConfirmDialog
      hasCloseButton
      size="lg"
      content={{
        as: "form",
        onSubmit: () => {
          props.onResolve();
        },
      }}
      header={
        <Stack direction={"row"} spacing={2} align="center">
          <UserXIcon role="presentation" />
          <Text>
            <FormattedMessage
              id="component.confirm-remove-member-dialog.title"
              defaultMessage="Remove from group"
            />
          </Text>
        </Stack>
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.confirm-remove-member-dialog.body"
              defaultMessage="Are you sure you want to <b>remove</b> {count, plural, =1{{fullName}} other {the selected members}} from the group? If you continue, {count, plural, =1{he} other {they}} will lose access to petitions shared with the group."
              values={{
                count: selected.length,
                fullName: selected[0].user.fullName,
              }}
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="red">
          <FormattedMessage
            id="component.confirm-remove-member-dialog.confirm"
            defaultMessage="Yes, remove from group"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmRemoveMemberDialog() {
  return useDialog(ConfirmRemoveMemberDialog);
}
