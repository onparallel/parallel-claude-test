import { gql } from "@apollo/client";
import { SignaturePlusIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { SignerReference } from "@parallel/components/common/SignerReference";
import { TimelineRecipientSignedEvent_RecipientSignedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineRecipientSignedEventProps = {
  event: TimelineRecipientSignedEvent_RecipientSignedEventFragment;
};

export function TimelineRecipientSignedEvent({
  event: { signer, createdAt },
}: TimelineRecipientSignedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={SignaturePlusIcon} color="black" backgroundColor="gray.200" />}
    >
      <FormattedMessage
        id="timeline.recipient-signed-description"
        defaultMessage="{signer} signed the document {timeAgo}"
        values={{
          signer: <SignerReference signer={signer} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    </TimelineItem>
  );
}

TimelineRecipientSignedEvent.fragments = {
  RecipientSignedEvent: gql`
    fragment TimelineRecipientSignedEvent_RecipientSignedEvent on RecipientSignedEvent {
      signer {
        ...SignerReference_PetitionSigner
      }
      createdAt
    }
    ${SignerReference.fragments.PetitionSigner}
  `,
};
