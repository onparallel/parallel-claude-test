import { Button, FormControl, FormErrorMessage, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
  useSearchUsers,
} from "@parallel/components/common/UserSelect";
import { AppLayout_UserFragment } from "@parallel/graphql/__types";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

function ConfirmDeactivateUserDialog({
  selected,
  me,
  ...props
}: DialogProps<{ selected: string[]; me: AppLayout_UserFragment }, UserSelectSelection>) {
  const intl = useIntl();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    user: UserSelectSelection | null;
    confirm: boolean;
  }>({
    mode: "all",
    defaultValues: {
      user: null,
    },
  });

  const userSelectRef = useRef<UserSelectInstance<false>>(null);

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, {
        excludeUsers: [...excludeUsers, ...selected],
      });
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
          props.onResolve(user!);
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
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="organization.confirm-deactivate-user-dialog.body"
              defaultMessage="Are you sure you want to <b>deactivate</b> the selected {count, plural, =1{user} other {users}}?"
              values={{ count: selected.length }}
            />
            <br />
            <FormattedMessage
              id="organization.confirm-deactivate-user-dialog.body-2"
              defaultMessage="Inactive users won't be able to login or use Parallel in any way."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="organization.confirm-deactivate-user-dialog.transfer-to-user"
              defaultMessage="To continue, you must select a user from your organization to transfer all the petitions of the {count, plural, =1{user} other {users}} to deactivate."
              values={{
                count: selected.length,
              }}
            />
          </Text>

          <FormControl id="user" isInvalid={!!errors.user}>
            <Controller
              name="user"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <UserSelect
                  ref={userSelectRef}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  onSearch={handleSearchUsers}
                  placeholder={intl.formatMessage({
                    id: "organization.confirm-deactivate.user-select.input-placeholder",
                    defaultMessage: "Select a user from your organization",
                  })}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="organization.confirm-deactivate.user-select.input-error"
                defaultMessage="Please, select a user"
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="red">
          <FormattedMessage
            id="petition.confirm-deactivate-users.confirm"
            defaultMessage="Deactivate {count, plural, =1{user} other {users}}"
            values={{
              count: selected.length,
            }}
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
