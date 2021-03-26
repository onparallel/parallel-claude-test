import { Button, Checkbox, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { emptyRTEValue } from "@parallel/utils/slate/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/isEmptyRTEValue";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/slate/placeholders/usePetitionMessagePlaceholderOptions";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { PaddedCollapse } from "../common/PaddedCollapse";
import {
  RichTextEditor,
  RichTextEditorInstance,
  RichTextEditorValue,
} from "../common/RichTextEditor";

export function ConfirmSendReminderDialog({
  ...props
}: DialogProps<{}, { message: null | RichTextEditorValue }>) {
  const intl = useIntl();
  const [message, setMessage] = useState<RichTextEditorValue>(emptyRTEValue());
  const [isInvalid, setIsInvalid] = useState(false);
  const [hasMessage, setHasMessage] = useState(false);
  const messageRef = useRef<RichTextEditorInstance>(null);

  const placeholderOptions = usePetitionMessagePlaceholderOptions();
  return (
    <ConfirmDialog
      size="xl"
      header={
        <FormattedMessage
          id="component.confirm-send-reminder-dialog.header"
          defaultMessage="Send reminders"
        />
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.confirm-send-reminder-dialog.body"
              defaultMessage="Are you sure you want to send a reminder to the selected contacts?"
            />
          </Text>
          <Stack>
            <Checkbox
              isChecked={hasMessage}
              onChange={(e) => {
                const isChecked = e.target.checked;
                if (isChecked) {
                  setTimeout(() => messageRef.current?.focus());
                }
                setHasMessage(isChecked);
              }}
            >
              <FormattedMessage
                id="component.confirm-send-reminder-dialog.add-message"
                defaultMessage="Add a message"
              />
            </Checkbox>
            <PaddedCollapse in={hasMessage}>
              <RichTextEditor
                isInvalid={isInvalid && isEmptyRTEValue(message)}
                ref={messageRef}
                value={message}
                onChange={setMessage}
                placeholder={intl.formatMessage({
                  id:
                    "component.confirm-send-reminder-dialog.message-placeholder",
                  defaultMessage: "Add a message to include in the email",
                })}
                placeholderOptions={placeholderOptions}
              />
            </PaddedCollapse>
          </Stack>
        </Stack>
      }
      confirm={
        <Button
          colorScheme="purple"
          onClick={() => {
            if (hasMessage && isEmptyRTEValue(message)) {
              setIsInvalid(true);
              setTimeout(() => messageRef.current?.focus());
            } else {
              props.onResolve({
                message: hasMessage ? message : null,
              });
            }
          }}
        >
          <FormattedMessage
            id="component.confirm-send-reminder-dialog.confirm"
            defaultMessage="Yes, send"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmSendReminderDialog() {
  return useDialog(ConfirmSendReminderDialog);
}
