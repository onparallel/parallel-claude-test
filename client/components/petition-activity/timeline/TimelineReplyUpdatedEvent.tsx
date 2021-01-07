import { gql } from "@apollo/client";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { TimelineReplyUpdatedEvent_ReplyUpdatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../PetitionFieldReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineReplyUpdatedEventProps = {
  event: TimelineReplyUpdatedEvent_ReplyUpdatedEventFragment;
};

export function TimelineReplyUpdatedEvent({
  event: { access, field, createdAt },
}: TimelineReplyUpdatedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon icon={<PlusCircleIcon />} color="gray.600" size="18px" />
      }
      paddingY={2}
    >
      <FormattedMessage
        id="timeline.reply-updated-description"
        defaultMessage="{contact} updated a reply to the field {field} {timeAgo}"
        values={{
          contact: access.contact ? (
            <ContactLink contact={access.contact} />
          ) : (
            <DeletedContact />
          ),
          field: <PetitionFieldReference field={field} />,
          timeAgo: (
            <DateTime
              value={createdAt}
              format={FORMATS.LLL}
              useRelativeTime="always"
            />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelineReplyUpdatedEvent.fragments = {
  ReplyUpdatedEvent: gql`
    fragment TimelineReplyUpdatedEvent_ReplyUpdatedEvent on ReplyUpdatedEvent {
      field {
        ...PetitionFieldReference_PetitionField
      }
      access {
        contact {
          ...ContactLink_Contact
        }
      }
      createdAt
    }
    ${PetitionFieldReference.fragments.PetitionField}
    ${ContactLink.fragments.Contact}
  `,
};
