import { gql } from "@apollo/client";
import { Box, Button, Stack, Text, useTheme } from "@chakra-ui/react";
import { CommentIcon, NoteIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { Divider } from "@parallel/components/common/Divider";
import { PetitionFieldCommentContent } from "@parallel/components/common/PetitionFieldCommentContent";
import { TimelineCommentPublishedEvent_CommentPublishedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useGoToPetitionSection } from "@parallel/utils/goToPetition";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../PetitionFieldReference";
import { UserOrContactReference } from "../UserOrContactReference";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineCommentPublishedEventProps = {
  userId: string;
  event: TimelineCommentPublishedEvent_CommentPublishedEventFragment;
};

export function TimelineCommentPublishedEvent({
  userId,
  event: { comment, field, createdAt, isInternal },
}: TimelineCommentPublishedEventProps) {
  const { colors } = useTheme();
  const values = {
    field: <PetitionFieldReference field={field} />,
    timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
  };
  if (comment) {
    const { author, isEdited } = comment;

    const goToSection = useGoToPetitionSection();
    const handlePreviewComment = () => {
      if (field) {
        goToSection("replies", {
          query: {
            comments: field.id,
          },
        });
      }
    };

    return (
      <Box
        background={`${colors.transparent} linear-gradient(${colors.gray[300]}, ${colors.gray[300]}) no-repeat 17px / 2px 100%`}
        paddingY={4}
        width="680px"
        maxWidth="100%"
      >
        <Card overflow="hidden">
          <Stack
            paddingX={4}
            paddingY={2}
            backgroundColor="gray.50"
            direction={{ base: "column", md: "row" }}
            alignItems={{ base: "start", md: "center" }}
            spacing={3}
          >
            <Box>
              {isInternal ? (
                <FormattedMessage
                  id="timeline.note-published-description"
                  defaultMessage="{userIsYou, select, true {You have} other {{author} has}} added a note in the field {field} {timeAgo}"
                  values={{
                    ...values,
                    userIsYou: author?.__typename === "User" && author?.id === userId,
                    author: <UserOrContactReference userOrAccess={author} />,
                  }}
                />
              ) : (
                <FormattedMessage
                  id="timeline.comment-published-description"
                  defaultMessage="{userIsYou, select, true {You} other {{author}}} commented on field {field} {timeAgo}"
                  values={{
                    ...values,
                    userIsYou: author?.__typename === "User" && author?.id === userId,
                    author: <UserOrContactReference userOrAccess={author} />,
                  }}
                />
              )}

              {isEdited ? (
                <Text as="span" textStyle="hint" marginLeft={2} fontSize="sm">
                  <FormattedMessage id="generic.edited-indicator" defaultMessage="Edited" />
                </Text>
              ) : null}
            </Box>
            <Box>
              <Button variant="outline" backgroundColor="white" onClick={handlePreviewComment}>
                <FormattedMessage id="timeline.comment-published.reply" defaultMessage="Reply" />
              </Button>
            </Box>
          </Stack>
          <Divider />
          <Box padding={4}>
            {comment.isAnonymized ? (
              <Text textStyle="hint">
                <FormattedMessage
                  id="timeline.comment-published.message-not-available"
                  defaultMessage="Message not available"
                />
              </Text>
            ) : (
              <PetitionFieldCommentContent comment={comment} />
            )}
          </Box>
        </Card>
      </Box>
    );
  } else {
    return (
      <TimelineItem
        icon={
          <TimelineIcon
            icon={isInternal ? NoteIcon : CommentIcon}
            color="black"
            backgroundColor="gray.200"
          />
        }
        paddingY={2}
      >
        {isInternal ? (
          <FormattedMessage
            id="timeline.note-published-deleted"
            defaultMessage="Someone wrote a (now deleted) note on field {field} {timeAgo}"
            values={{
              ...values,
            }}
          />
        ) : (
          <FormattedMessage
            id="timeline.comment-published-deleted"
            defaultMessage="Someone wrote a (now deleted) comment on field {field} {timeAgo}"
            values={{
              ...values,
            }}
          />
        )}
      </TimelineItem>
    );
  }
}

TimelineCommentPublishedEvent.fragments = {
  CommentPublishedEvent: gql`
    fragment TimelineCommentPublishedEvent_CommentPublishedEvent on CommentPublishedEvent {
      field {
        id
        ...PetitionFieldReference_PetitionField
      }
      comment {
        author {
          ...UserOrContactReference_UserOrPetitionAccess
        }
        isEdited
        isAnonymized
        ...PetitionFieldCommentContent_PetitionFieldComment
      }
      isInternal
      createdAt
    }
    ${PetitionFieldReference.fragments.PetitionField}
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
    ${PetitionFieldCommentContent.fragments.PetitionFieldComment}
  `,
};
