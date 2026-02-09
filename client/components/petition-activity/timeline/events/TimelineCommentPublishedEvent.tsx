import { gql } from "@apollo/client";
import { Box, Stack, useTheme } from "@chakra-ui/react";
import { CommentIcon, NoteIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { DateTime } from "@parallel/components/common/DateTime";
import { Divider } from "@parallel/components/common/Divider";
import NextLink from "next/link";
import { PetitionFieldCommentContent } from "@parallel/components/common/PetitionFieldCommentContent";
import { TimelineCommentPublishedEvent_CommentPublishedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";

import { FormattedMessage } from "react-intl";
import { assert } from "ts-essentials";
import { PetitionFieldReference } from "../../../common/PetitionFieldReference";
import { UserOrContactReference } from "../../../common/UserOrContactReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";
import { Button, Text } from "@parallel/components/ui";

export interface TimelineCommentPublishedEventProps {
  event: TimelineCommentPublishedEvent_CommentPublishedEventFragment;
}
const getCommentTitle = ({
  event: { isGeneral, isInternal, comment, createdAt, field },
}: TimelineCommentPublishedEventProps) => {
  assert(comment, "Comment must be defined");
  const author = comment.author;
  const timeAgo = <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />;

  if (isGeneral) {
    return comment.isApproval ? (
      <FormattedMessage
        id="component.timeline-comment-published-event.general-approval-note"
        defaultMessage="{author} added an evaluation in <b>General</b> {timeAgo}"
        values={{ author: <UserOrContactReference userOrAccess={author} />, timeAgo }}
      />
    ) : isInternal ? (
      <FormattedMessage
        id="component.timeline-comment-published-event.general-note"
        defaultMessage="{author} added a note in <b>General</b> {timeAgo}"
        values={{ author: <UserOrContactReference userOrAccess={author} />, timeAgo }}
      />
    ) : (
      <FormattedMessage
        id="component.timeline-comment-published-event.general-comment"
        defaultMessage="{author} commented in <b>General</b> {timeAgo}"
        values={{ author: <UserOrContactReference userOrAccess={author} />, timeAgo }}
      />
    );
  } else {
    return isInternal ? (
      <FormattedMessage
        id="component.timeline-comment-published-event.note"
        defaultMessage="{author} added a note in the field {field} {timeAgo}"
        values={{
          field: <PetitionFieldReference field={field} />,
          timeAgo,
          author: <UserOrContactReference userOrAccess={author} />,
        }}
      />
    ) : (
      <FormattedMessage
        id="component.timeline-comment-published-event.comment"
        defaultMessage="{author} commented on field {field} {timeAgo}"
        values={{
          field: <PetitionFieldReference field={field} />,
          timeAgo,
          author: <UserOrContactReference userOrAccess={author} />,
        }}
      />
    );
  }
};

const getDeletedCommentTitle = ({
  event: { isGeneral, isInternal, createdAt, field },
}: TimelineCommentPublishedEventProps) => {
  const timeAgo = <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />;
  if (isGeneral) {
    return isInternal ? (
      <FormattedMessage
        id="component.timeline-comment-published-event.general-note-published-deleted"
        defaultMessage="Someone wrote a (now deleted) note in <b>General</b> {timeAgo}"
        values={{ timeAgo }}
      />
    ) : (
      <FormattedMessage
        id="component.timeline-comment-published-event.general-comment-published-deleted"
        defaultMessage="Someone wrote a (now deleted) comment in <b>General</b> {timeAgo}"
        values={{ timeAgo }}
      />
    );
  } else {
    return isInternal ? (
      <FormattedMessage
        id="component.timeline-comment-published-event.note-published-deleted"
        defaultMessage="Someone wrote a (now deleted) note on field {field} {timeAgo}"
        values={{
          field: <PetitionFieldReference field={field} />,
          timeAgo,
        }}
      />
    ) : (
      <FormattedMessage
        id="component.timeline-comment-published-event.comment-published-deleted"
        defaultMessage="Someone wrote a (now deleted) comment on field {field} {timeAgo}"
        values={{
          field: <PetitionFieldReference field={field} />,
          timeAgo,
        }}
      />
    );
  }
};

export function TimelineCommentPublishedEvent({ event }: TimelineCommentPublishedEventProps) {
  const { colors } = useTheme();

  const { comment, field, isInternal, isGeneral } = event;
  if (comment) {
    const { isEdited } = comment;

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
              {getCommentTitle({ event })}
              {isEdited ? (
                <Text as="span" textStyle="hint" marginStart={2} fontSize="sm">
                  <FormattedMessage id="generic.edited-indicator" defaultMessage="Edited" />
                </Text>
              ) : null}
            </Box>
            {field || isGeneral ? (
              <Box>
                <Button
                  as={NextLink}
                  href={buildUrlToSection("replies", {
                    comments: isGeneral ? "general" : field!.id,
                  })}
                  variant="outline"
                  backgroundColor="white"
                >
                  <FormattedMessage
                    id="component.timeline-comment-published-event.reply-comment"
                    defaultMessage="Reply"
                  />
                </Button>
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
        {getDeletedCommentTitle({ event })}
      </TimelineItem>
    );
  }
}

const _fragments = {
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
        isApproval
      }
      isInternal
      isGeneral
      createdAt
    }
  `,
};
