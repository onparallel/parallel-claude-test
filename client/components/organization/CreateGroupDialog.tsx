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
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface CreateGroupDialogData {
  name: string;
  members: string[];
}

export function CreateGroupDialog({
  ...props
}: DialogProps<{}, CreateGroupDialogData>) {
  const { handleSubmit, register, formState } = useForm<CreateGroupDialogData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      members: [],
    },
  });

  const { errors } = formState;

  const nameRef = useRef<HTMLInputElement>(null);

  console.log("GROUPS DIALOG RERENDER");

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
            <Input {...register("name", { required: true })} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-group-name-error"
                defaultMessage="Please, enter the group name"
              />
            </FormErrorMessage>
          </FormControl>

          <FormControl id="create-user-role">
            <FormLabel>
              <FormattedMessage
                id="organization-groups.members"
                defaultMessage="Members"
              />
            </FormLabel>
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
