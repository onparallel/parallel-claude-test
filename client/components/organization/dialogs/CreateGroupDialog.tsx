import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
} from "@parallel/components/common/UserSelect";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface CreateGroupDialogData {
  name: string;
  users: UserSelectSelection[];
}

export function CreateGroupDialog({ ...props }: DialogProps<{}, CreateGroupDialogData>) {
  const { handleSubmit, register, formState, control } = useForm<CreateGroupDialogData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      users: [],
    },
  });

  const { errors } = formState;

  const usersRef = useRef<UserSelectInstance<true>>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const nameRegisterProps = useRegisterWithRef(nameRef, register, "name", {
    required: true,
  });

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, {
        excludeUsers: [...excludeUsers],
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
        <FormattedMessage id="component.create-group-dialog.title" defaultMessage="New team" />
      }
      body={
        <Stack>
          <FormControl id="create-group-name" isInvalid={!!errors.name}>
            <FormLabel>
              <FormattedMessage
                id="component.create-group-dialog.name-label"
                defaultMessage="Team name"
              />
            </FormLabel>
            <Input {...nameRegisterProps} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-group-name-error"
                defaultMessage="Please, enter the team name"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="create-group-members">
            <FormLabel>
              <FormattedMessage id="generic.users" defaultMessage="Users" />
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
          <FormattedMessage
            id="component.create-group-dialog.confirm-button"
            defaultMessage="Create team"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useCreateGroupDialog() {
  return useDialog(CreateGroupDialog);
}
