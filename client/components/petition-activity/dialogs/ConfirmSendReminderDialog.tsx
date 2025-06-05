import { gql } from "@apollo/client";
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
import { ContactReference } from "@parallel/components/common/ContactReference";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  RichTextEditor,
  RichTextEditorInstance,
} from "@parallel/components/common/slate/RichTextEditor";
import { useConfirmSendReminderDialog_PetitionFragment } from "@parallel/graphql/__types";
import { emptyRTEValue } from "@parallel/utils/slate/RichTextEditor/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/usePetitionMessagePlaceholderOptions";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function ConfirmSendReminderDialog({
  petition,
  ...props
}: DialogProps<
  { petition: useConfirmSendReminderDialog_PetitionFragment },
  { message: null | RichTextEditorValue }
>) {
  const intl = useIntl();
  const [message, setMessage] = useState(emptyRTEValue());
  const [isInvalid, setIsInvalid] = useState(false);
  const [hasMessage, setHasMessage] = useState(false);
  const messageRef = useRef<RichTextEditorInstance>(null);

  const optedOut = petition.accesses?.filter((access) => access.remindersOptOut) ?? [];

  const placeholderOptions = usePetitionMessagePlaceholderOptions({ petition });
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
            <Alert status="warning" rounded="md">
              <Flex alignItems="center" justifyContent="flex-start">
                <AlertIcon />
                <AlertDescription>
                  {petition.accesses.length > 1 ? (
                    <>
                      <Text>
                        <FormattedMessage
                          id="component.confirm-send-reminder-dialog.opted-out-warning-multiple"
                          defaultMessage="The following contacts have opted out from receiving reminders for this parallel:"
                        />
                      </Text>
                      <UnorderedList paddingStart={2}>
                        {optedOut.map((pa) => (
                          <ListItem key={pa.id}>
                            <ContactReference contact={pa.contact} />
                          </ListItem>
                        ))}
                      </UnorderedList>
                    </>
                  ) : (
                    <Text>
                      <FormattedMessage
                        id="component.confirm-send-reminder-dialog.opted-out-warning"
                        defaultMessage="This contact has opted out from receiving reminders for this parallel."
                      />
                    </Text>
                  )}
                </AlertDescription>
              </Flex>
            </Alert>
          ) : null}
          <Text>
            {petition.status === "COMPLETED" ? (
              <FormattedMessage
                id="component.confirm-send-reminder-dialog.body-completed"
                defaultMessage="This parallel has already been completed, are you sure you want to send a reminder to the selected contacts?"
              />
            ) : (
              <FormattedMessage
                id="component.confirm-send-reminder-dialog.body"
                defaultMessage="Are you sure you want to send a reminder to the selected contacts?"
              />
            )}
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
            <PaddedCollapse open={hasMessage}>
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
          colorScheme="primary"
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

useConfirmSendReminderDialog.fragments = {
  Petition: gql`
    fragment useConfirmSendReminderDialog_Petition on Petition {
      status
      accesses {
        id
        remindersOptOut
        contact {
          ...ContactReference_Contact
        }
      }
      ...usePetitionMessagePlaceholderOptions_PetitionBase
    }
    ${usePetitionMessagePlaceholderOptions.fragments.PetitionBase}
    ${ContactReference.fragments.Contact}
  `,
};
