import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
  useSearchUsers,
} from "@parallel/components/common/UserSelect";
import { AppLayout_UserFragment } from "@parallel/graphql/__types";
import { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

type actionType = "TRANSFER" | "DELETE";

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
  }>({
    mode: "all",
    defaultValues: {
      user: null,
    },
  });

  const [option, setOption] = useState<actionType>("TRANSFER");

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

  const handleOnChangeRadio = (option: actionType) => {
    setOption(option);
  };

  return (
    <ConfirmDialog
      size="lg"
      initialFocusRef={userSelectRef}
      content={{
        as: "form",
        onSubmit: handleSubmit(({ user }) => {
          const users = option === "DELETE" ? undefined : user!;

          console.log("users: ", users);
          props.onResolve(users);
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
              defaultMessage="Before continue, choose what you want to do with the petitions associated to this {count, plural, =1{user} other {users}}:"
              values={{
                count: selected.length,
              }}
            />
          </Text>
          <RadioGroup value={option} onChange={handleOnChangeRadio}>
            <Stack>
              <Radio value="TRANSFER">
                <FormattedMessage
                  id="organization.confirm-deactivate-user-dialog.assign-to-other"
                  defaultMessage="Assign petitions to another user in the organization"
                />
              </Radio>
              {option === "TRANSFER" ? (
                <Box paddingBottom={2}>
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
                        defaultMessage="Please, select a user or team or change your reply"
                      />
                    </FormErrorMessage>
                  </FormControl>
                </Box>
              ) : null}
              <Radio value="DELETE">
                <FormattedMessage
                  id="organization.confirm-deactivate-user-dialog.delete-all-petitions"
                  defaultMessage="Delete all petitions"
                />
              </Radio>
            </Stack>
          </RadioGroup>
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
