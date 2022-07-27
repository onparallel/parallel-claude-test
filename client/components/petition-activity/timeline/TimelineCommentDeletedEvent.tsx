import { gql } from "@apollo/client";
import { CommentXIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineCommentDeletedEvent_CommentDeletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../PetitionFieldReference";
import { UserOrContactReference } from "../UserOrContactReference";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineCommentDeletedEventProps = {
  userId: string;
  event: TimelineCommentDeletedEvent_CommentDeletedEventFragment;
};

export function TimelineCommentDeletedEvent({
  userId,
  event: { deletedBy, field, createdAt, isInternal },
}: TimelineCommentDeletedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={CommentXIcon} color="gray.700" backgroundColor="gray.200" />}
      paddingY={2}
    >
      {isInternal ? (
        <FormattedMessage
          id="timeline.note-deleted"
          defaultMessage="{userIsYou, select, true {You} other {{someone}}} deleted a note on field {field} {timeAgo}"
          values={{
            userIsYou: deletedBy?.__typename === "User" && deletedBy?.id === userId,
            someone: <UserOrContactReference userOrAccess={deletedBy} />,
            field: <PetitionFieldReference field={field} />,
            timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
          }}
        />
      ) : (
        <FormattedMessage
          id="timeline.comment-deleted"
          defaultMessage="{userIsYou, select, true {You} other {{someone}}} deleted a comment on field {field} {timeAgo}"
          values={{
            userIsYou: deletedBy?.__typename === "User" && deletedBy?.id === userId,
            someone: <UserOrContactReference userOrAccess={deletedBy} />,
            field: <PetitionFieldReference field={field} />,
            timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
          }}
        />
      )}
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
        ...UserOrContactReference_UserOrPetitionAccess
      }
      isInternal
      createdAt
    }
    ${PetitionFieldReference.fragments.PetitionField}
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
  `,
};
