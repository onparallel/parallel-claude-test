import { gql } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { NakedLink } from "@parallel/components/common/Link";
import { SignerReference } from "@parallel/components/common/SignerReference";
import { TimelineSignatureCancelledEvent_SignatureCancelledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useSignatureCancelledRequestErrorMessage } from "@parallel/utils/useSignatureCancelledRequestErrorMessage";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { UserOrContactReference } from "../../UserOrContactReference";
import { useDeclinedSignatureReasonDialog } from "../../dialogs/DeclinedSignatureReasonDialog";
import { useSignatureCancelledRequestErrorDialog } from "../../dialogs/SignatureCancelledRequestErrorDialog";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineSignatureCancelledEventProps {
  userId: string;
  event: TimelineSignatureCancelledEvent_SignatureCancelledEventFragment;
}

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

  const requestErrorMessage = useSignatureCancelledRequestErrorMessage();
  const showSignatureCancelledRequestErrorDialog = useSignatureCancelledRequestErrorDialog();
  async function handleSeeRequestErrorMessageClick(
    event: TimelineSignatureCancelledEvent_SignatureCancelledEventFragment,
  ) {
    try {
      await showSignatureCancelledRequestErrorDialog({
        message: requestErrorMessage(event),
        reason: event.errorMessage!,
      });
    } catch {}
  }

  return (
    <TimelineItem
      icon={<TimelineIcon icon={SignatureIcon} color="white" backgroundColor="red.500" />}
    >
      <Flex alignItems="center">
        <Box>
          {event.cancelType === "CANCELLED_BY_USER" && (
            <FormattedMessage
              id="timeline.signature-cancelled-by-user.description"
              defaultMessage="{userIsYou, select, true {You} other {{name}}} cancelled the eSignature process {timeAgo}"
              values={{
                userIsYou:
                  event.cancelledBy?.__typename === "User" && userId === event.cancelledBy.id,
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
          {event.cancelType === "REQUEST_ERROR" ? requestErrorMessage(event) : null}
        </Box>
        {event.cancelType === "REQUEST_ERROR" && isDefined(event.errorMessage) ? (
          <Button
            onClick={() => handleSeeRequestErrorMessageClick(event)}
            size="sm"
            variant="outline"
            marginStart={4}
            background="white"
          >
            <FormattedMessage
              id="timeline.signature-declined.see-reason"
              defaultMessage="See reason"
            />
          </Button>
        ) : null}
        {event.cancelType === "DECLINED_BY_SIGNER" && event.cancellerReason && (
          <Button
            onClick={handleSeeMessageClick}
            size="sm"
            variant="outline"
            marginStart={4}
            background="white"
          >
            <FormattedMessage
              id="timeline.signature-declined.see-reason"
              defaultMessage="See reason"
            />
          </Button>
        )}
        {event.cancelType === "REQUEST_ERROR" &&
          event.errorCode &&
          ["CONSENT_REQUIRED", "INVALID_CREDENTIALS", "ACCOUNT_SUSPENDED"].includes(
            event.errorCode,
          ) && (
            <NakedLink href="/app/organization/integrations/signature">
              <Button as="a" variant="outline" size="sm" marginStart={4}>
                <FormattedMessage id="timeline.signature-declined.review" defaultMessage="Review" />
              </Button>
            </NakedLink>
          )}
      </Flex>
    </TimelineItem>
  );
}

TimelineSignatureCancelledEvent.fragments = {
  SignatureCancelledEvent: gql`
    fragment TimelineSignatureCancelledEvent_SignatureCancelledEvent on SignatureCancelledEvent {
      ...useSignatureCancelledRequestErrorMessage_SignatureCancelledEvent
      cancelledBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      canceller {
        ...SignerReference_PetitionSigner
      }
      cancelType
      errorCode
      errorMessage
      cancellerReason
      createdAt
    }
    ${useSignatureCancelledRequestErrorMessage.fragments.SignatureCancelledEvent}
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${SignerReference.fragments.PetitionSigner}
  `,
};
