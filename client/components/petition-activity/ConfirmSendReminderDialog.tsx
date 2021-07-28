import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Checkbox,
  Flex,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { PetitionAccessTable_PetitionAccessFragment } from "@parallel/graphql/__types";
import { emptyRTEValue } from "@parallel/utils/slate/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/isEmptyRTEValue";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/slate/placeholders/usePetitionMessagePlaceholderOptions";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ContactLink } from "../common/ContactLink";
import { PaddedCollapse } from "../common/PaddedCollapse";
import {
  RichTextEditor,
  RichTextEditorInstance,
  RichTextEditorValue,
} from "../common/RichTextEditor";

export function ConfirmSendReminderDialog({
  accesses,
  ...props
}: DialogProps<
  { accesses: PetitionAccessTable_PetitionAccessFragment[] },
  { message: null | RichTextEditorValue }
>) {
  const intl = useIntl();
  const [message, setMessage] = useState<RichTextEditorValue>(emptyRTEValue());
  const [isInvalid, setIsInvalid] = useState(false);
  const [hasMessage, setHasMessage] = useState(false);
  const messageRef = useRef<RichTextEditorInstance>(null);

  const optedOut = accesses.filter((access) => access.remindersOptOut);

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
          {optedOut.length ? (
            <Alert
              status="warning"
              backgroundColor="orange.100"
              borderRadius="md"
            >
              <Flex alignItems="center" justifyContent="flex-start">
                <AlertIcon color="yellow.500" />
                <AlertDescription>
                  {accesses.length > 1 ? (
                    <>
                      <Text>
                        <FormattedMessage
                          id="component.confirm-send-reminder-dialog.opted-out-warning-multiple"
                          defaultMessage="The following contacts have opted out from receiving reminders for this petition:"
                        />
                      </Text>
                      <UnorderedList paddingLeft={2}>
                        {optedOut.map((pa) => (
                          <ListItem key={pa.id} s>
                            <ContactLink contact={pa.contact} />
                          </ListItem>
                        ))}
                      </UnorderedList>
                    </>
                  ) : (
                    <Text>
                      <FormattedMessage
                        id="component.confirm-send-reminder-dialog.opted-out-warning"
                        defaultMessage="This contact has opted out from receiving reminders for this petition."
                      />
                    </Text>
                  )}
                </AlertDescription>
              </Flex>
            </Alert>
          ) : null}
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
                id="confirm-send-reminder-message"
                isInvalid={isInvalid && isEmptyRTEValue(message)}
                ref={messageRef}
                value={message}
                onChange={setMessage}
                placeholder={intl.formatMessage({
                  id: "component.confirm-send-reminder-dialog.message-placeholder",
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
