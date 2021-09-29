import { gql } from "@apollo/client";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { SentReminderMessageDialog_PetitionReminderFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { ContactReference } from "../common/ContactReference";
import { DateTime } from "../common/DateTime";
import { DialogProps, useDialog } from "../common/DialogProvider";

export type SentReminderMessageDialogProps = {
  reminder: SentReminderMessageDialog_PetitionReminderFragment;
};

export function SentReminderMessageDialog({
  reminder,
  ...props
}: DialogProps<SentReminderMessageDialogProps, void>) {
  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton={true}
      {...props}
      header={
        <Heading size="md">
          <FormattedMessage
            id="component.sent-petition-reminder-dialog.header"
            defaultMessage="Reminder"
          />
        </Heading>
      }
      body={
        <Stack>
          <Text fontSize="sm" fontStyle="italic">
            <FormattedMessage
              id="component.sent-petition-reminder-dialog.message-sent"
              defaultMessage="Reminder sent to {recipient} on {date}"
              values={{
                recipient: <ContactReference isFull contact={reminder.access.contact} />,
                date: <DateTime value={reminder.createdAt} format={FORMATS["LLL"]} />,
              }}
            />
          </Text>
          <Box>
            <Text dangerouslySetInnerHTML={{ __html: reminder.emailBody! }} />
          </Box>
        </Stack>
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      confirm={null}
    />
  );
}

export function useSentReminderMessageDialog() {
  return useDialog(SentReminderMessageDialog);
}

SentReminderMessageDialog.fragments = {
  PetitionReminder: gql`
    fragment SentReminderMessageDialog_PetitionReminder on PetitionReminder {
      access {
        contact {
          ...ContactReference_Contact
        }
      }
      createdAt
      emailBody
    }
    ${ContactReference.fragments.Contact}
  `,
};
