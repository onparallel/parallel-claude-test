import { gql } from "@apollo/client";
import { XCircleIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineReplyDeletedEvent_ReplyDeletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../PetitionFieldReference";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineReplyDeletedEventProps = {
  event: TimelineReplyDeletedEvent_ReplyDeletedEventFragment;
  userId: string;
};

export function TimelineReplyDeletedEvent({
  event: { deletedBy, field, createdAt },
  userId,
}: TimelineReplyDeletedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<XCircleIcon />} color="gray.600" size="18px" />}
      paddingY={2}
    >
      <FormattedMessage
        id="timeline.reply-deleted-description"
        defaultMessage="{same, select, true {You} other {{deletedBy}}} deleted a reply to the field {field} {timeAgo}"
        values={{
          same: deletedBy?.__typename === "User" && deletedBy.id === userId,
          deletedBy:
            deletedBy?.__typename === "PetitionAccess" ? (
              <ContactReference contact={deletedBy.contact} />
            ) : deletedBy?.__typename === "User" ? (
              <UserReference user={deletedBy} />
            ) : null,
          field: <PetitionFieldReference field={field} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
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
      deletedBy {
        ... on User {
          ...UserReference_User
        }
        ... on PetitionAccess {
          contact {
            ...ContactReference_Contact
          }
        }
      }
      createdAt
    }
    ${PetitionFieldReference.fragments.PetitionField}
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
  `,
};
