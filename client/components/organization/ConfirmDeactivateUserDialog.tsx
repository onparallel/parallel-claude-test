import { Box, Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { AppLayout_UserFragment } from "@parallel/graphql/__types";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import {
  UserSelectInstance,
  UserSelectSelection,
  UserSingleSelect,
} from "../common/UserSelect";

function ConfirmDeactivateUserDialog({
  selected,
  me,
  ...props
}: DialogProps<
  { selected: string[]; me: AppLayout_UserFragment },
  UserSelectSelection
>) {
  const intl = useIntl();

  const { control, handleSubmit } = useForm<{ user: UserSelectSelection }>({
    mode: "onChange",
  });

  const userSelectRef = useRef<UserSelectInstance<false>>(null);

  const [hasSelection, setHasSelection] = useState(false);

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, exclude: string[]) => {
      return await _handleSearchUsers(search, [...exclude, ...selected]);
    },
    [_handleSearchUsers]
  );

  return (
    <ConfirmDialog
      size="lg"
      initialFocusRef={userSelectRef}
      content={{
        as: "form",
        onSubmit: handleSubmit(({ user }) => {
          props.onResolve(user);
        }),
      }}
      header={
        <FormattedMessage
          id="organization-users.deactivate"
          defaultMessage="Deactivate {count, plural, =1{user} other {users}}"
          values={{ count: selected.length }}
        />
      }
      body={
        <>
          <FormattedMessage
            id="organization.confirm-deactivate-user-dialog.body"
            defaultMessage="Are you sure you want to <b>deactivate</b> the selected {count, plural, =1{user} other {users}}?"
            values={{
              b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              count: selected.length,
            }}
          />
          <br />
          <FormattedMessage
            id="organization.confirm-deactivate-user-dialog.body-2"
            defaultMessage="Inactive users won't be able to login or use Parallel in any way."
            values={{
              b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
            }}
          />
          <br />
          <br />
          <FormattedMessage
            id="organization.confirm-deactivate-user-dialog.transfer-to-user"
            defaultMessage="To continue, you must select a user from your organization to transfer all the petitions of the {count, plural, =1{user} other {users}} to deactivate."
            values={{
              b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              count: selected.length,
            }}
          />
          <Box flex="1" marginTop={2}>
            <Controller
              name="user"
              control={control}
              rules={{ required: true }}
              render={({ onChange, onBlur, value }) => (
                <UserSingleSelect
                  ref={userSelectRef}
                  value={value}
                  onChange={(user: UserSelectSelection) => {
                    onChange(user);
                    setHasSelection(true);
                  }}
                  onBlur={onBlur}
                  onSearchUsers={handleSearchUsers}
                  placeholder={intl.formatMessage({
                    id:
                      "organization.confirm-deactivate.user-select.input-placeholder",
                    defaultMessage: "Select a user from your organization",
                  })}
                />
              )}
            />
          </Box>
        </>
      }
      confirm={
        <Button type="submit" colorScheme="red" disabled={!hasSelection}>
          <FormattedMessage
            id="petition.confirm-deactivate-users.confirm"
            defaultMessage="Deactivate and transfer petitions"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDeactivateUserDialog() {
  return useDialog(ConfirmDeactivateUserDialog);
}
