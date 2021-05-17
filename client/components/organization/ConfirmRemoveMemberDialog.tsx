import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { UserSelectSelection } from "../common/UserSelect";

function ConfirmRemoveMemberDialog({
  selected,
  ...props
}: DialogProps<{ selected: string[] }, UserSelectSelection>) {
  const {
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

  return (
    <ConfirmDialog
      size="lg"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ user }) => {
          props.onResolve(user!);
        }),
      }}
      header={
        <FormattedMessage
          id="organization-groups.remove"
          defaultMessage="Remove from group"
        />
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="organization.confirm-remove-member.body"
              defaultMessage="Are you sure you want to <b>remove from group</b> the selected {count, plural, =1{user} other {users}}? If continue they will lose access to the petitions shared with this group."
              values={{
                b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                count: selected.length,
              }}
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button
          type="submit"
          colorScheme="red"
          isDisabled={Boolean(errors.user)}
        >
          <FormattedMessage
            id="organization.confirm-remove-member.confirm"
            defaultMessage="Yes, remove from group"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmRemoveMemberDialog() {
  return useDialog(ConfirmRemoveMemberDialog);
}
