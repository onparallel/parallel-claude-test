import { gql, useQuery } from "@apollo/client";
import { Box, Button, Center, Checkbox, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import { AlertCircleIcon, CommentIcon } from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import {
  PetitionRepliesFieldComments_PetitionFieldFragment,
  PetitionReplies_UserFragment,
  PreviewPetitionFieldCommentsDialog_petitionFieldQueryDocument,
} from "@parallel/graphql/__types";
import { isMetaReturn } from "@parallel/utils/keys";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import { usePreviousValue } from "beautiful-react-hooks";
import { ChangeEvent, Fragment, KeyboardEvent, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { FieldComment } from "../common/FieldComment";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { HelpPopover } from "../common/HelpPopover";
import { Link } from "../common/Link";
import { PaddedCollapse } from "../common/PaddedCollapse";

export type PetitionRepliesFieldCommentsProps = {
  petitionId: string;
  field: PetitionRepliesFieldComments_PetitionFieldFragment;
  user: PetitionReplies_UserFragment;
  hasCommentsEnabled: boolean;
  onAddComment: (value: string, internal?: boolean) => void;
  onDeleteComment: (petitionFieldCommentId: string) => void;
  onUpdateComment: (petitionFieldCommentId: string, content: string) => void;
  onMarkAsUnread: (petitionFieldCommentId: string) => void;
  onClose: () => void;
};

export function PetitionRepliesFieldComments({
  petitionId,
  field,
  user,
  hasCommentsEnabled,
  onAddComment,
  onDeleteComment,
  onUpdateComment,
  onMarkAsUnread,
  onClose,
}: PetitionRepliesFieldCommentsProps) {
  const intl = useIntl();

  const [draft, setDraft] = useState("");
  const [isInternalComment, setInternalComment] = useState(
    hasCommentsEnabled && !field.isInternal ? false : true
  );
  const [inputFocused, inputFocusBind] = useFocus({ onBlurDelay: 300 });

  const commentsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const content = draft.trim();
    if (isMetaReturn(event) && content) {
      event.preventDefault();
      onAddComment(content, isInternalComment);
      setNativeValue(textareaRef.current!, "");
    }
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
  }

  function handleSubmitClick() {
    onAddComment(draft.trim(), isInternalComment);
    setNativeValue(textareaRef.current!, "");
  }

  function handleCancelClick() {
    setNativeValue(textareaRef.current!, "");
  }

  const isExpanded = Boolean(inputFocused || draft);

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
              color="purple.500"
              size="xl"
            />
          </Center>
        ) : (
          comments.map((comment, index) => (
            <Fragment key={comment.id}>
              <FieldComment
                comment={comment}
                isAuthor={user.id === comment.author?.id}
                onEdit={(content) => onUpdateComment(comment.id, content)}
                onDelete={() => onDeleteComment(comment.id)}
                onMarkAsUnread={() => onMarkAsUnread(comment.id)}
              />
              {index === comments.length - 1 ? null : <Divider />}
            </Fragment>
          ))
        )}
        {comments.length === 0 ? (
          <Flex
            flexDirection="column"
            paddingX={4}
            paddingY={8}
            justifyContent="center"
            alignItems="center"
          >
            {hasCommentsEnabled ? (
              <CommentIcon boxSize="64px" color="gray.200" />
            ) : (
              <Stack alignItems="center" textAlign="center">
                <AlertCircleIcon boxSize="64px" color="gray.200" />
                <Text color="gray.400">
                  <FormattedMessage
                    id="petition-replies.field-comments.disabled-comments-1"
                    defaultMessage="Comments are disabled. Enable them on the petition settings in the <a>Compose</a> tab."
                    values={{
                      a: (chunks: any) => (
                        <Link href={`/app/petitions/${petitionId}/compose`}>{chunks}</Link>
                      ),
                    }}
                  />
                </Text>
                {user.hasInternalComments ? (
                  <Text color="gray.400">
                    <FormattedMessage
                      id="petition-replies.field-comments.disabled-comments-2"
                      defaultMessage="Only internal comments will be displayed here."
                    />
                  </Text>
                ) : null}
              </Stack>
            )}
          </Flex>
        ) : null}
      </Box>
      <Divider />
      <Box padding={2}>
        <GrowingTextarea
          id="petition-replies-comments-input"
          ref={textareaRef}
          size="sm"
          borderRadius="md"
          paddingX={2}
          minHeight={0}
          rows={1}
          placeholder={intl.formatMessage({
            id: "petition-replies.field-comments.placeholder",
            defaultMessage: "Type a new comment",
          })}
          isDisabled={(!hasCommentsEnabled && !user.hasInternalComments) || field.isInternal}
          value={draft}
          onKeyDown={handleKeyDown as any}
          onChange={handleDraftChange as any}
          {...inputFocusBind}
        />
        <Box minHeight="4px">
          <PaddedCollapse in={isExpanded}>
            <Stack
              paddingTop={2}
              direction="row"
              justifyContent={user.hasInternalComments ? "space-between" : "flex-end"}
            >
              {user.hasInternalComments && (
                <Stack display="flex" alignItems="center" direction="row">
                  <Checkbox
                    marginLeft={1}
                    colorScheme="purple"
                    isChecked={isInternalComment}
                    isDisabled={hasCommentsEnabled ? false : true}
                    onChange={() => setInternalComment(!isInternalComment)}
                  >
                    <FormattedMessage
                      id="petition-replies.internal-comment-check.label"
                      defaultMessage="Internal comment"
                    />
                  </Checkbox>
                  <HelpPopover>
                    <FormattedMessage
                      id="petition-replies.internal-comment-check.help"
                      defaultMessage="By checking this field, the comment will be visible only to users in your organization."
                    />
                  </HelpPopover>
                </Stack>
              )}
              <Stack direction="row">
                <Button size="sm" onClick={handleCancelClick}>
                  <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
                </Button>
                <Button
                  marginLeft={2}
                  size="sm"
                  colorScheme="purple"
                  isDisabled={draft.trim().length === 0}
                  onClick={handleSubmitClick}
                >
                  <FormattedMessage id="generic.submit" defaultMessage="Submit" />
                </Button>
              </Stack>
            </Stack>
          </PaddedCollapse>
        </Box>
      </Box>
    </Card>
  );
}

PetitionRepliesFieldComments.fragments = {
  User: gql`
    fragment PetitionRepliesFieldComments_User on User {
      id
      hasInternalComments: hasFeatureFlag(featureFlag: INTERNAL_COMMENTS)
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
      }
      fragment PetitionRepliesFieldComments_PetitionFieldReply on PetitionFieldReply {
        id
        content
      }
    `;
  },
};
