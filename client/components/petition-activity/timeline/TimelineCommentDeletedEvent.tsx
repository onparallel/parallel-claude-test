import { gql } from "@apollo/client";
import { CommentXIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineCommentDeletedEvent_CommentDeletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../PetitionFieldReference";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineCommentDeletedEventProps = {
  userId: string;
  event: TimelineCommentDeletedEvent_CommentDeletedEventFragment;
};

export function TimelineCommentDeletedEvent({
  userId,
  event: { deletedBy, field, createdAt },
}: TimelineCommentDeletedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<CommentXIcon />}
          color="gray.700"
          backgroundColor="gray.200"
        />
      }
      paddingY={2}
    >
      <FormattedMessage
        id="timeline.comment-deleted"
        defaultMessage="{same, select, true {You} other {{someone}}} deleted a comment on field {field} {timeAgo}"
        values={{
          same: deletedBy?.__typename === "User" && deletedBy?.id === userId,
          someone:
            deletedBy?.__typename === "PetitionAccess" ? (
              <ContactLink contact={deletedBy.contact} />
            ) : deletedBy?.__typename === "User" ? (
              <UserReference user={deletedBy} />
            ) : null,
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

TimelineCommentDeletedEvent.fragments = {
  CommentDeletedEvent: gql`
    fragment TimelineCommentDeletedEvent_CommentDeletedEvent on CommentDeletedEvent {
      field {
        ...PetitionFieldReference_PetitionField
      }
      deletedBy {
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
