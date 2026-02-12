import { gql } from "@apollo/client";

import { CircleCheckIcon, TimeIcon, XCircleIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineReplyStatusChangedEvent_ReplyStatusChangedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../../../common/PetitionFieldReference";
import { UserOrContactReference } from "../../../common/UserOrContactReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";
import { TimelineSeeReplyButton } from "../common/TimelineSeeReplyButton";
import { HStack, Text } from "@parallel/components/ui";

export interface TimelineReplyStatusChangedEventProps {
  event: TimelineReplyStatusChangedEvent_ReplyStatusChangedEventFragment;
}

export function TimelineReplyStatusChangedEvent({
  event: { updatedBy, field, reply, status, createdAt },
}: TimelineReplyStatusChangedEventProps) {
  const timeLineIcon =
    status === "APPROVED" ? (
      <TimelineIcon icon={CircleCheckIcon} color="green.600" size="18px" />
    ) : status === "REJECTED" ? (
      <TimelineIcon icon={XCircleIcon} color="red.600" size="18px" />
    ) : (
      <TimelineIcon icon={TimeIcon} color="gray.600" size="18px" />
    );

  return (
    <TimelineItem icon={timeLineIcon} paddingY={2}>
      <HStack gap={2}>
        <Text>
          <FormattedMessage
            id="component.timeline-reply-status-changed-event.description"
            defaultMessage="{someone} {status, select, APPROVED{approved} REJECTED{rejected} other{set as pending}} {multiple, select, true{one of the replies} other {a reply}} to the field {field} {timeAgo}"
            values={{
              someone: <UserOrContactReference userOrAccess={updatedBy} />,
              status,
              multiple: field?.multiple ?? false,
              field: <PetitionFieldReference field={field} />,
              timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
            }}
          />
        </Text>
        <TimelineSeeReplyButton field={field} replyId={reply?.id} />
      </HStack>
    </TimelineItem>
  );
}

const _fragments = {
  ReplyStatusChangedEvent: gql`
    fragment TimelineReplyStatusChangedEvent_ReplyStatusChangedEvent on ReplyStatusChangedEvent {
      field {
        id
        multiple
        ...TimelineSeeReplyButton_PetitionField
        ...PetitionFieldReference_PetitionField
      }
      updatedBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      reply {
        ...TimelineSeeReplyButton_PetitionFieldReply
      }
      status
      createdAt
    }
  `,
};
