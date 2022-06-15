import { gql, useQuery } from "@apollo/client";
import { Box, Button, Center, Checkbox, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import { AlertCircleIcon, CommentIcon } from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import {
  PetitionRepliesFieldComments_PetitionFieldFragment,
  PreviewPetitionFieldCommentsDialog_petitionFieldQueryDocument,
} from "@parallel/graphql/__types";
import { isMetaReturn } from "@parallel/utils/keys";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import usePreviousValue from "beautiful-react-hooks/usePreviousValue";
import { ChangeEvent, Fragment, KeyboardEvent, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { FieldComment } from "../common/FieldComment";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { HelpPopover } from "../common/HelpPopover";
import { Link } from "../common/Link";
import { PaddedCollapse } from "../common/PaddedCollapse";

export interface PetitionRepliesFieldCommentsProps {
  petitionId: string;
  field: PetitionRepliesFieldComments_PetitionFieldFragment;
  myId: string;
  hasInternalComments: boolean;
  onAddComment: (value: string, internal?: boolean) => void;
  onDeleteComment: (petitionFieldCommentId: string) => void;
  onUpdateComment: (petitionFieldCommentId: string, content: string) => void;
  onMarkAsUnread: (petitionFieldCommentId: string) => void;
  onClose: () => void;
  isDisabled: boolean;
  onlyInternalComments: boolean;
}

export function PetitionRepliesFieldComments({
  petitionId,
  field,
  myId,
  hasInternalComments,
  onAddComment,
  onDeleteComment,
  onUpdateComment,
  onMarkAsUnread,
  onClose,
  isDisabled,
  onlyInternalComments,
}: PetitionRepliesFieldCommentsProps) {
  const intl = useIntl();

  const [draft, setDraft] = useState("");

  const hasCommentsEnabled = field.isInternal ? false : field.hasCommentsEnabled;

  const [isInternalComment, setInternalComment] = useState(
    !hasCommentsEnabled || onlyInternalComments
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
              color="primary.500"
              size="xl"
            />
          </Center>
        ) : (
          comments.map((comment, index) => (
            <Fragment key={comment.id}>
              <FieldComment
                comment={comment}
                isAuthor={myId === comment.author?.id}
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
                {hasInternalComments ? (
                  <Text color="gray.400">
                    <FormattedMessage
                      id="petition-replies.field-comments.disabled-comments-1"
                      defaultMessage="This field only accepts internal comments."
                    />
                  </Text>
                ) : null}
                {!onlyInternalComments ? (
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
          isDisabled={isDisabled || (!hasCommentsEnabled && !hasInternalComments)}
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
              justifyContent={hasInternalComments ? "space-between" : "flex-end"}
            >
              {hasInternalComments && (
                <Stack display="flex" alignItems="center" direction="row">
                  <Checkbox
                    marginLeft={1}
                    colorScheme="primary"
                    isChecked={isInternalComment}
                    isDisabled={!hasCommentsEnabled || field.isInternal || onlyInternalComments}
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
                  colorScheme="primary"
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
        hasCommentsEnabled
      }
      fragment PetitionRepliesFieldComments_PetitionFieldReply on PetitionFieldReply {
        id
        content
      }
    `;
  },
};
