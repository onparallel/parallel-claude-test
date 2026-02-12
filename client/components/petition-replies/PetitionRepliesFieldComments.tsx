import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, AlertDescription, AlertIcon, Center, Heading, Spinner } from "@chakra-ui/react";
import { ChevronLeftIcon, CommentIcon, NoteIcon } from "@parallel/chakra/icons";
import { Box, Flex, HStack, Stack, Text } from "@parallel/components/ui";
import {
  PetitionRepliesFieldComments_PetitionBaseFragment,
  PetitionRepliesFieldComments_petitionCommentAttachmentDownloadLinkDocument,
  PetitionRepliesFieldComments_PetitionFieldFragment,
  PetitionRepliesFieldComments_petitionFieldQueryDocument,
  PetitionRepliesFieldComments_petitionQueryDocument,
} from "@parallel/graphql/__types";
import { useGetMyId } from "@parallel/utils/apollo/getMyId";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useFieldCommentsQueryState } from "@parallel/utils/useFieldCommentsQueryState";
import { useGetDefaultMentionables } from "@parallel/utils/useGetDefaultMentionables";
import { useSearchUserGroups } from "@parallel/utils/useSearchUserGroups";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useTimeoutEffect } from "@parallel/utils/useTimeoutEffect";
import { usePrevious } from "@parallel/utils/use-previous";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { CloseButton } from "../common/CloseButton";
import { Divider } from "../common/Divider";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Link } from "../common/Link";
import { PetitionFieldComment } from "../common/PetitionFieldComment";
import {
  PetitionCommentsAndNotesEditor,
  PetitionCommentsAndNotesEditorInstance,
} from "../petition-common/PetitionCommentsAndNotesEditor";
import { useFailureGeneratingLinkDialog } from "./dialogs/FailureGeneratingLinkDialog";

export interface PetitionRepliesFieldCommentsProps {
  petition: PetitionRepliesFieldComments_PetitionBaseFragment;
  field?: PetitionRepliesFieldComments_PetitionFieldFragment | null;
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

  const hasCommentsEnabled = isNonNullish(field)
    ? field.isInternal
      ? false
      : field.hasCommentsEnabled && petition.isInteractionWithRecipientsEnabled
    : true;

  const petitionId = petition.id;
  const isTemplate = petition.__typename === "PetitionTemplate";
  const commentsRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<PetitionCommentsAndNotesEditorInstance>(null);
  const [tabIsNotes, setTabIsNotes] = useState(!hasCommentsEnabled || onlyReadPermission);
  const [fieldId] = useFieldCommentsQueryState();

  const showGeneralComments = isNullish(field) && fieldId === "general";

  const shouldSkipFieldPolling = showGeneralComments || isNullish(field?.id);

  const { data, loading: loadingField } = useQuery(
    PetitionRepliesFieldComments_petitionFieldQueryDocument,
    {
      variables: { petitionId, petitionFieldId: field?.id ?? "" },
      pollInterval: 10_000,
      fetchPolicy: "cache-and-network",
      skip: shouldSkipFieldPolling,
      skipPollAttempt: () => shouldSkipFieldPolling,
    },
  );

  const { data: petitionData, loading: loadingPetition } = useQuery(
    PetitionRepliesFieldComments_petitionQueryDocument,
    {
      variables: { petitionId },
      pollInterval: 10_000,
      fetchPolicy: "cache-and-network",
      skip: !showGeneralComments,
      skipPollAttempt: () => !showGeneralComments,
    },
  );

  const loading = showGeneralComments ? loadingPetition : loadingField;

  const defaultMentionables = useGetDefaultMentionables(petitionId);
  const comments =
    showGeneralComments && petitionData?.petition?.__typename === "Petition"
      ? petitionData.petition.generalComments
      : (data?.petitionField.comments ?? []);

  const markedAsUnreadIdsRef = useRef<string[]>([]);

  const updateIsReadNotification = useUpdateIsReadNotification();
  useTimeoutEffect(
    async (isMounted) => {
      const unreadCommentIds = comments
        .filter((c) => c.isUnread && !markedAsUnreadIdsRef.current.includes(c.id))
        .map((c) => c.id);
      if (unreadCommentIds.length > 0 && isMounted()) {
        await updateIsReadNotification({
          petitionFieldCommentIds: unreadCommentIds,
          isRead: true,
        });
      }
    },
    1000,
    [comments.length],
  );

  const ranInitial = useRef(false);

