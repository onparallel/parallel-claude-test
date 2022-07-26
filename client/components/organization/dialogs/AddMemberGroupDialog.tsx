import { Button, FormControl, FormLabel, Stack, Text } from "@chakra-ui/react";
import { UserPlusIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { UserSelect, UserSelectInstance, UserSelectSelection } from "../../common/UserSelect";
import { useSearchUsers } from "../../../utils/useSearchUsers";

interface AddMemberGroupDialogData {
  users: UserSelectSelection[];
}

export function AddMemberGroupDialog({
  exclude,
  ...props
}: DialogProps<{ exclude: string[] }, AddMemberGroupDialogData>) {
  const { handleSubmit, control } = useForm<AddMemberGroupDialogData>({
    mode: "onChange",
    defaultValues: {
      users: [],
    },
  });

  const usersRef = useRef<UserSelectInstance<true>>(null);

  const _handleSearchUsers = useSearchUsers();

  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, {
        excludeUsers: [...excludeUsers, ...exclude],
      });
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
      initialFocusRef={usersRef}
      header={
        <Stack direction={"row"} spacing={2} align="center">
          <UserPlusIcon role="presentation" />
          <Text>
            <FormattedMessage
              id="component.add-member-group-dialog.title"
              defaultMessage="Add users to the team"
            />
          </Text>
        </Stack>
      }
      body={
        <Stack>
          <FormControl id="add-users">
            <FormLabel>
              <FormattedMessage
                id="component.add-member-group-dialog.members-label"
                defaultMessage="Add to team"
              />
            </FormLabel>
            <Controller
              name="users"
              control={control}
              rules={{ minLength: 1 }}
              render={({ field: { onChange, onBlur, value } }) => (
                <UserSelect
                  ref={usersRef}
                  isMulti
                  value={value}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(users) => {
                    onChange(users);
                  }}
                  onBlur={onBlur}
                  onSearch={handleSearchUsers}
                />
              )}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.done" defaultMessage="Done" />
        </Button>
      }
      {...props}
    />
  );
}

export function useAddMemberGroupDialog() {
  return useDialog(AddMemberGroupDialog);
}
