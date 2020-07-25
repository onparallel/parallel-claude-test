import { gql } from "@apollo/client";
import { Link } from "@chakra-ui/core";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { TimelineReplyCreatedEvent_ReplyCreatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../PetitionFieldReference";
import { TimelineIcon, TimelineItem } from "./helpers";
import { PlusCircleIcon } from "@parallel/chakra/icons";

export type TimelineReplyCreatedEventProps = {
  event: TimelineReplyCreatedEvent_ReplyCreatedEventFragment;
};

export function TimelineReplyCreatedEvent({
  event: { access, field, createdAt },
}: TimelineReplyCreatedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon icon={<PlusCircleIcon />} color="gray.600" size="18px" />
      }
      paddingY={2}
    >
      <FormattedMessage
        id="timeline.reply-created-description"
        defaultMessage="{contact} replied to the field {field} {timeAgo}"
        values={{
          contact: access.contact ? (
            <ContactLink contact={access.contact} />
          ) : (
            <DeletedContact />
          ),
          field: <PetitionFieldReference field={field} />,
          timeAgo: (
            <Link>
              <DateTime
                value={createdAt}
                format={FORMATS.LLL}
                useRelativeTime="always"
              />
            </Link>
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelineReplyCreatedEvent.fragments = {
  ReplyCreatedEvent: gql`
    fragment TimelineReplyCreatedEvent_ReplyCreatedEvent on ReplyCreatedEvent {
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
