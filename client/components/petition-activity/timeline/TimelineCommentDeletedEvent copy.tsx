import { Link } from "@chakra-ui/core";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { TimelineCommentDeletedEvent_CommentDeletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../PetitionFieldReference";
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
          icon="comment-x"
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
          same: deletedBy?.id === userId,
          someone:
            deletedBy?.__typename === "Contact" ? (
              <ContactLink contact={deletedBy} />
            ) : deletedBy?.__typename === "User" ? (
              deletedBy.fullName
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

TimelineCommentDeletedEvent.fragments = {
  CommentDeletedEvent: gql`
    fragment TimelineCommentDeletedEvent_CommentDeletedEvent on CommentDeletedEvent {
      field {
        ...PetitionFieldReference_PetitionField
      }
      deletedBy {
        ... on User {
          id
          fullName
        }
        ... on Contact {
          ...ContactLink_Contact
        }
      }
      createdAt
    }
    ${PetitionFieldReference.fragments.PetitionField}
    ${ContactLink.fragments.Contact}
  `,
};
