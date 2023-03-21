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
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

type ConfirmDeactivateUserDialogData = {
  userId: string;
  tagIds: string[];
  includeDrafts: boolean;
};

function ConfirmDeactivateUserDialog({
  userIds,
  ...props
}: DialogProps<{ userIds: string[] }, ConfirmDeactivateUserDialogData>) {
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

  const userSelectRef = useRef<UserSelectInstance<false>>(null);

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, {
        excludeUsers: [...excludeUsers, ...userIds],
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
        onSubmit: handleSubmit(({ user, tagIds, includeDrafts }) => {
          props.onResolve({ userId: user!.id, tagIds, includeDrafts });
        }),
      }}
      header={
        <FormattedMessage
          id="organization-users.deactivate"
          defaultMessage="Deactivate {count, plural, =1{user} other {users}}"
          values={{ count: userIds.length }}
        />
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="organization.confirm-deactivate-user-dialog.body"
              defaultMessage="If you deactivate the selected {count, plural, =1{user} other {users}}, they won't be able to access Parallel."
              values={{ count: userIds.length }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="organization.confirm-deactivate-user-dialog.transfer-to-user"
              defaultMessage="Choose a user to transfer all the parallels from the selected {count, plural, =1{user} other {users}}. You can also add tags to identify them later."
              values={{
                count: userIds.length,
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
                      defaultMessage="Checking this option will also transfer all draft parallels from the selected users/users. Otherwise, drafts will be deleted."
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
                  canCreateTags
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
        <Button type="submit" colorScheme="red">
          <FormattedMessage
            id="petition.confirm-deactivate-users.confirm"
            defaultMessage="Deactivate {count, plural, =1{user} other {users}}"
            values={{
              count: userIds.length,
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
