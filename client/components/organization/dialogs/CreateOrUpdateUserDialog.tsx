import { gql } from "@apollo/client";
import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { UserGroupSelect } from "@parallel/components/common/UserGroupSelect";
import { UserSelect } from "@parallel/components/common/UserSelect";
import {
  useCreateOrUpdateUserDialog_UserFragment,
  UserSelect_UserGroupFragment,
} from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { isNotEmptyText } from "@parallel/utils/strings";
import { useSearchUserGroups } from "@parallel/utils/useSearchUserGroups";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { ActionMeta } from "react-select";
import { isNonNullish } from "remeda";

interface CreateOrUpdateUserDialogProps {
  user?: useCreateOrUpdateUserDialog_UserFragment;
}

interface CreateOrUpdateUserDialogData {
  firstName: string;
  lastName: string;
  email: string;
  userGroups: UserSelect_UserGroupFragment[];
}

function CreateOrUpdateUserDialog({
  user,
  ...props
}: DialogProps<CreateOrUpdateUserDialogProps, CreateOrUpdateUserDialogData>) {
  const isUpdate = isNonNullish(user);
  const intl = useIntl();
  const { handleSubmit, register, formState, control } = useForm<CreateOrUpdateUserDialogData>({
    mode: "onChange",
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      userGroups:
        user?.userGroups.map((ug) => ({ ...ug, isDisabled: ug.type === "ALL_USERS" })) ?? [],
    },
  });

  const { errors } = formState;

  const _handleSearchUserGroups = useSearchUserGroups();
  const handleSearchUserGroups = useCallback(
    async (search: string, _excludeUserIds: string[], excludeUserGroupIds: string[]) => {
      return await _handleSearchUserGroups(search, {
        excludeIds: excludeUserGroupIds,
        type: ["NORMAL", "INITIAL"],
      });
    },
    [_handleSearchUserGroups],
  );

  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    pattern: EMAIL_REGEX,
  });

  return (
    <ConfirmDialog
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => props.onResolve(data)),
      }}
      initialFocusRef={emailRef}
      header={
        isUpdate ? (
          <FormattedMessage
            id="component.create-or-update-user-dialog.update-user"
            defaultMessage="Update user"
          />
        ) : (
          <FormattedMessage id="generic.invite-user" defaultMessage="Invite user" />
        )
      }
      body={
        <Stack>
          <FormControl id="create-user-email" isInvalid={!!errors.email} isDisabled={isUpdate}>
            <FormLabel>
              <FormattedMessage id="generic.forms.email-label" defaultMessage="Email" />
            </FormLabel>
            <Input
              {...emailRegisterProps}
              placeholder={intl.formatMessage({
                id: "generic.forms.email-placeholder",
                defaultMessage: "name@example.com",
              })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-email-error"
                defaultMessage="Please, enter a valid email"
              />
            </FormErrorMessage>
          </FormControl>
          <Stack direction={{ base: "column", sm: "row" }}>
            <FormControl
              id="create-user-firstname"
              isInvalid={!!errors.firstName}
              isDisabled={isUpdate}
              flex="1"
            >
              <FormLabel>
                <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" />
              </FormLabel>
              <Input
                {...register("firstName", {
                  required: true,
                  validate: { isNotEmptyText },
                })}
              />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.invalid-first-name-error"
                  defaultMessage="Please, enter the first name"
                />
              </FormErrorMessage>
            </FormControl>
            <FormControl
              id="create-user-lastname"
              isInvalid={!!errors.lastName}
              isDisabled={isUpdate}
              flex="1"
            >
              <FormLabel>
                <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" />
              </FormLabel>
              <Input
                {...register("lastName", {
                  required: true,
                  validate: { isNotEmptyText },
                })}
              />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-last-name-error"
                  defaultMessage="Please, enter the last name"
                />
              </FormErrorMessage>
            </FormControl>
          </Stack>
          <FormControl id="create-user-groups" isDisabled={user?.status === "INACTIVE"}>
            <FormLabel>
              {isUpdate ? (
                <FormattedMessage
                  id="component.create-or-update-user-dialog.included-in"
                  defaultMessage="Included in (optional)"
                />
              ) : (
                <FormattedMessage
                  id="organization-users.invite-user.add-in"
                  defaultMessage="Add to (optional)"
                />
              )}
            </FormLabel>
            <Controller
              name="userGroups"
              control={control}
              rules={{ minLength: 1 }}
              render={({ field: { onChange, onBlur, value } }) => (
                <UserGroupSelect
                  isMulti
                  value={value}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(
                    userGroups,
                    actionMeta: ActionMeta<UserSelect_UserGroupFragment & { isDisabled?: boolean }>,
                  ) => {
                    switch (actionMeta.action) {
                      case "remove-value":
                      case "pop-value":
                        if (actionMeta.removedValue?.isDisabled) {
                          return;
                        }
                    }
                    onChange(userGroups);
                  }}
                  data-section="add-user-to-groups"
                  onBlur={onBlur}
                  onSearch={handleSearchUserGroups}
                />
              )}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button
          type="submit"
          colorScheme="primary"
          variant="solid"
          isDisabled={user?.status === "INACTIVE"}
        >
          {isUpdate ? (
            <FormattedMessage
              id="component.create-or-update-user-dialog.update-user"
              defaultMessage="Update user"
            />
          ) : (
            <FormattedMessage id="generic.invite-user" defaultMessage="Invite user" />
          )}
        </Button>
      }
      {...props}
    />
  );
}

useCreateOrUpdateUserDialog.fragments = {
  get User() {
    return gql`
      fragment useCreateOrUpdateUserDialog_User on User {
        id
        firstName
        lastName
        email
        status
        isMe
        userGroups {
          ...useCreateOrUpdateUserDialog_UserGroup
        }
      }
      ${this.UserGroup}
    `;
  },
  get UserGroup() {
    return gql`
      fragment useCreateOrUpdateUserDialog_UserGroup on UserGroup {
        id
        ...UserSelect_UserGroup
      }
      ${UserSelect.fragments.UserGroup}
    `;
  },
};

CreateOrUpdateUserDialog.queries = [
  gql`
    query CreateUserDialog_emailIsAvailable($email: String!) {
      emailIsAvailable(email: $email)
    }
  `,
];

export function useCreateOrUpdateUserDialog() {
  return useDialog(CreateOrUpdateUserDialog);
}
