import { gql } from "@apollo/client";
import { HStack, Text } from "@chakra-ui/react";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineReplyUpdatedEvent_ReplyUpdatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { PetitionFieldReference } from "../../../common/PetitionFieldReference";
import { UserOrContactReference } from "../../../common/UserOrContactReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";
import { TimelineSeeReplyButton } from "../common/TimelineSeeReplyButton";

export interface TimelineReplyUpdatedEventProps {
  event: TimelineReplyUpdatedEvent_ReplyUpdatedEventFragment;
}

export function TimelineReplyUpdatedEvent({
  event: { updatedBy, field, reply, createdAt },
}: TimelineReplyUpdatedEventProps) {
  const isChildren = field?.parent?.id !== undefined;

  let message = isChildren ? (
    <FormattedMessage
      id="component.timeline-reply-updated-event.description-children-of-group"
      defaultMessage="{someone} updated a reply to the field {field} from a group of {parentField} {timeAgo}"
      values={{
        someone: <UserOrContactReference userOrAccess={updatedBy} />,
        field: <PetitionFieldReference field={field} />,
        parentField: <PetitionFieldReference field={field.parent!} />,
        timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
      }}
    />
  ) : (
    <FormattedMessage
      id="component.timeline-reply-updated-event.description"
      defaultMessage="{someone} updated a reply to the field {field} {timeAgo}"
      values={{
        someone: <UserOrContactReference userOrAccess={updatedBy} />,
        field: <PetitionFieldReference field={field} />,
        timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
      }}
    />
  );

  if (field?.type === "BACKGROUND_CHECK") {
    message = isChildren ? (
      isNonNullish(reply?.content?.entity) ? (
        <FormattedMessage
          id="component.timeline-reply-updated-event.description-background-check-entity-children-of-group"
          defaultMessage="{someone} updated an entity in the field {field} from a group of {parentField} {timeAgo}"
          values={{
            someone: <UserOrContactReference userOrAccess={updatedBy} />,
            field: <PetitionFieldReference field={field} />,
            parentField: <PetitionFieldReference field={field.parent!} />,
            timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
          }}
        />
      ) : (
        <FormattedMessage
          id="component.timeline-reply-updated-event.description-background-check-search-children-of-group"
          defaultMessage="{someone} updated the search criteria in the field {field} from a group of {parentField} {timeAgo}"
          values={{
            someone: <UserOrContactReference userOrAccess={updatedBy} />,
            field: <PetitionFieldReference field={field} />,
            parentField: <PetitionFieldReference field={field.parent!} />,
            timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
          }}
        />
      )
    ) : isNonNullish(reply?.content?.entity) ? (
      <FormattedMessage
        id="component.timeline-reply-updated-event.description-background-check-entity"
        defaultMessage="{someone} updated an entity in the field {field} {timeAgo}"
        values={{
          someone: <UserOrContactReference userOrAccess={updatedBy} />,
          field: <PetitionFieldReference field={field} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    ) : (
      <FormattedMessage
        id="component.timeline-reply-updated-event.description-background-check-search"
        defaultMessage="{someone} updated the search criteria in the field {field} {timeAgo}"
        values={{
          someone: <UserOrContactReference userOrAccess={updatedBy} />,
          field: <PetitionFieldReference field={field} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    );
  }

  return (
    <TimelineItem
      icon={<TimelineIcon icon={PlusCircleIcon} color="gray.600" size="18px" />}
      paddingY={2}
    >
      <HStack spacing={2}>
        <Text>{message}</Text>
        <TimelineSeeReplyButton field={field} replyId={reply?.id} />
      </HStack>
    </TimelineItem>
  );
}

TimelineReplyUpdatedEvent.fragments = {
  ReplyUpdatedEvent: gql`
    fragment TimelineReplyUpdatedEvent_ReplyUpdatedEvent on ReplyUpdatedEvent {
      field {
        type
        ...PetitionFieldReference_PetitionField
        parent {
          ...PetitionFieldReference_PetitionField
        }
        ...TimelineSeeReplyButton_PetitionField
        ...PetitionFieldReference_PetitionField
      }
      updatedBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      reply {
        content
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
