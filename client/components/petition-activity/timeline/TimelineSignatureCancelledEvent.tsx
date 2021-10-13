import { gql } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { SignerReference } from "@parallel/components/common/SignerReference";
import { TimelineSignatureCancelledEvent_SignatureCancelledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { useDeclinedSignatureReasonDialog } from "../DeclinedSignatureReasonDialog";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineSignatureCancelledEventProps = {
  userId: string;
  event: TimelineSignatureCancelledEvent_SignatureCancelledEventFragment;
};

export function TimelineSignatureCancelledEvent({
  event,
  userId,
}: TimelineSignatureCancelledEventProps) {
  const showDeclinedSignatureReason = useDeclinedSignatureReasonDialog();
  async function handleSeeMessageClick() {
    try {
      await showDeclinedSignatureReason({
        signer: event.canceller ?? null,
        declineReason: event.cancellerReason!,
      });
    } catch {}
  }

  return (
    <TimelineItem
      icon={<TimelineIcon icon={<SignatureIcon />} color="white" backgroundColor="red.400" />}
    >
      <Flex alignItems="center">
        <Box>
          {event.cancelType === "CANCELLED_BY_USER" && (
            <FormattedMessage
              id="timeline.signature-cancelled-description"
              defaultMessage="{same, select, true {You} other {{user}}} cancelled the eSignature process {timeAgo}"
              values={{
                same: userId === event.user?.id,
                user: <UserReference user={event.user} />,
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          )}
          {event.cancelType === "DECLINED_BY_SIGNER" && (
            <FormattedMessage
              id="timeline.signature-declined-description"
              defaultMessage="{signer} has declined the eSignature process {timeAgo}"
              values={{
                signer: <SignerReference signer={event.canceller} />,
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          )}
        </Box>
        {event.cancelType === "DECLINED_BY_SIGNER" && event.cancellerReason && (
          <Button onClick={handleSeeMessageClick} size="sm" variant="outline" marginLeft={4}>
            <FormattedMessage
              id="timeline.signature-declined.see-reason"
              defaultMessage="See reason"
            />
          </Button>
        )}
      </Flex>
    </TimelineItem>
  );
}

TimelineSignatureCancelledEvent.fragments = {
  SignatureCancelledEvent: gql`
    fragment TimelineSignatureCancelledEvent_SignatureCancelledEvent on SignatureCancelledEvent {
      user {
        ...UserReference_User
      }
      canceller {
        ...SignerReference_PetitionSigner
      }
      cancelType
      cancellerReason
      createdAt
    }
    ${UserReference.fragments.User}
    ${SignerReference.fragments.PetitionSigner}
  `,
};