  useEffect(() => {
    if (ranInitial.current) return;
    if (!loading) {
      ranInitial.current = true;
      if (comments.at(-1)?.isInternal) {
        setTabIsNotes(true);
      }
      setTimeout(() => editorRef.current?.focus());
    }
  }, [loading, field?.id]);

  // Scroll to bottom when a comment is added
  const previousCommentCount = usePrevious(comments.length);
  useEffect(() => {
    if (previousCommentCount === undefined || comments.length > previousCommentCount) {
      commentsRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
    }
  }, [comments, previousCommentCount]);

  const searchUsers = useSearchUsers();
  const searchUserGroups = useSearchUserGroups();
  const myId = useGetMyId();
  const handleSearchMentionables = useCallback(
    async (search: string) => {
      const [users, groups] = await Promise.all([
        searchUsers(search, { excludeIds: [myId] }),
        searchUserGroups(search),
      ]);

      return [...groups, ...users];
    },
    [searchUsers, searchUserGroups],
  );

  const handleMarkAsUnread = (commentId: string) => {
    onMarkAsUnread(commentId);
    markedAsUnreadIdsRef.current = [...markedAsUnreadIdsRef.current, commentId];
  };

  const [petitionCommentAttachmentDownloadLink] = useMutation(
    PetitionRepliesFieldComments_petitionCommentAttachmentDownloadLinkDocument,
  );
  const showFailure = useFailureGeneratingLinkDialog();
  const handleDownloadAttachment = async (
    attachmentId: string,
    commentId: string,
    preview: boolean,
  ) => {
    await withError(
      openNewWindow(async () => {
        const { data } = await petitionCommentAttachmentDownloadLink({
          variables: { petitionId, commentId, attachmentId, preview },
        });

        const { url, result, file } = data!.petitionCommentAttachmentDownloadLink;
        if (result !== "SUCCESS") {
          await withError(showFailure({ filename: file?.filename ?? "" }));
          throw new Error();
        }
        return url!;
      }),
    );
  };

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

        {showGeneralComments ? (
          <Heading as="h3" size="sm" fontWeight={500}>
            <FormattedMessage
              id="component.petition-replies-field-comments.general-comments-title"
              defaultMessage="General"
            />
          </Heading>
        ) : (
          <Heading
            as="h3"
            size="sm"
            fontWeight={500}
            noOfLines={2}
            sx={
              isNullish(field?.title)
                ? { color: "gray.500", fontWeight: "normal", fontStyle: "italic" }
                : {}
            }
          >
            {field?.title ??
              intl.formatMessage({
                id: "generic.untitled-field",
                defaultMessage: "Untitled field",
              })}
          </Heading>
        )}

        <CloseButton
          onClick={onClose}
          display={{ base: "flex", lg: "none" }}
          position="absolute"
          insetEnd={4}
        />
      </HStack>

      {isTemplate ? (
        <Alert status="info">
          <AlertIcon />
          <AlertDescription>
            <FormattedMessage
              id="component.petition-replies-field-comments.template-read-only-alert"
              defaultMessage="<b>Preview only</b> - Comments are disabled."
            />
          </AlertDescription>
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
                                href={`/app/petitions/${petitionId}/compose#field-settings-${field?.id}`}
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
            <Stack gap={0} divider={<Divider />}>
              {comments.map((comment) => (
                <PetitionFieldComment
                  key={comment.id}
                  comment={comment}
                  defaultMentionables={defaultMentionables}
                  onSearchMentionables={handleSearchMentionables}
                  onEdit={(content) => onUpdateComment(comment.id, content, comment.isInternal)}
                  onDelete={() => onDeleteComment(comment.id)}
                  onMarkAsUnread={() => handleMarkAsUnread(comment.id)}
                  onDownloadAttachment={handleDownloadAttachment}
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
          id={field?.id ?? "general"}
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

const _fragments = {
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
  `,
  gql`
    query PetitionRepliesFieldComments_petitionQuery($petitionId: GID!) {
      petition(id: $petitionId) {
        id
        ... on Petition {
          generalComments {
            ...PetitionFieldComment_PetitionFieldComment
          }
        }
      }
    }
  `,
];

const _mutations = [
  gql`
    mutation PetitionRepliesFieldComments_petitionCommentAttachmentDownloadLink(
      $petitionId: GID!
      $commentId: GID!
      $attachmentId: GID!
      $preview: Boolean
    ) {
      petitionCommentAttachmentDownloadLink(
        petitionId: $petitionId
        commentId: $commentId
        attachmentId: $attachmentId
        preview: $preview
      ) {
        file {
          filename
        }
        result
        url
      }
    }
  `,
];
