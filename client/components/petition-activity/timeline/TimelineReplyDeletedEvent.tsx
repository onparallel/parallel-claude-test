import { gql } from "@apollo/client";
import { Link } from "@chakra-ui/core";
import { XCircleIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { TimelineReplyDeletedEvent_ReplyDeletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../PetitionFieldReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineReplyDeletedEventProps = {
  event: TimelineReplyDeletedEvent_ReplyDeletedEventFragment;
};

export function TimelineReplyDeletedEvent({
  event: { access, field, createdAt },
}: TimelineReplyDeletedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon icon={<XCircleIcon />} color="gray.600" size="18px" />
      }
      paddingY={2}
    >
      <FormattedMessage
        id="timeline.reply-deleted-description"
        defaultMessage="{contact} deleted a reply to the field {field} {timeAgo}"
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

TimelineReplyDeletedEvent.fragments = {
  ReplyDeletedEvent: gql`
    fragment TimelineReplyDeletedEvent_ReplyDeletedEvent on ReplyDeletedEvent {
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
