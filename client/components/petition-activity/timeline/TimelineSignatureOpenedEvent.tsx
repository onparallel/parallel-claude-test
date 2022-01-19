import { gql } from "@apollo/client";
import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { SignerReference } from "@parallel/components/common/SignerReference";
import { TimelineSignatureOpenedEvent_SignatureOpenedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineSignatureOpenedEventProps = {
  event: TimelineSignatureOpenedEvent_SignatureOpenedEventFragment;
};

export function TimelineSignatureOpenedEvent({
  event: { signer, createdAt },
}: TimelineSignatureOpenedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<SignatureIcon />} color="white" backgroundColor="blue.500" />}
    >
      <FormattedMessage
        id="timeline.signature-opened-description"
        defaultMessage="{signer} opened the signing document {timeAgo}"
        values={{
          signer: <SignerReference signer={signer} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    </TimelineItem>
  );
}

TimelineSignatureOpenedEvent.fragments = {
  SignatureOpenedEvent: gql`
    fragment TimelineSignatureOpenedEvent_SignatureOpenedEvent on SignatureOpenedEvent {
      signer {
        ...SignerReference_PetitionSigner
      }
      createdAt
    }
    ${SignerReference.fragments.PetitionSigner}
  `,
};
