import { gql, useQuery } from "@apollo/client";
import { Box, Center, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import { CommentIcon, NoteIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card, CloseableCardHeader } from "@parallel/components/common/Card";
import {
  PetitionRepliesFieldComments_PetitionFieldFragment,
  PetitionRepliesFieldComments_petitionFieldQueryDocument,
} from "@parallel/graphql/__types";
import { useGetMyId } from "@parallel/utils/apollo/getMyId";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { useGetDefaultMentionables } from "@parallel/utils/useGetDefaultMentionables";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useTimeoutEffect } from "@parallel/utils/useTimeoutEffect";
import usePrevious from "@react-hook/previous";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { Link } from "../common/Link";
import { PetitionFieldComment } from "../common/PetitionFieldComment";
import {
  PetitionCommentsAndNotesEditor,
  PetitionCommentsAndNotesEditorInstance,
} from "../petition-common/PetitionCommentsAndNotesEditor";

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

export const PetitionRepliesFieldComments = Object.assign(
  chakraForwardRef<"section", PetitionRepliesFieldCommentsProps>(
    function PetitionRepliesFieldComments(
      {
        petitionId,
        field,
        onAddComment,
        onDeleteComment,
        onUpdateComment,
        onMarkAsUnread,
        onClose,
        isDisabled,
        onlyReadPermission,
        ...props
      },
      ref
    ) {
      const intl = useIntl();

      const hasCommentsEnabled = field.isInternal ? false : field.hasCommentsEnabled;

      const commentsRef = useRef<HTMLDivElement>(null);
      const editorRef = useRef<PetitionCommentsAndNotesEditorInstance>(null);
      const [tabIsNotes, setTabIsNotes] = useState(!hasCommentsEnabled || onlyReadPermission);

      const { data, loading } = useQuery(PetitionRepliesFieldComments_petitionFieldQueryDocument, {
        variables: { petitionId, petitionFieldId: field.id },
        pollInterval: 10_000,
        fetchPolicy: "cache-and-network",
      });

      const defaultMentionables = useGetDefaultMentionables(petitionId);
      const comments = data?.petitionField.comments ?? [];

      const updateIsReadNotification = useUpdateIsReadNotification();
      useTimeoutEffect(
        async (isMounted) => {
          const unreadCommentIds = comments.filter((c) => c.isUnread).map((c) => c.id);
          if (unreadCommentIds.length > 0 && isMounted()) {
            await updateIsReadNotification({
              petitionFieldCommentIds: unreadCommentIds,
              isRead: true,
            });
          }
        },
        1000,
        [comments]
      );

      useEffect(() => {
        if (!loading) {
          if (comments.at(-1)?.isInternal) {
            setTabIsNotes(true);
          }
          setTimeout(() => editorRef.current?.focusCurrentInput());
        }
      }, [field.id, loading]);

      // Scroll to bottom when a comment is added
      const previousCommentCount = usePrevious(comments.length);
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
        <Card ref={ref} {...props} overflow="hidden">
          <CloseableCardHeader onClose={onClose}>
            {field.title || (
              <Text fontWeight="normal" textStyle="hint">
                <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
              </Text>
            )}
          </CloseableCardHeader>
          <Box overflow="auto" ref={commentsRef}>
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
                    defaultMentionables={defaultMentionables}
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
              ref={editorRef}
              id={field.id}
              isDisabled={isDisabled}
              isTemplate={false}
              defaultMentionables={defaultMentionables}
              onSearchMentionables={handleSearchMentionables}
              hasCommentsEnabled={hasCommentsEnabled && !onlyReadPermission}
              onSubmit={async (content, isNote) => {
                await onAddComment(content, isNote);
              }}
              tabIsNotes={tabIsNotes}
              onTabChange={setTabIsNotes}
            />
          </Box>
        </Card>
      );
    }
  ),
  {
    fragments: {
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
            comments {
              ...PetitionFieldComment_PetitionFieldComment
            }
            hasCommentsEnabled
          }
          fragment PetitionRepliesFieldComments_PetitionFieldReply on PetitionFieldReply {
            id
            content
          }
          ${PetitionFieldComment.fragments.PetitionFieldComment}
        `;
      },
    },
  }
);

const _queries = [
  gql`
    query PetitionRepliesFieldComments_petitionFieldQuery(
      $petitionId: GID!
      $petitionFieldId: GID!
    ) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        ...PreviewPetitionFieldCommentsDialog_PetitionField
      }
    }
    ${PetitionRepliesFieldComments.fragments.PetitionField}
  `,
];
