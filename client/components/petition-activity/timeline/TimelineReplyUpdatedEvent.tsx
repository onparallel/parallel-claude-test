import { gql } from "@apollo/client";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { TimelineReplyUpdatedEvent_ReplyUpdatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../PetitionFieldReference";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineReplyUpdatedEventProps = {
  event: TimelineReplyUpdatedEvent_ReplyUpdatedEventFragment;
  userId: string;
};

export function TimelineReplyUpdatedEvent({
  event: { updatedBy, field, createdAt },
  userId,
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
        defaultMessage="{same, select, true {You} other {{updatedBy}}} updated a reply to the field {field} {timeAgo}"
        values={{
          same: updatedBy?.__typename == "User" && updatedBy.id === userId,
          updatedBy:
            updatedBy?.__typename === "PetitionAccess" ? (
              updatedBy.contact ? (
                <ContactLink contact={updatedBy.contact} />
              ) : (
                <DeletedContact />
              )
            ) : (
              updatedBy?.__typename === "User" && (
                <UserReference user={updatedBy} />
              )
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
      updatedBy {
        ... on User {
          ...UserReference_User
        }
        ... on PetitionAccess {
          contact {
            ...ContactLink_Contact
          }
        }
      }
      createdAt
    }
    ${PetitionFieldReference.fragments.PetitionField}
    ${UserReference.fragments.User}
    ${ContactLink.fragments.Contact}
  `,
};
