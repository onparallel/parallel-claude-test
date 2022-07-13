import { gql, useQuery } from "@apollo/client";
import { Box, Center, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import { CommentIcon, NoteIcon } from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import {
  PetitionRepliesFieldComments_PetitionFieldFragment,
  PreviewPetitionFieldCommentsDialog_petitionFieldQueryDocument,
} from "@parallel/graphql/__types";
import { isMetaReturn } from "@parallel/utils/keys";
import usePreviousValue from "beautiful-react-hooks/usePreviousValue";
import { KeyboardEvent, useEffect, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { FieldComment } from "../common/FieldComment";
import { Link } from "../common/Link";
import { PetitionCommentsAndNotesEditor } from "../petition-common/PetitionCommentsAndNotesEditor";

export interface PetitionRepliesFieldCommentsProps {
  petitionId: string;
  field: PetitionRepliesFieldComments_PetitionFieldFragment;
  myId: string;
  onAddComment: (value: string, internal?: boolean) => Promise<void>;
  onDeleteComment: (petitionFieldCommentId: string) => void;
  onUpdateComment: (petitionFieldCommentId: string, content: string) => void;
  onMarkAsUnread: (petitionFieldCommentId: string) => void;
  onClose: () => void;
  isDisabled: boolean;
  onlyReadPermission: boolean;
}

export function PetitionRepliesFieldComments({
  petitionId,
  field,
  myId,
  onAddComment,
  onDeleteComment,
  onUpdateComment,
  onMarkAsUnread,
  onClose,
  isDisabled,
  onlyReadPermission,
}: PetitionRepliesFieldCommentsProps) {
  const intl = useIntl();

  const hasCommentsEnabled = field.isInternal ? false : field.hasCommentsEnabled;

  const commentsRef = useRef<HTMLDivElement>(null);

  const { data, loading } = useQuery(
    PreviewPetitionFieldCommentsDialog_petitionFieldQueryDocument,
    {
      variables: {
        petitionId,
        petitionFieldId: field.id,
      },
      fetchPolicy: "cache-and-network",
    }
  );
  const comments = data?.petitionField.comments ?? [];

  // Scroll to bottom when a comment is added
  const previousCommentCount = usePreviousValue(comments.length);
  useEffect(() => {
    if (previousCommentCount === undefined || comments.length > previousCommentCount) {
      commentsRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
    }
  }, [comments, previousCommentCount]);

  async function handleKeyDown({
    event,
    content,
    isInternal,
  }: {
    event: KeyboardEvent<HTMLTextAreaElement>;
    content: string;
    isInternal: boolean;
  }) {
    if (isMetaReturn(event) && content) {
      event.preventDefault();
      await onAddComment(content, isInternal);
      return true;
    }
    return false;
  }

  async function handleSubmitClick({
    content,
    isInternal,
  }: {
    content: string;
    isInternal: boolean;
  }) {
    await onAddComment(content, isInternal);
  }

  return (
    <Card>
      <CardHeader isCloseable onClose={onClose}>
        {field.title || (
          <Text fontWeight="normal" textStyle="hint">
            <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
          </Text>
        )}
      </CardHeader>
      <Box
        maxHeight={{
          base: `calc(100vh - 364px)`,
          sm: `calc(100vh - 300px)`,
          md: `calc(100vh - 300px)`,
        }}
        overflow="auto"
        ref={commentsRef}
      >
        {loading && !comments.length ? (
          <Center minHeight={44}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="primary.500"
              size="xl"
            />
          </Center>
        ) : comments.length === 0 ? (
          <Flex
            flexDirection="column"
            paddingX={4}
            paddingY={8}
            justifyContent="center"
            alignItems="center"
          >
            {hasCommentsEnabled && !onlyReadPermission ? (
              <CommentIcon boxSize="64px" color="gray.200" />
            ) : (
              <Stack alignItems="center" textAlign="center">
                <NoteIcon boxSize="64px" color="gray.200" />
                {onlyReadPermission ? null : (
                  <>
                    <Text color="gray.400">
                      <FormattedMessage
                        id="petition-replies.field-comments.only-notes"
                        defaultMessage="This field only accepts notes"
                      />
                    </Text>
                    <Text color="gray.400">
                      <FormattedMessage
                        id="petition-replies.field-comments.disabled-comments-2"
                        defaultMessage="You can enable comments from the <a>Field settings</a> in the {composeTab} tab."
                        values={{
                          composeTab: intl.formatMessage({
                            id: "petition.header.compose-tab",
                            defaultMessage: "Compose",
                          }),
                          a: (chunks: any) => (
                            <Link
                              href={`/app/petitions/${petitionId}/compose#field-settings-${field.id}`}
                            >
                              {chunks}
                            </Link>
                          ),
                        }}
                      />
                    </Text>
                  </>
                )}
              </Stack>
            )}
          </Flex>
        ) : (
          <Stack spacing={0} divider={<Divider />}>
            {comments.map((comment) => (
              <FieldComment
                key={comment.id}
                comment={comment}
                isAuthor={myId === comment.author?.id}
                onEdit={(content) => onUpdateComment(comment.id, content)}
                onDelete={() => onDeleteComment(comment.id)}
                onMarkAsUnread={() => onMarkAsUnread(comment.id)}
              />
            ))}
          </Stack>
        )}
      </Box>
      <Divider />
      <Box paddingTop={2}>
        <PetitionCommentsAndNotesEditor
          isDisabled={isDisabled}
          isTemplate={false}
          hasCommentsEnabled={hasCommentsEnabled && !onlyReadPermission}
          onCommentKeyDown={async (event, content) =>
            await handleKeyDown({ event, content, isInternal: false })
          }
          onCommentSubmit={async (content) =>
            await handleSubmitClick({ content, isInternal: false })
          }
          onNotetKeyDown={async (event, content) =>
            await handleKeyDown({ event, content, isInternal: true })
          }
          onNoteSubmit={async (content) => await handleSubmitClick({ content, isInternal: true })}
        />
      </Box>
    </Card>
  );
}

PetitionRepliesFieldComments.fragments = {
  User: gql`
    fragment PetitionRepliesFieldComments_User on User {
      id
    }
  `,
  get PetitionField() {
    return gql`
      fragment PetitionRepliesFieldComments_PetitionField on PetitionField {
        id
        title
        type
        isInternal
        replies {
          ...PetitionRepliesFieldComments_PetitionFieldReply
        }
        hasCommentsEnabled
      }
      fragment PetitionRepliesFieldComments_PetitionFieldReply on PetitionFieldReply {
        id
        content
      }
    `;
  },
};
