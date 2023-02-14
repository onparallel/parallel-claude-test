import { gql } from "@apollo/client";
import { HStack, Text } from "@chakra-ui/react";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineReplyCreatedEvent_ReplyCreatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../../PetitionFieldReference";
import { UserOrContactReference } from "../../UserOrContactReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";
import { TimelineSeeReplyButton } from "../common/TimelineSeeReplyButton";

export type TimelineReplyCreatedEventProps = {
  event: TimelineReplyCreatedEvent_ReplyCreatedEventFragment;
  userId: string;
};

export function TimelineReplyCreatedEvent({
  event: { createdBy, field, reply, createdAt },
  userId,
}: TimelineReplyCreatedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={PlusCircleIcon} color="gray.600" size="18px" />}
      paddingY={2}
    >
      <HStack spacing={2}>
        <Text>
          <FormattedMessage
            id="timeline.reply-created-description"
            defaultMessage="{userIsYou, select, true {You} other {{createdBy}}} replied to the field {field} {timeAgo}"
            values={{
              userIsYou: createdBy?.__typename === "User" && createdBy.id === userId,
              createdBy: <UserOrContactReference userOrAccess={createdBy} />,
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

TimelineReplyCreatedEvent.fragments = {
  ReplyCreatedEvent: gql`
    fragment TimelineReplyCreatedEvent_ReplyCreatedEvent on ReplyCreatedEvent {
      field {
        ...TimelineSeeReplyButton_PetitionField
        ...PetitionFieldReference_PetitionField
      }
      createdBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      reply {
        ...TimelineSeeReplyButton_PetitionFieldReply
      }
      createdAt
    }
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${TimelineSeeReplyButton.fragments.PetitionField}
    ${TimelineSeeReplyButton.fragments.PetitionFieldReply}
    ${PetitionFieldReference.fragments.PetitionField}
  `,
};
