import { gql } from "@apollo/client";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { TimelineSignatureStartedEvent_SignatureStartedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineSignatureStartedEventProps {
  event: TimelineSignatureStartedEvent_SignatureStartedEventFragment;
}

export function TimelineSignatureStartedEvent({ event }: TimelineSignatureStartedEventProps) {
  const showSignatureStartedMessageDialog = useDialog(SignatureStartedMessageDialog);
  async function handleSeeMessageClick() {
    try {
      await showSignatureStartedMessageDialog({ event });
    } catch {}
  }

  return (
    <TimelineItem
      icon={<TimelineIcon icon={SignatureIcon} color="white" backgroundColor="blue.500" />}
    >
      <Flex alignItems="center">
        <Box>
          <FormattedMessage
            id="component.timeline-signature-started-event.signature-started-description"
            defaultMessage="We started a {signingMode, select, SEQUENTIAL{sequential} other{}} signature process on the parallel {timeAgo}"
            values={{
              timeAgo: (
                <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
              ),
              signingMode: event.signature.signatureConfig.signingMode,
            }}
          />
        </Box>
        {event.signature.signatureConfig.message ? (
          <Button
            onClick={handleSeeMessageClick}
            size="sm"
            variant="outline"
            marginLeft={4}
            background="white"
          >
            <FormattedMessage
              id="generic.timeline-see-message-button"
              defaultMessage="See message"
            />
          </Button>
        ) : null}
      </Flex>
    </TimelineItem>
  );
}

TimelineSignatureStartedEvent.fragments = {
  SignatureStartedEvent: gql`
    fragment TimelineSignatureStartedEvent_SignatureStartedEvent on SignatureStartedEvent {
      createdAt
      signature {
        signatureConfig {
          signingMode
          message
        }
      }
    }
  `,
};

function SignatureStartedMessageDialog({
  event,
  ...props
}: DialogProps<{ event: TimelineSignatureStartedEvent_SignatureStartedEventFragment }, void>) {
  const message = event.signature.signatureConfig.message!;
  const sentAt = event.createdAt;

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton={true}
      {...props}
      header={<></>}
      body={
        <Stack>
          <Text fontSize="sm" fontStyle="italic">
            <FormattedMessage
              id="component.signature-started-message-dialog.message-sent"
              defaultMessage="Message sent on {date}"
              values={{
                date: <DateTime value={sentAt} format={FORMATS["LLL"]} />,
              }}
            />
          </Text>
          <Box>
            <Text>{message}</Text>
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
