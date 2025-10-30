import { gql } from "@apollo/client";
import { Box, Flex } from "@chakra-ui/react";
import { EmailSentIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { SignerReference } from "@parallel/components/common/SignerReference";
import { TimelineSignatureDeliveredEvent_SignatureDeliveredEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { EmailEventsIndicator } from "../../EmailEventsIndicator";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineSignatureDeliveredEventProps {
  event: TimelineSignatureDeliveredEvent_SignatureDeliveredEventFragment;
}

export function TimelineSignatureDeliveredEvent({ event }: TimelineSignatureDeliveredEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={EmailSentIcon} color="black" backgroundColor="gray.200" />}
    >
      <Flex alignItems="center">
        <Box>
          <FormattedMessage
            id="component.timeline-signature-delivered-event.description"
            defaultMessage="We sent the signature email to {signer} {timeAgo}"
            values={{
              signer: <SignerReference signer={event.signer} />,
              timeAgo: (
                <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
              ),
            }}
          />
          {event.signature.signatureConfig.integration?.provider === "SIGNATURIT" ? (
            <EmailEventsIndicator
              openedAt={event.openedAt}
              deliveredAt={event.deliveredAt}
              bouncedAt={event.bouncedAt}
              marginStart={2}
            />
          ) : null}
        </Box>
      </Flex>
    </TimelineItem>
  );
}

TimelineSignatureDeliveredEvent.fragments = {
  SignatureDeliveredEvent: gql`
    fragment TimelineSignatureDeliveredEvent_SignatureDeliveredEvent on SignatureDeliveredEvent {
      createdAt
      signature {
        signatureConfig {
          integration {
            id
            provider
          }
        }
      }
      signer {
        ...SignerReference_PetitionSigner
      }
      openedAt
      deliveredAt
      bouncedAt
    }
    ${SignerReference.fragments.PetitionSigner}
  `,
};
