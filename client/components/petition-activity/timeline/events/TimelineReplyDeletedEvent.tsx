import { gql } from "@apollo/client";
import { XCircleIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineReplyDeletedEvent_ReplyDeletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../../PetitionFieldReference";
import { UserOrContactReference } from "../../UserOrContactReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineReplyDeletedEventProps {
  event: TimelineReplyDeletedEvent_ReplyDeletedEventFragment;
  userId: string;
}

export function TimelineReplyDeletedEvent({
  event: { deletedBy, field, createdAt },
  userId,
}: TimelineReplyDeletedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={XCircleIcon} color="gray.600" size="18px" />}
      paddingY={2}
    >
      <FormattedMessage
        id="timeline.reply-deleted-description"
        defaultMessage="{userIsYou, select, true {You} other {{deletedBy}}} deleted a reply to the field {field} {timeAgo}"
        values={{
          userIsYou: deletedBy?.__typename === "User" && deletedBy.id === userId,
          deletedBy: <UserOrContactReference userOrAccess={deletedBy} />,
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
        ...UserOrContactReference_UserOrPetitionAccess
      }
      createdAt
    }
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${PetitionFieldReference.fragments.PetitionField}
  `,
};
