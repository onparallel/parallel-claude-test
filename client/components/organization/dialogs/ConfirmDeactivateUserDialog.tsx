import { gql } from "@apollo/client";
import {
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { TagSelect } from "@parallel/components/common/TagSelect";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
} from "@parallel/components/common/UserSelect";
import { useConfirmDeactivateUserDialog_UserFragment } from "@parallel/graphql/__types";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface ConfirmDeactivateUserDialogData {
  userId: string;
  tagIds: string[];
  includeDrafts: boolean;
}

interface ConfirmDeactivateUserDialogProps extends DialogProps {
  users: useConfirmDeactivateUserDialog_UserFragment[];
}

function ConfirmDeactivateUserDialog({
  users,
  ...props
}: DialogProps<ConfirmDeactivateUserDialogProps, ConfirmDeactivateUserDialogData>) {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<{
    user: UserSelectSelection | null;
    tagIds: string[];
    includeDrafts: boolean;
  }>({
    mode: "onSubmit",
    defaultValues: {
      user: null,
      tagIds: [],
      includeDrafts: false,
    },
  });

  const showTransferText = users.every((user) => user.status === "ON_HOLD");

  const userSelectRef = useRef<UserSelectInstance<false>>(null);

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, {
        excludeUsers: [...excludeUsers, ...users.map((user) => user.id)],
      });
    },
    [_handleSearchUsers],
  );

  return (
    <ConfirmDialog
      size="lg"
      initialFocusRef={userSelectRef}
      content={{
        as: "form",
        onSubmit: handleSubmit(({ user, tagIds, includeDrafts }) => {
          props.onResolve({ userId: user!.id, tagIds, includeDrafts });
        }),
      }}
      header={
        showTransferText ? (
          <FormattedMessage
            id="component.confirm-deactivate-user-dialog.transfer-parallels"
            defaultMessage="Transfer parallels"
          />
        ) : (
          <FormattedMessage
            id="component.confirm-deactivate-user-dialog.deactivate-users"
            defaultMessage="Deactivate {count, plural, =1{user} other {users}}"
            values={{ count: users!.length }}
          />
        )
      }
      body={
        <Stack spacing={4}>
          {showTransferText ? (
            <Stack>
              <Text>
                {users.length === 1 ? (
                  <FormattedMessage
                    id="component.confirm-deactivate-user-dialog.transfer-onhold-body"
                    defaultMessage="The user {fullName} ({email}) has been deactivated."
                    values={{ fullName: users[0].fullName, email: users[0].email }}
                  />
                ) : (
                  <FormattedMessage
                    id="component.confirm-deactivate-user-dialog.selected-users-deactivated"
                    defaultMessage="The selected users have been deactivated."
                  />
                )}
              </Text>
              <Text>
                <FormattedMessage
                  id="component.confirm-deactivate-user-dialog.transfer-onhold-body-2"
                  defaultMessage="In order not to lose access to your parallels and templates, please specify a user to transfer everything to."
                />
              </Text>
            </Stack>
          ) : (
            <>
              <Text>
                <FormattedMessage
                  id="organization.confirm-deactivate-user-dialog.body"
                  defaultMessage="If you deactivate the selected {count, plural, =1{user} other {users}}, they won't be able to access Parallel."
                  values={{ count: users!.length }}
                />
              </Text>
              <Text>
                <FormattedMessage
                  id="organization.confirm-deactivate-user-dialog.transfer-to-user"
                  defaultMessage="Choose a user to transfer all the parallels from the selected {count, plural, =1{user} other {users}}. You can also add tags to identify them later."
                  values={{
                    count: users!.length,
                  }}
                />
              </Text>
            </>
          )}

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
          <FormControl id="includeDrafts">
            <Checkbox {...register("includeDrafts")}>
              <HStack>
                <Text>
                  <FormattedMessage
                    id="component.confirm-deactivate-user-dialog.include-drafts"
                    defaultMessage="Include drafts"
                  />
                </Text>
                <HelpPopover>
                  <Text>
                    <FormattedMessage
                      id="component.confirm-deactivate-user-dialog.include-drafts-help"
                      defaultMessage="Checking this option will transfer all parallels including drafts. Otherwise, the drafts of the deactivated user will be deleted."
                    />
                  </Text>
                </HelpPopover>
              </HStack>
            </Checkbox>
          </FormControl>
          <FormControl id="tagIds">
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.confirm-deactivate-user-dialog.tags-label"
                defaultMessage="Tags"
              />
            </FormLabel>
            <Controller
              name="tagIds"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TagSelect
                  isClearable
                  allowCreatingTags
                  isMulti
                  value={value}
                  onChange={(tags) => onChange(tags.map((tag) => tag.id))}
                />
              )}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        showTransferText ? (
          <Button type="submit" colorScheme="primary">
            <FormattedMessage
              id="component.confirm-deactivate-user-dialog.transfer"
              defaultMessage="Transfer"
            />
          </Button>
        ) : (
          <Button type="submit" colorScheme="red">
            <FormattedMessage
              id="petition.confirm-deactivate-users.confirm"
              defaultMessage="Deactivate {count, plural, =1{user} other {users}}"
              values={{
                count: users!.length,
              }}
            />
          </Button>
        )
      }
      {...props}
    />
  );
}

export function useConfirmDeactivateUserDialog() {
  return useDialog(ConfirmDeactivateUserDialog);
}

useConfirmDeactivateUserDialog.fragments = {
  get User() {
    return gql`
      fragment useConfirmDeactivateUserDialog_User on User {
        id
        fullName
        email
        status
      }
    `;
  },
};
