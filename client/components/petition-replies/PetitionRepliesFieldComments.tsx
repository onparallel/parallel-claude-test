import { gql, useQuery } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Box,
  Center,
  Flex,
  HStack,
  Heading,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ChevronLeftIcon, CommentIcon, NoteIcon } from "@parallel/chakra/icons";
import {
  PetitionRepliesFieldComments_PetitionBaseFragment,
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
import { isDefined } from "remeda";
import { CloseButton } from "../common/CloseButton";
import { Divider } from "../common/Divider";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Link } from "../common/Link";
import { PetitionFieldComment } from "../common/PetitionFieldComment";
import {
  PetitionCommentsAndNotesEditor,
  PetitionCommentsAndNotesEditorInstance,
} from "../petition-common/PetitionCommentsAndNotesEditor";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";

export interface PetitionRepliesFieldCommentsProps {
  petition: PetitionRepliesFieldComments_PetitionBaseFragment;
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
  petition,
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

  const hasCommentsEnabled = field.isInternal
    ? false
    : field.hasCommentsEnabled && petition.isInteractionWithRecipientsEnabled;

  const petitionId = petition.id;
  const isTemplate = petition.__typename === "PetitionTemplate";
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

  const [markedAsUnreadIds, setMarkedAsUnreadIds] = useState<string[]>([]);

  const updateIsReadNotification = useUpdateIsReadNotification();
  useTimeoutEffect(
    async (isMounted) => {
      const unreadCommentIds = comments
        .filter((c) => c.isUnread)
        .map((c) => c.id)
        .filter((id) => !markedAsUnreadIds.includes(id));
      if (unreadCommentIds.length > 0 && isMounted()) {
        await updateIsReadNotification({
          petitionFieldCommentIds: unreadCommentIds,
          isRead: true,
        });
      }
    },
    1000,
    [comments, markedAsUnreadIds],
  );

  useEffect(() => {
    if (!loading) {
      if (comments.at(-1)?.isInternal) {
        setTabIsNotes(true);
      }
      setTimeout(() => editorRef.current?.focus());
    }
    const element = document.getElementById(`field-${field.id}`);
    if (element) {
      smoothScrollIntoView(element, { block: "center", behavior: "smooth" });
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
    [searchUsers],
  );

  return (
    <>
      <HStack
        paddingY={2}
        paddingX={{ base: 4, lg: 2 }}
        borderBottom="1px solid"
        borderColor="gray.200"
        position="relative"
        height="49px"
      >
        <IconButtonWithTooltip
          variant="ghost"
          size="sm"
          icon={<ChevronLeftIcon boxSize={6} />}
          label={intl.formatMessage({ id: "generic.go-back", defaultMessage: "Go back" })}
          onClick={() => onClose()}
          display={{ base: "none", lg: "flex" }}
        />
        <Heading
          as="h3"
          size="sm"
          fontWeight={500}
          noOfLines={2}
          sx={
            isDefined(field.title)
              ? {}
              : { color: "gray.500", fontWeight: "normal", fontStyle: "italic" }
          }
        >
          {field.title ??
            intl.formatMessage({
              id: "generic.untitled-field",
              defaultMessage: "Untitled field",
            })}
        </Heading>
        <CloseButton
          onClick={onClose}
          display={{ base: "flex", lg: "none" }}
          position="absolute"
          insetEnd={4}
        />
      </HStack>

      {isTemplate ? (
        <Alert status="info" paddingY={0}>
          <AlertIcon />
          <Text flex={1} paddingY={3}>
            <FormattedMessage
              id="component.petition-replies-field-comments.template-read-only-alert"
              defaultMessage="<b>Preview only</b> - Comments are disabled."
            />
          </Text>
        </Alert>
      ) : null}
      <Box overflow="auto" flex={1} ref={commentsRef}>
        {loading && !comments.length ? (
          <Center minHeight={44} height="100%">
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
            height="100%"
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
                        id="component.petition-replies-field-comments.only-notes"
                        defaultMessage="This field only accepts notes"
                      />
                    </Text>
                    {petition.isInteractionWithRecipientsEnabled ? (
                      <Text color="gray.400">
                        <FormattedMessage
                          id="component.petition-replies-field-comments.enable-comments-settings"
                          defaultMessage="You can enable comments from the <a>Field settings</a> in the {composeTab} tab."
                          values={{
                            composeTab: intl.formatMessage({
                              id: "component.petition-header.compose-tab",
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
                    ) : null}
                  </>
                )}
              </Stack>
            )}
          </Flex>
        ) : (
          <>
            <Stack spacing={0} divider={<Divider />}>
              {comments.map((comment) => (
                <PetitionFieldComment
                  key={comment.id}
                  comment={comment}
                  defaultMentionables={defaultMentionables}
                  onSearchMentionables={handleSearchMentionables}
                  onEdit={(content) => onUpdateComment(comment.id, content, comment.isInternal)}
                  onDelete={() => onDeleteComment(comment.id)}
                  onMarkAsUnread={() => {
                    onMarkAsUnread(comment.id);
                    setMarkedAsUnreadIds((ids) => [...ids, comment.id]);
                  }}
                />
              ))}
            </Stack>
            <Divider />
          </>
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
    </>
  );
}

PetitionRepliesFieldComments.fragments = {
  User: gql`
    fragment PetitionRepliesFieldComments_User on User {
      id
    }
  `,
  PetitionBase: gql`
    fragment PetitionRepliesFieldComments_PetitionBase on PetitionBase {
      id
      isInteractionWithRecipientsEnabled
    }
  `,
  PetitionField: gql`
    fragment PetitionRepliesFieldComments_PetitionField on PetitionField {
      id
      title
      type
      isInternal
      hasCommentsEnabled
    }
  `,
};

const _queries = [
  gql`
    query PetitionRepliesFieldComments_petitionFieldQuery(
      $petitionId: GID!
      $petitionFieldId: GID!
    ) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        id
        comments {
          ...PetitionFieldComment_PetitionFieldComment
        }
      }
    }
    ${PetitionFieldComment.fragments.PetitionFieldComment}
  `,
];
