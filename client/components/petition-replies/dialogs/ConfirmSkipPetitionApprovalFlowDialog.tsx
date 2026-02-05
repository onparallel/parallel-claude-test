import { Button, FormControl, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { Text } from "@parallel/components/ui";

export function ConfirmSkipPetitionApprovalFlowDialog(props: DialogProps<{}, string>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<{ message: string | null }>({
    mode: "onChange",
    defaultValues: {
      message: null,
    },
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const registerTextareaProps = useRegisterWithRef(textareaRef, register, "message", {
    required: true,
  });

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={textareaRef}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            assert(isNonNullish(data.message), "Skip approval message is required");
            props.onResolve(data.message);
          }),
        },
      }}
      header={
        <Text>
          <FormattedMessage
            id="component.confirm-skip-petition-approval-flow-dialog.header"
            defaultMessage="Do you want to force this approval?"
          />
        </Text>
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.confirm-skip-petition-approval-flow-dialog.body"
              defaultMessage="If you proceed, this step will be skipped and automatically approved, allowing you to continue the process. This action cannot be undone."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="generic.confirm-continue"
              defaultMessage="Are you sure you want to continue?"
            />
          </Text>
          <FormControl isInvalid={!!errors.message}>
            <GrowingTextarea
              placeholder={intl.formatMessage({
                id: "component.confirm-skip-petition-approval-flow-dialog.message-placeholder",
                defaultMessage: "Write the reason for forcing the approval",
              })}
              {...registerTextareaProps}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="red">
          <FormattedMessage id="generic.yes-continue" defaultMessage="Yes, continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmSkipPetitionApprovalFlowDialog() {
  return useDialog(ConfirmSkipPetitionApprovalFlowDialog);
}
