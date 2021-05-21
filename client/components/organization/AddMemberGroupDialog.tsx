import { Button, FormControl, FormLabel, Stack, Text } from "@chakra-ui/react";
import { UserPlusIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
  useSearchUsers,
} from "../common/UserSelect";

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

  const intl = useIntl();
  const nameRef = useRef<HTMLInputElement>(null);
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
      initialFocusRef={nameRef}
      header={
        <Stack direction={"row"} spacing={2} align="center">
          <UserPlusIcon role="presentation" />
          <Text>
            <FormattedMessage
              id="component.add-member-group-dialog.title"
              defaultMessage="Add members to group"
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
                defaultMessage="Add to group"
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
                  onKeyDown={(e: KeyboardEvent) => {
                    if (
                      e.key === "Enter" &&
                      !(e.target as HTMLInputElement).value
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(users) => {
                    onChange(users);
                  }}
                  onBlur={onBlur}
                  onSearch={handleSearchUsers}
                  placeholder={intl.formatMessage({
                    id: "component.add-member-group-dialog.members-placeholder",
                    defaultMessage: "Select users from your organization",
                  })}
                />
              )}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid">
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
