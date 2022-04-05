import { gql } from "@apollo/client";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineReplyCreatedEvent_ReplyCreatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../PetitionFieldReference";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineReplyCreatedEventProps = {
  event: TimelineReplyCreatedEvent_ReplyCreatedEventFragment;
  userId: string;
};

export function TimelineReplyCreatedEvent({
  event: { createdBy, field, createdAt },
  userId,
}: TimelineReplyCreatedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<PlusCircleIcon />} color="gray.600" size="18px" />}
      paddingY={2}
    >
      <FormattedMessage
        id="timeline.reply-created-description"
        defaultMessage="{userIsYou, select, true {You} other {{createdBy}}} replied to the field {field} {timeAgo}"
        values={{
          userIsYou: createdBy?.__typename === "User" && createdBy.id === userId,
          createdBy:
            createdBy?.__typename === "PetitionAccess" ? (
              <ContactReference contact={createdBy.contact} />
            ) : createdBy?.__typename === "User" ? (
              <UserReference user={createdBy} />
            ) : null,
          field: <PetitionFieldReference field={field} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
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
      createdBy {
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
