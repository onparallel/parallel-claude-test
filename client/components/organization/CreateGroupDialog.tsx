import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
  useSearchUsers,
} from "../common/UserSelect";

interface CreateGroupDialogData {
  name: string;
  users: UserSelectSelection[];
}

export function CreateGroupDialog({
  ...props
}: DialogProps<{}, CreateGroupDialogData>) {
  const { handleSubmit, register, formState, control } =
    useForm<CreateGroupDialogData>({
      mode: "onChange",
      defaultValues: {
        name: "",
        users: [],
      },
    });

  const { errors } = formState;

  const intl = useIntl();
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
        <FormattedMessage
          id="organization-groups.create-group-title"
          defaultMessage="New working group"
        />
      }
      body={
        <Stack>
          <FormControl id="create-group-name" isInvalid={!!errors.name}>
            <FormLabel>
              <FormattedMessage
                id="organization-groups.group-name"
                defaultMessage="Group name"
              />
            </FormLabel>
            <Input {...nameRegisterProps} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-group-name-error"
                defaultMessage="Please, enter the group name"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="create-group-members">
            <FormLabel>
              <FormattedMessage
                id="organization-groups.members"
                defaultMessage="Members"
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

export function useCreateGroupDialog() {
  return useDialog(CreateGroupDialog);
}
