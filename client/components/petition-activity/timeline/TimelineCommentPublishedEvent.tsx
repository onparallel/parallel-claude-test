import { TimelineCommentPublishedEvent_CommentPublishedEventFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { Text, Link, Box, useTheme, Icon, Flex } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { DateTime } from "@parallel/components/common/DateTime";
import { FORMATS } from "@parallel/utils/dates";
import { PetitionFieldReference } from "../PetitionFieldReference";
import { Card } from "@parallel/components/common/Card";
import { Divider } from "@parallel/components/common/Divider";

export type TimelineCommentPublishedEventProps = {
  userId: string;
  event: TimelineCommentPublishedEvent_CommentPublishedEventFragment;
};

export function TimelineCommentPublishedEvent({
  userId,
  event: { comment, field, createdAt },
}: TimelineCommentPublishedEventProps) {
  const { colors } = useTheme();
  const values = {
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
  };
  return comment ? (
    <Box
      background={`${colors.transparent} linear-gradient(${colors.gray[300]}, ${colors.gray[300]}) no-repeat 17px / 2px 100%`}
      paddingY={4}
      width="680px"
      maxWidth="100%"
    >
      <Card overflow="hidden">
        <Box paddingX={4} paddingY={2} backgroundColor="gray.50">
          <FormattedMessage
            id="timeline.comment-published-description"
            defaultMessage="{same, select, true {You} other {{author}}} commented on field {field} {timeAgo}"
            values={{
              ...values,
              same: comment.author?.id === userId,
              author:
                comment.author?.__typename === "Contact" ? (
                  <ContactLink contact={comment.author} />
                ) : comment.author?.__typename === "User" ? (
                  comment.author.fullName
                ) : (
                  <DeletedContact />
                ),
            }}
          />
          {comment.isEdited ? (
            <Text as="span" color="gray.400" marginLeft={2} fontSize="sm">
              <FormattedMessage
                id="generic.edited-comment-indicator"
                defaultMessage="Edited"
              />
            </Text>
          ) : null}
        </Box>
        <Divider />
        <Box padding={4}>{comment.content}</Box>
      </Card>
    </Box>
  ) : (
    <TimelineItem
      icon={
        <TimelineIcon icon="comment" color="black" backgroundColor="gray.200" />
      }
      paddingY={2}
    >
      <FormattedMessage
        id="timeline.comment-published-deleted"
        defaultMessage="Someone wrote a (now deleted) comment on field {field} {timeAgo}"
        values={{
          ...values,
        }}
      />
    </TimelineItem>
  );
}

TimelineCommentPublishedEvent.fragments = {
  CommentPublishedEvent: gql`
    fragment TimelineCommentPublishedEvent_CommentPublishedEvent on CommentPublishedEvent {
      field {
        ...PetitionFieldReference_PetitionField
      }
      comment {
        author {
          ... on User {
            id
            fullName
          }
          ... on Contact {
            ...ContactLink_Contact
          }
        }
        isEdited
        content
      }
      createdAt
    }
    ${PetitionFieldReference.fragments.PetitionField}
    ${ContactLink.fragments.Contact}
  `,
};
