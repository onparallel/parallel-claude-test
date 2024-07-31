import { gql } from "@apollo/client";
import { Box, Button, Stack, Text, useTheme } from "@chakra-ui/react";
import { CommentIcon, NoteIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { Divider } from "@parallel/components/common/Divider";
import { NakedLink } from "@parallel/components/common/Link";
import { PetitionFieldCommentContent } from "@parallel/components/common/PetitionFieldCommentContent";
import { TimelineCommentPublishedEvent_CommentPublishedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { FormattedMessage } from "react-intl";
import { PetitionFieldReference } from "../../../common/PetitionFieldReference";
import { UserOrContactReference } from "../../../common/UserOrContactReference";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineCommentPublishedEventProps {
  userId: string;
  event: TimelineCommentPublishedEvent_CommentPublishedEventFragment;
}

export function TimelineCommentPublishedEvent({
  userId,
  event: { comment, field, createdAt, isInternal, isGeneral },
}: TimelineCommentPublishedEventProps) {
  const { colors } = useTheme();
  const values = {
    field: <PetitionFieldReference field={field} />,
    timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
  };
  const generalValues = {
    general: (
      <b>
        <FormattedMessage id="generic.general-comments-label" defaultMessage="General" />
      </b>
    ),
    timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
  };
  if (comment) {
    const { author, isEdited } = comment;

    const buildUrlToSection = useBuildUrlToPetitionSection();

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
            <Box flex={1}>
              {isGeneral ? (
                isInternal ? (
                  <FormattedMessage
                    id="component.timeline-comment-published-event.general-note"
                    defaultMessage="{userIsYou, select, true {You have} other {{author} has}} added a note in {general} {timeAgo}"
                    values={{
                      ...generalValues,
                      userIsYou: author?.__typename === "User" && author?.id === userId,
                      author: <UserOrContactReference userOrAccess={author} />,
                    }}
                  />
                ) : (
                  <FormattedMessage
                    id="component.timeline-comment-published-event.general-comment"
                    defaultMessage="{userIsYou, select, true {You} other {{author}}} commented in {general} {timeAgo}"
                    values={{
                      ...generalValues,
                      userIsYou: author?.__typename === "User" && author?.id === userId,
                      author: <UserOrContactReference userOrAccess={author} />,
                    }}
                  />
                )
              ) : isInternal ? (
                <FormattedMessage
                  id="component.timeline-comment-published-event.note"
                  defaultMessage="{userIsYou, select, true {You have} other {{author} has}} added a note in the field {field} {timeAgo}"
                  values={{
                    ...values,
                    userIsYou: author?.__typename === "User" && author?.id === userId,
                    author: <UserOrContactReference userOrAccess={author} />,
                  }}
                />
              ) : (
                <FormattedMessage
                  id="component.timeline-comment-published-event.comment"
                  defaultMessage="{userIsYou, select, true {You} other {{author}}} commented on field {field} {timeAgo}"
                  values={{
                    ...values,
                    userIsYou: author?.__typename === "User" && author?.id === userId,
                    author: <UserOrContactReference userOrAccess={author} />,
                  }}
                />
              )}

              {isEdited ? (
                <Text as="span" textStyle="hint" marginStart={2} fontSize="sm">
                  <FormattedMessage id="generic.edited-indicator" defaultMessage="Edited" />
                </Text>
              ) : null}
            </Box>
            {field || isGeneral ? (
              <Box>
                <NakedLink
                  href={buildUrlToSection("replies", {
                    comments: isGeneral ? "general" : field!.id,
                  })}
                >
                  <Button as="a" variant="outline" backgroundColor="white">
                    <FormattedMessage
                      id="component.timeline-comment-published-event.reply-comment"
                      defaultMessage="Reply"
                    />
                  </Button>
                </NakedLink>
              </Box>
            ) : null}
          </Stack>
          <Divider />
          <Box padding={4}>
            {comment.isAnonymized ? (
              <Text textStyle="hint">
                <FormattedMessage
                  id="component.timeline-comment-published-event.message-not-available"
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
        {isGeneral ? (
          isInternal ? (
            <FormattedMessage
              id="component.timeline-comment-published-event.general-note-published-deleted"
              defaultMessage="Someone wrote a (now deleted) note in {general} {timeAgo}"
              values={{
                ...generalValues,
              }}
            />
          ) : (
            <FormattedMessage
              id="component.timeline-comment-published-event.general-comment-published-deleted"
              defaultMessage="Someone wrote a (now deleted) comment in {general} {timeAgo}"
              values={{
                ...generalValues,
              }}
            />
          )
        ) : isInternal ? (
          <FormattedMessage
            id="component.timeline-comment-published-event.note-published-deleted"
            defaultMessage="Someone wrote a (now deleted) note on field {field} {timeAgo}"
            values={{
              ...values,
            }}
          />
        ) : (
          <FormattedMessage
            id="component.timeline-comment-published-event.comment-published-deleted"
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
      isGeneral
      createdAt
    }
    ${PetitionFieldReference.fragments.PetitionField}
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
    ${PetitionFieldCommentContent.fragments.PetitionFieldComment}
  `,
};
