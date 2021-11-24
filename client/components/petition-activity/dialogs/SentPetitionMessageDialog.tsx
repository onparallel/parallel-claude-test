import { gql } from "@apollo/client";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { SentPetitionMessageDialog_PetitionMessageFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";

export type SentPetitionMessageDialogProps = {
  message: SentPetitionMessageDialog_PetitionMessageFragment;
};

export function SentPetitionMessageDialog({
  message,
  ...props
}: DialogProps<SentPetitionMessageDialogProps, void>) {
  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton={true}
      {...props}
      header={<Heading size="md">{message.emailSubject}</Heading>}
      body={
        <Stack>
          <Text fontSize="sm" fontStyle="italic">
            {message.sentAt ? (
              <FormattedMessage
                id="component.sent-petition-message-dialog.message-sent"
                defaultMessage="Message sent to {recipient} on {date}"
                values={{
                  recipient: <ContactReference isFull contact={message.access.contact} />,
                  date: <DateTime value={message.sentAt} format={FORMATS["LLL"]} />,
                }}
              />
            ) : (
              <FormattedMessage
                id="component.sent-petition-message-dialog.message-scheduled"
                defaultMessage="Message scheduled to be sent to {recipient} on {date}"
                values={{
                  recipient: <ContactReference isFull contact={message.access.contact} />,
                  date: <DateTime value={message.scheduledAt!} format={FORMATS["LLL"]} />,
                }}
              />
            )}
          </Text>
          <Box>
            <Text dangerouslySetInnerHTML={{ __html: message.emailBody! }} />
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

export function useSentPetitionMessageDialog() {
  return useDialog(SentPetitionMessageDialog);
}

SentPetitionMessageDialog.fragments = {
  PetitionMessage: gql`
    fragment SentPetitionMessageDialog_PetitionMessage on PetitionMessage {
      emailBody
      emailSubject
      sentAt
      scheduledAt
      access {
        contact {
          ...ContactReference_Contact
        }
      }
    }
    ${ContactReference.fragments.Contact}
  `,
};
