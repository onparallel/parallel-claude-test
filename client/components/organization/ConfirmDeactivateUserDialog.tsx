import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { AppLayout_UserFragment } from "@parallel/graphql/__types";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useCallback, useRef } from "react";
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

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    user: UserSelectSelection | null;
  }>({
    mode: "all",
    defaultValues: {
      user: null,
    },
  });

  const userSelectRef = useRef<UserSelectInstance<false>>(null);

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
              values={{
                b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                count: selected.length,
              }}
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
          <Controller
            name="user"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <UserSingleSelect
                ref={userSelectRef}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onSearchUsers={handleSearchUsers}
                placeholder={intl.formatMessage({
                  id: "organization.confirm-deactivate.user-select.input-placeholder",
                  defaultMessage: "Select a user from your organization",
                })}
              />
            )}
          />
        </Stack>
      }
      confirm={
        <Button
          type="submit"
          colorScheme="red"
          isDisabled={Boolean(errors.user)}
        >
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
