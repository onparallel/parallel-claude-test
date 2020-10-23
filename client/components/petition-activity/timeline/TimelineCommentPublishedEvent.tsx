import { gql } from "@apollo/client";
import { Box, Text, useTheme } from "@chakra-ui/core";
import { CommentIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { Divider } from "@parallel/components/common/Divider";
import { TimelineCommentPublishedEvent_CommentPublishedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../PetitionFieldReference";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

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
      <DateTime
        value={createdAt}
        format={FORMATS.LLL}
        useRelativeTime="always"
      />
    ),
  };
  if (comment) {
    const { author, content, isEdited } = comment;
    return (
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
                same: author?.__typename === "User" && author?.id === userId,
                author:
                  author?.__typename === "PetitionAccess" ? (
                    author.contact ? (
                      <ContactLink contact={author.contact} />
                    ) : (
                      <DeletedContact />
                    )
                  ) : (
                    <UserReference user={author as any} />
                  ),
              }}
            />
            {isEdited ? (
              <Text as="span" textStyle="hint" marginLeft={2} fontSize="sm">
                <FormattedMessage
                  id="generic.edited-comment-indicator"
                  defaultMessage="Edited"
                />
              </Text>
            ) : null}
          </Box>
          <Divider />
          <Box padding={4}>{content}</Box>
        </Card>
      </Box>
    );
  } else {
    return (
      <TimelineItem
        icon={
          <TimelineIcon
            icon={<CommentIcon />}
            color="black"
            backgroundColor="gray.200"
          />
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
            ...UserReference_User
          }
          ... on PetitionAccess {
            contact {
              ...ContactLink_Contact
            }
          }
        }
        isEdited
        content
      }
      createdAt
    }
    ${PetitionFieldReference.fragments.PetitionField}
    ${UserReference.fragments.User}
    ${ContactLink.fragments.Contact}
  `,
};
