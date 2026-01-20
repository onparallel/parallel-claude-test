import { gql } from "@apollo/client";
import { XCircleIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineReplyDeletedEvent_ReplyDeletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../../../common/PetitionFieldReference";
import { UserOrContactReference } from "../../../common/UserOrContactReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineReplyDeletedEventProps {
  event: TimelineReplyDeletedEvent_ReplyDeletedEventFragment;
}

export function TimelineReplyDeletedEvent({
  event: { deletedBy, field, createdAt },
}: TimelineReplyDeletedEventProps) {
  const isChildren = field?.parent?.id !== undefined;

  let message = isChildren ? (
    <FormattedMessage
      id="component.timeline-reply-deleted-event.description-children-of-group"
      defaultMessage="{someone} deleted a reply to the field {field} from a group of {parentField} {timeAgo}"
      values={{
        someone: <UserOrContactReference userOrAccess={deletedBy} />,
        field: <PetitionFieldReference field={field} />,
        parentField: <PetitionFieldReference field={field.parent!} />,
        timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
      }}
    />
  ) : (
    <FormattedMessage
      id="component.timeline-reply-deleted-event.description"
      defaultMessage="{someone} deleted a reply to the field {field} {timeAgo}"
      values={{
        someone: <UserOrContactReference userOrAccess={deletedBy} />,
        field: <PetitionFieldReference field={field} />,
        timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
      }}
    />
  );

  if (field?.type === "BACKGROUND_CHECK") {
    message = isChildren ? (
      <FormattedMessage
        id="component.timeline-reply-deleted-event.description-background-check-children-of-group"
        defaultMessage="{someone} removed the search criteria/entity saved in the field {field} from a group of {parentField} {timeAgo}"
        values={{
          someone: <UserOrContactReference userOrAccess={deletedBy} />,
          field: <PetitionFieldReference field={field} />,
          parentField: <PetitionFieldReference field={field.parent!} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    ) : (
      <FormattedMessage
        id="component.timeline-reply-deleted-event.description-background-check"
        defaultMessage="{someone} removed the search criteria/entity saved in the field {field} {timeAgo}"
        values={{
          someone: <UserOrContactReference userOrAccess={deletedBy} />,
          field: <PetitionFieldReference field={field} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    );
  }

  if (field?.type === "FIELD_GROUP") {
    message = (
      <FormattedMessage
        id="component.timeline-reply-deleted-event.description--field-group"
        defaultMessage="{someone} deleted a group {field} and all its replies {timeAgo}"
        values={{
          someone: <UserOrContactReference userOrAccess={deletedBy} />,
          field: <PetitionFieldReference field={field} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    );
  }

  return (
    <TimelineItem
      icon={<TimelineIcon icon={XCircleIcon} color="gray.600" size="18px" />}
      paddingY={2}
    >
      {message}
    </TimelineItem>
  );
}

const _fragments = {
  ReplyDeletedEvent: gql`
    fragment TimelineReplyDeletedEvent_ReplyDeletedEvent on ReplyDeletedEvent {
      field {
        type
        ...PetitionFieldReference_PetitionField
        parent {
          ...PetitionFieldReference_PetitionField
        }
      }
      deletedBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      createdAt
    }
  `,
};
