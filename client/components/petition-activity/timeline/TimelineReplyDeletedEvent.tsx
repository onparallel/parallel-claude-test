import { TimelineReplyDeletedEvent_ReplyDeletedEventFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { Text, Link } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { DateTime } from "@parallel/components/common/DateTime";
import { FORMATS } from "@parallel/utils/dates";

export type TimelineReplyDeletedEventProps = {
  event: TimelineReplyDeletedEvent_ReplyDeletedEventFragment;
};

export function TimelineReplyDeletedEvent({
  event: { access, field, createdAt },
}: TimelineReplyDeletedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon="x-circle" color="gray.600" size="18px" />}
      paddingY={2}
    >
      <FormattedMessage
        id="timeline.reply-deleted-description"
        defaultMessage="{contact} deleted a reply to the field {title} {timeAgo}"
        values={{
          contact: access.contact ? (
            <ContactLink contact={access.contact} />
          ) : (
            <DeletedContact />
          ),
          title: <FieldTitle field={field} />,
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

function FieldTitle({
  field,
}: {
  field: TimelineReplyDeletedEvent_ReplyDeletedEventFragment["field"];
}) {
  return (
    <Text as="span" display="inline" marginX="2px">
      {field ? (
        field.title ? (
          <Text as="strong">{field.title}</Text>
        ) : (
          <Text as="span" color="gray.400" fontStyle="italic">
            <FormattedMessage
              id="timeline.reply-created-field-no-title"
              defaultMessage="No title"
            />
          </Text>
        )
      ) : (
        <Text as="span" color="gray.400" fontStyle="italic">
          <FormattedMessage
            id="timeline.reply-created-deleted-field"
            defaultMessage="Deleted field"
          />
        </Text>
      )}
    </Text>
  );
}

TimelineReplyDeletedEvent.fragments = {
  ReplyDeletedEvent: gql`
    fragment TimelineReplyDeletedEvent_ReplyDeletedEvent on ReplyDeletedEvent {
      access {
        contact {
          ...ContactLink_Contact
        }
      }
      field {
        title
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
