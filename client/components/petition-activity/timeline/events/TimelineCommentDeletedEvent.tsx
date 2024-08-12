import { gql } from "@apollo/client";
import { CommentXIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineCommentDeletedEvent_CommentDeletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../../../common/PetitionFieldReference";
import { UserOrContactReference } from "../../../common/UserOrContactReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineCommentDeletedEventProps {
  event: TimelineCommentDeletedEvent_CommentDeletedEventFragment;
}

export function TimelineCommentDeletedEvent({
  event: { deletedBy, field, createdAt, isInternal, isGeneral },
}: TimelineCommentDeletedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={CommentXIcon} color="gray.700" backgroundColor="gray.200" />}
      paddingY={2}
    >
      {isGeneral ? (
        isInternal ? (
          <FormattedMessage
            id="component.timeline-comment-deleted-event.general-note-deleted"
            defaultMessage="{someone} deleted a note in <b>General</b> {timeAgo}"
            values={{
              someone: <UserOrContactReference userOrAccess={deletedBy} />,
              timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
            }}
          />
        ) : (
          <FormattedMessage
            id="component.timeline-comment-deleted-event.general-comment-deleted"
            defaultMessage="{someone} deleted a comment in <b>General</b> {timeAgo}"
            values={{
              someone: <UserOrContactReference userOrAccess={deletedBy} />,
              timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
            }}
          />
        )
      ) : isInternal ? (
        <FormattedMessage
          id="component.timeline-comment-deleted-event.note-deleted"
          defaultMessage="{someone} deleted a note on field {field} {timeAgo}"
          values={{
            someone: <UserOrContactReference userOrAccess={deletedBy} />,
            field: <PetitionFieldReference field={field} />,
            timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
          }}
        />
      ) : (
        <FormattedMessage
          id="component.timeline-comment-deleted-event.comment-deleted"
          defaultMessage="{someone} deleted a comment on field {field} {timeAgo}"
          values={{
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
      isGeneral
      createdAt
    }
    ${PetitionFieldReference.fragments.PetitionField}
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${ContactReference.fragments.Contact}
  `,
};
