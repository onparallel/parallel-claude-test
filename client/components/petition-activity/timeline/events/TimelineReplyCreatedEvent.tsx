import { gql } from "@apollo/client";
import { HStack, Text } from "@chakra-ui/react";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineReplyCreatedEvent_ReplyCreatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { PetitionFieldReference } from "../../../common/PetitionFieldReference";
import { UserOrContactReference } from "../../../common/UserOrContactReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";
import { TimelineSeeReplyButton } from "../common/TimelineSeeReplyButton";

export interface TimelineReplyCreatedEventProps {
  event: TimelineReplyCreatedEvent_ReplyCreatedEventFragment;
}

export function TimelineReplyCreatedEvent({
  event: { createdBy, field, reply, createdAt },
}: TimelineReplyCreatedEventProps) {
  const isChildren = field?.parent?.id !== undefined;

  let message = isChildren ? (
    <FormattedMessage
      id="component.timeline-reply-created-event.description-children-of-group"
      defaultMessage="{someone} replied to the field {field} from a group of {parentField} {timeAgo}"
      values={{
        someone: <UserOrContactReference userOrAccess={createdBy} />,
        field: <PetitionFieldReference field={field} />,
        parentField: <PetitionFieldReference field={field.parent!} />,
        timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
      }}
    />
  ) : (
    <FormattedMessage
      id="component.timeline-reply-created-event.description"
      defaultMessage="{someone} replied to the field {field} {timeAgo}"
      values={{
        someone: <UserOrContactReference userOrAccess={createdBy} />,
        field: <PetitionFieldReference field={field} />,
        timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
      }}
    />
  );

  if (field?.type === "BACKGROUND_CHECK") {
    message = isChildren ? (
      isNonNullish(reply?.content?.entity) ? (
        <FormattedMessage
          id="component.timeline-reply-created-event.description-background-check-entity-children-of-group"
          defaultMessage="{someone} saved an entity in the field {field} from a group of {parentField} {timeAgo}"
          values={{
            someone: <UserOrContactReference userOrAccess={createdBy} />,
            field: <PetitionFieldReference field={field} />,
            parentField: <PetitionFieldReference field={field.parent!} />,
            timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
          }}
        />
      ) : (
        <FormattedMessage
          id="component.timeline-reply-created-event.description-background-check-search-children-of-group"
          defaultMessage="A search was saved in the field {field} from a group of {parentField} {timeAgo}"
          values={{
            field: <PetitionFieldReference field={field} />,
            parentField: <PetitionFieldReference field={field.parent!} />,
            timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
          }}
        />
      )
    ) : isNonNullish(reply?.content?.entity) ? (
      <FormattedMessage
        id="component.timeline-reply-created-event.description-background-check-entity"
        defaultMessage="{someone} saved an entity in the field {field} {timeAgo}"
        values={{
          someone: <UserOrContactReference userOrAccess={createdBy} />,
          field: <PetitionFieldReference field={field} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    ) : (
      <FormattedMessage
        id="component.timeline-reply-created-event.description-background-check-search"
        defaultMessage="A search was saved in the field {field} {timeAgo}"
        values={{
          field: <PetitionFieldReference field={field} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    );
  }

  if (field?.type === "FIELD_GROUP") {
    message = (
      <FormattedMessage
        id="component.timeline-reply-created-event.description-field-group"
        defaultMessage="{someone} added a group to the field {field} {timeAgo}"
        values={{
          someone: <UserOrContactReference userOrAccess={createdBy} />,
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

const _fragments = {
  ReplyCreatedEvent: gql`
    fragment TimelineReplyCreatedEvent_ReplyCreatedEvent on ReplyCreatedEvent {
      field {
        id
        type
        options
        parent {
          id
          ...PetitionFieldReference_PetitionField
        }
        ...TimelineSeeReplyButton_PetitionField
        ...PetitionFieldReference_PetitionField
      }
      createdBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      reply {
        ...TimelineSeeReplyButton_PetitionFieldReply
        content
      }
      createdAt
    }
  `,
};
