import { gql } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { SignerReference } from "@parallel/components/common/SignerReference";
import { TimelineSignatureCancelledEvent_SignatureCancelledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { useDeclinedSignatureReasonDialog } from "../dialogs/DeclinedSignatureReasonDialog";
import { UserOrContactReference } from "../UserOrContactReference";
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
              id="timeline.signature-cancelled-by-user.description"
              defaultMessage="{same, select, true {You} other {{name}}} cancelled the eSignature process {timeAgo}"
              values={{
                same: event.cancelledBy?.__typename === "User" && userId === event.cancelledBy.id,
                name: <UserOrContactReference userOrAccess={event.cancelledBy} />,
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          )}
          {event.cancelType === "DECLINED_BY_SIGNER" && (
            <FormattedMessage
              id="timeline.signature-declined-by-signer.description"
              defaultMessage="{signer} has declined the eSignature process {timeAgo}"
              values={{
                signer: <SignerReference signer={event.canceller} />,
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          )}
          {event.cancelType === "REQUEST_RESTARTED" && (
            <FormattedMessage
              id="timeline.signature-restarted.description"
              defaultMessage="The eSignature process has been restarted {timeAgo}"
              values={{
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          )}
          {event.cancelType === "REQUEST_ERROR" && (
            <FormattedMessage
              id="timeline.signature-cancelled-request-error.description"
              defaultMessage="The eSignature process has been cancelled due to an unknown error {timeAgo}"
              values={{
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
      cancelledBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      canceller {
        ...SignerReference_PetitionSigner
      }
      cancelType
      cancellerReason
      createdAt
    }
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${SignerReference.fragments.PetitionSigner}
  `,
};
