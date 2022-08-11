import { gql, useQuery } from "@apollo/client";
import { Box, Center, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import { CommentIcon, NoteIcon } from "@parallel/chakra/icons";
import { Card, CloseableCardHeader } from "@parallel/components/common/Card";
import {
  PetitionRepliesFieldComments_PetitionFieldFragment,
  PreviewPetitionFieldCommentsDialog_petitionFieldQueryDocument,
} from "@parallel/graphql/__types";
import { useGetMyId } from "@parallel/utils/apollo/getMyId";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import usePreviousValue from "beautiful-react-hooks/usePreviousValue";
import { useCallback, useEffect, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { Link } from "../common/Link";
import { PetitionFieldComment } from "../common/PetitionFieldComment";
import { PetitionCommentsAndNotesEditor } from "../petition-common/PetitionCommentsAndNotesEditor";

export interface PetitionRepliesFieldCommentsProps {
  petitionId: string;
  field: PetitionRepliesFieldComments_PetitionFieldFragment;
  onAddComment: (content: any, isNote: boolean) => Promise<void>;
  onDeleteComment: (petitionFieldCommentId: string) => void;
  onUpdateComment: (petitionFieldCommentId: string, content: any, isNote: boolean) => void;
  onMarkAsUnread: (petitionFieldCommentId: string) => void;
  onClose: () => void;
  isDisabled: boolean;
  onlyReadPermission: boolean;
}

export function PetitionRepliesFieldComments({
  petitionId,
  field,
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
      variables: { petitionId, petitionFieldId: field.id },
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

  const searchUsers = useSearchUsers();
  const myId = useGetMyId();
  const handleSearchMentionables = useCallback(
    async (search: string) => {
      return await searchUsers(search, { includeGroups: true, excludeUsers: [myId] });
    },
    [searchUsers]
  );

  return (
    <Card>
      <CloseableCardHeader onClose={onClose}>
        {field.title || (
          <Text fontWeight="normal" textStyle="hint">
            <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
          </Text>
        )}
      </CloseableCardHeader>
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
              <PetitionFieldComment
                key={comment.id}
                comment={comment}
                onSearchMentionables={handleSearchMentionables}
                onEdit={(content) => onUpdateComment(comment.id, content, comment.isInternal)}
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
          id={field.id}
          isDisabled={isDisabled}
          isTemplate={false}
          onSearchMentionables={handleSearchMentionables}
          hasCommentsEnabled={hasCommentsEnabled && !onlyReadPermission}
          onSubmit={async (content, isNote) => {
            await onAddComment(content, isNote);
          }}
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
