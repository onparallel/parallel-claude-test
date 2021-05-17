import { Button, FormControl, FormLabel, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { UserMultiSelect, UserSelectSelection } from "../common/UserSelect";

interface AddMemberGroupDialogData {
  users: string[];
}

export function AddMemberGroupDialog({
  ...props
}: DialogProps<{}, AddMemberGroupDialogData>) {
  const { handleSubmit, control } = useForm<AddMemberGroupDialogData>({
    mode: "onChange",
    defaultValues: {
      users: [],
    },
  });

  const intl = useIntl();
  const nameRef = useRef<HTMLInputElement>(null);

  console.log("GROUPS DIALOG RERENDER");

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, exclude: string[]) => {
      return await _handleSearchUsers(search, [...exclude]);
    },
    [_handleSearchUsers]
  );

  return (
    <ConfirmDialog
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => props.onResolve(data)),
      }}
      initialFocusRef={nameRef}
      header={
        <FormattedMessage
          id="organization-groups.add-member-title"
          defaultMessage="Add new users to group "
        />
      }
      body={
        <Stack>
          <FormControl id="add-users">
            <FormLabel>
              <FormattedMessage
                id="organization-groups.users"
                defaultMessage="Users"
              />
            </FormLabel>
            <Controller
              name="users"
              control={control}
              rules={{ minLength: 1 }}
              render={({ field: { onChange, onBlur, value } }) => (
                <UserMultiSelect
                  value={value}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (
                      e.key === "Enter" &&
                      !(e.target as HTMLInputElement).value
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(users: UserSelectSelection[]) => {
                    onChange(users);
                  }}
                  onBlur={onBlur}
                  onSearchUsers={handleSearchUsers}
                  placeholder={intl.formatMessage({
                    id: "petition-sharing.input-placeholder",
                    defaultMessage: "Add users from your organization",
                  })}
                />
              )}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useAddMemberGroupDialog() {
  return useDialog(AddMemberGroupDialog);
}
