import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  LinkBox,
  LinkOverlay,
  Spinner,
  Stack,
  Text,
  usePrevious,
} from "@chakra-ui/react";
import { ChevronLeftIcon, CommentIcon } from "@parallel/chakra/icons";
import {
  RecipientViewComments_PublicPetitionAccessFragment,
  RecipientViewComments_accessDocument,
  RecipientViewComments_createPetitionFieldCommentDocument,
  RecipientViewComments_deletePetitionFieldCommentDocument,
  RecipientViewComments_markPetitionFieldCommentsAsReadDocument,
  RecipientViewComments_publicPetitionFieldDocument,
  RecipientViewComments_updatePetitionFieldCommentDocument,
} from "@parallel/graphql/__types";
import { isMetaReturn } from "@parallel/utils/keys";
import { useTimeoutEffect } from "@parallel/utils/useTimeoutEffect";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CloseButton } from "../common/CloseButton";
import { PublicPetitionFieldComment } from "../common/PublicPetitionFieldComment";
import { useTone } from "../common/ToneProvider";
import {
  CommentEditor,
  CommentEditorInstance,
  emptyCommentEditorValue,
  isEmptyCommentEditorValue,
} from "../common/slate/CommentEditor";

import { FORMATS } from "@parallel/utils/dates";
import { useFieldCommentsQueryState } from "@parallel/utils/useFieldCommentsQueryState";
import { useMetadata } from "@parallel/utils/withMetadata";
import { isDefined } from "remeda";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { DateTime } from "../common/DateTime";
import { Divider } from "../common/Divider";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PublicPetitionFieldCommentExcerpt } from "../common/PublicPetitionFieldCommentExcerpt";
import { Spacer } from "../common/Spacer";

interface RecipientViewCommentsProps {
  keycode: string;
  access: RecipientViewComments_PublicPetitionAccessFragment;
  onClose: () => void;
}

export function RecipientViewComments({ keycode, access, onClose }: RecipientViewCommentsProps) {
  const intl = useIntl();
  const tone = useTone();
  const [draft, setDraft] = useState(emptyCommentEditorValue());
  const isDraftEmpty = isEmptyCommentEditorValue(draft);

  const commentsRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<CommentEditorInstance>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [fieldId, setFieldId] = useFieldCommentsQueryState();

  const { data, loading: isLoadingField } = useQuery(
    RecipientViewComments_publicPetitionFieldDocument,
    {
      skip: !isDefined(fieldId),
      variables: { keycode, petitionFieldId: fieldId! },
      fetchPolicy: "cache-and-network",
    },
  );
  const { data: dataAccess, loading: isLoadingAccess } = useQuery(
    RecipientViewComments_accessDocument,
    {
      skip: isDefined(fieldId),
      variables: { keycode },
      fetchPolicy: "cache-and-network",
    },
  );

  useEffect(() => {
    if (isDefined(fieldId)) {
      const element = document.getElementById(`field-${fieldId}`);
      if (element) {
        smoothScrollIntoView(element, { block: "center", behavior: "smooth" });
      }
    }
  }, [fieldId]);

  const field = fieldId ? data?.publicPetitionField : null;

  const comments = data?.publicPetitionField.comments ?? [];

  const petition = dataAccess?.access.petition;

  const fieldsWithComments =
    petition?.fields
      .filter((f) => isDefined(f.lastComment) && f.hasCommentsEnabled)
      .sort((a, b) => {
        const lastCommentA = a.lastComment!.createdAt;
        const lastCommentB = b.lastComment!.createdAt;
        return new Date(lastCommentB).getTime() - new Date(lastCommentA).getTime();
      }) ?? [];

  const [createPetitionFieldComment] = useMutation(
    RecipientViewComments_createPetitionFieldCommentDocument,
  );
  async function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isMetaReturn(event)) {
      event.preventDefault();
      await handleSubmitClick();
    }
  }

  async function handleSubmitClick() {
    if (!isEmptyCommentEditorValue(draft) && isDefined(fieldId)) {
      try {
        await createPetitionFieldComment({
          variables: {
            keycode,
            petitionFieldId: fieldId,
            content: draft,
          },
        });
        editorRef.current?.clear();
      } catch {}
    }
    closeRef.current?.focus();
  }

  const [markPetitionFieldCommentsAsRead] = useMutation(
    RecipientViewComments_markPetitionFieldCommentsAsReadDocument,
  );

  useTimeoutEffect(
    async () => {
      const petitionFieldCommentIds = comments.filter((c) => c.isUnread).map((c) => c.id);
      if (petitionFieldCommentIds.length > 0) {
        await markPetitionFieldCommentsAsRead({
          variables: {
            keycode,
            petitionFieldCommentIds,
          },
        });
      }
    },
    1000,
    [fieldId, comments.map((c) => c.id).join(",")],
  );

  const [updatePetitionFieldComment] = useMutation(
    RecipientViewComments_updatePetitionFieldCommentDocument,
  );

  async function handleEditCommentContent(commentId: string, content: any) {
    try {
      if (isDefined(fieldId)) {
        await updatePetitionFieldComment({
          variables: {
            keycode,
            petitionFieldId: fieldId,
            petitionFieldCommentId: commentId,
            content,
          },
        });
      }
    } catch {}
  }

  const [deletePetitionFieldComment] = useMutation(
    RecipientViewComments_deletePetitionFieldCommentDocument,
  );
  async function handleDeleteClick(commentId: string) {
    try {
      if (isDefined(fieldId)) {
        await deletePetitionFieldComment({
          variables: {
            keycode,
            petitionFieldId: fieldId,
            petitionFieldCommentId: commentId,
          },
        });
      }
    } catch {}
  }

  // Scroll to bottom when a comment is added
  const previousCommentCount = usePrevious(comments.length);
  useEffect(() => {
    if (previousCommentCount === undefined || comments.length > previousCommentCount) {
      commentsRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
    }
  }, [comments, previousCommentCount]);

  // Scroll to bottom when open a field comments view and focus the editor
  useEffect(() => {
    if (isDefined(fieldId)) {
      commentsRef.current?.scrollTo({ top: 99999 });
      setTimeout(() => editorRef.current?.focus());
    }
  }, [fieldId, commentsRef.current]);

  const { deviceType } = useMetadata();

  return (
    <Flex flexDirection="column" minWidth={0} height="100%" width="100%">
      <HStack
        paddingX={4}
        paddingY={3}
        borderBottom="1px solid"
        borderBottomColor="gray.200"
        justify="space-between"
        height="56px"
      >
        {isDefined(field) ? (
          <HStack>
            <IconButtonWithTooltip
              variant="ghost"
              size="sm"
              icon={<ChevronLeftIcon boxSize={6} />}
              label={intl.formatMessage({ id: "generic.go-back", defaultMessage: "Go back" })}
              onClick={() => setFieldId(null)}
            />
            {field.title ? (
              <Heading as="h3" size="sm" fontWeight={500} noOfLines={2}>
                {field.title}
              </Heading>
            ) : (
              <Heading
                as="h3"
                size="sm"
                fontWeight={500}
                noOfLines={2}
                sx={{ color: "gray.500", fontWeight: "normal", fontStyle: "italic" }}
                paddingEnd={2}
              >
                {field.type === "HEADING" ? (
                  <FormattedMessage id="generic.empty-heading" defaultMessage="Untitled heading" />
                ) : (
                  <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
                )}
              </Heading>
            )}
          </HStack>
        ) : (
          <Heading as="h3" size="sm" display="flex" alignItems="center">
            <CommentIcon boxSize={6} marginEnd={2.5} />
            <FormattedMessage
              id="component.recipient-view-comments.heading"
              defaultMessage="Comments"
            />
          </Heading>
        )}

        <CloseButton size="sm" onClick={onClose} />
      </HStack>

      <Stack padding={0} overflow="auto" height="100%" spacing={0}>
        {!isDefined(fieldId) ? (
          fieldsWithComments.length === 0 && isLoadingAccess ? (
            <Center overflow="auto" width="100%" flex="1">
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="primary.500"
                size="xl"
              />
            </Center>
          ) : fieldsWithComments.length === 0 ? (
            <Center
              textAlign="center"
              display="flex"
              flexDirection="column"
              gap={2}
              padding={4}
              height="100%"
              width="100%"
            >
              <Text as="h3" fontWeight="bold">
                <FormattedMessage
                  id="component.recipient-view-comments.no-comments-title"
                  defaultMessage="There are no comments yet."
                />
              </Text>
              <Text>
                <FormattedMessage
                  id="component.recipient-view-comments.no-comments-body"
                  defaultMessage="Select the {commentsButtonLabel} buttons to add a comment in a field."
                  values={{
                    commentsButtonLabel: (
                      <b>
                        {intl.formatMessage({
                          id: "recipient-view.doubts-button",
                          defaultMessage: "Questions?",
                        })}
                      </b>
                    ),
                  }}
                />
              </Text>
            </Center>
          ) : (
            fieldsWithComments.map((field) => {
              const comment = field.lastComment!;

              const unreadCount = field.unreadCommentCount;
              const isAuthor =
                comment.author?.__typename === "PublicContact" && comment.author.isMe;
              return (
                <LinkBox
                  as={Stack}
                  key={field.id}
                  spacing={1}
                  paddingX={4}
                  paddingY={2}
                  backgroundColor={unreadCount > 0 ? "primary.50" : "white"}
                  borderBottom="1px solid"
                  borderColor="gray.200"
                  tabIndex={0}
                  _focus={{
                    outline: "none",
                    boxShadow: "inline",
                  }}
                  _hover={{
                    background: "gray.75",
                  }}
                  onKeyDown={(e) => {
                    if (e.code === "Space" || e.code === "Enter") {
                      setFieldId(field.id);
                    }
                  }}
                >
                  <HStack justify="space-between" align="baseline">
                    <LinkOverlay
                      onClick={(e) => {
                        e.preventDefault();
                        setFieldId(field.id);
                      }}
                      href="#"
                      tabIndex={-1}
                    >
                      {field.title ? (
                        <Text noOfLines={2} fontWeight={600}>
                          {field.title}
                        </Text>
                      ) : (
                        <Text as="span" textStyle="hint" fontWeight={600}>
                          {field.type === "HEADING" ? (
                            <FormattedMessage
                              id="generic.empty-heading"
                              defaultMessage="Untitled heading"
                            />
                          ) : (
                            <FormattedMessage
                              id="generic.untitled-field"
                              defaultMessage="Untitled field"
                            />
                          )}
                        </Text>
                      )}
                    </LinkOverlay>

                    <DateTime
                      fontSize="sm"
                      whiteSpace="nowrap"
                      color={unreadCount > 0 ? "primary.500" : "gray.600"}
                      value={comment.createdAt}
                      format={FORMATS.LLL}
                      useRelativeTime
                    />
                  </HStack>
                  <HStack color="gray.600" justify="space-between">
                    <Box flex="1">
                      <Text noOfLines={2} fontSize="sm" as="span" wordBreak="break-all">
                        {`${
                          isAuthor
                            ? intl.formatMessage({ id: "generic.you", defaultMessage: "You" })
                            : isDefined(comment.author)
                              ? comment.author.fullName
                              : intl.formatMessage({
                                  id: "generic.unknown",
                                  defaultMessage: "Unknown",
                                })
                        }: `}
                        <PublicPetitionFieldCommentExcerpt as="span" comment={comment} />
                      </Text>
                    </Box>
                    {unreadCount ? (
                      <Badge
                        background="primary.500"
                        color="white"
                        fontSize="sm"
                        borderRadius="full"
                        minW="18px"
                        minH="18px"
                        lineHeight="16px"
                        border="1px solid white"
                        pointerEvents="none"
                      >
                        {unreadCount < 100 ? unreadCount : "99+"}
                      </Badge>
                    ) : null}
                  </HStack>
                </LinkBox>
              );
            })
          )
        ) : (
          <>
            {isLoadingField ? (
              <Center overflow="auto" width="100%" flex="1">
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="primary.500"
                  size="xl"
                />
              </Center>
            ) : comments.length === 0 ? (
              <Center
                overflow="auto"
                width="100%"
                flex="1"
                flexDirection="column"
                paddingX={4}
                paddingY={8}
                gap={2}
                textAlign="center"
              >
                <CommentIcon color="gray.300" boxSize="64px" />
                <Text as="h3" fontWeight="bold">
                  <FormattedMessage
                    id="component.recipient-view-comments.no-comments-field-title"
                    defaultMessage="Do you have questions about this field?"
                    values={{ tone }}
                  />
                </Text>
                <Text color="gray.500">
                  {access.granter!.fullName ? (
                    <FormattedMessage
                      id="component.recipient-view-comments.ask-with-name"
                      defaultMessage="Ask {name} here"
                      values={{ name: access.granter!.fullName, tone }}
                    />
                  ) : (
                    <FormattedMessage
                      id="component.recipient-view-comments.ask-here"
                      defaultMessage="Ask here"
                      values={{ tone }}
                    />
                  )}
                </Text>
              </Center>
            ) : (
              <>
                <Stack
                  spacing={0}
                  divider={<Divider />}
                  overflow="auto"
                  width="100%"
                  ref={commentsRef}
                >
                  {comments.map((comment) => (
                    <PublicPetitionFieldComment
                      key={comment.id}
                      comment={comment}
                      onEdit={(content) => handleEditCommentContent(comment.id, content)}
                      onDelete={() => handleDeleteClick(comment.id)}
                      isDisabled={field?.hasCommentsEnabled === false}
                    />
                  ))}
                </Stack>
                <Divider />
                <Spacer />
              </>
            )}

            <Divider />
            <HStack padding={2} alignItems="flex-start">
              <Stack flex={1} spacing={1} minWidth={0}>
                <CommentEditor
                  id={`comment-editor-${fieldId}`}
                  ref={editorRef}
                  placeholder={intl.formatMessage({
                    id: "component.petition-comments-and-notes-editor.comment-placeholder",
                    defaultMessage: "Write a comment",
                  })}
                  value={draft}
                  isDisabled={!isDefined(fieldId) || field?.hasCommentsEnabled === false}
                  onKeyDown={handleKeyDown}
                  onChange={setDraft}
                />
                {deviceType === null ? (
                  // show only on desktop
                  <Text fontSize="sm" color="gray.600">
                    <FormattedMessage
                      id="component.petition-comments-and-notes-editor.ctrl-enter-help"
                      defaultMessage="Ctrl + enter to send"
                    />
                  </Text>
                ) : null}
              </Stack>
              <Box>
                <Button
                  colorScheme="primary"
                  isDisabled={isDraftEmpty || !isDefined(fieldId)}
                  onClick={handleSubmitClick}
                >
                  <FormattedMessage id="generic.submit" defaultMessage="Submit" />
                </Button>
              </Box>
            </HStack>
          </>
        )}
      </Stack>
    </Flex>
  );
}

RecipientViewComments.fragments = {
  PublicPetitionFieldComment: gql`
    fragment RecipientViewComments_PublicPetitionFieldComment on PublicPetitionFieldComment {
      id
      ...PublicPetitionFieldComment_PublicPetitionFieldComment
    }
    ${PublicPetitionFieldComment.fragments.PublicPetitionFieldComment}
  `,
  PublicPetitionAccess: gql`
    fragment RecipientViewComments_PublicPetitionAccess on PublicPetitionAccess {
      granter {
        id
        fullName
      }
      contact {
        id
      }
    }
  `,
};

const _queries = [
  gql`
    query RecipientViewComments_access($keycode: ID!) {
      access(keycode: $keycode) {
        petition {
          id
          fields {
            id
            type
            title
            unreadCommentCount
            hasCommentsEnabled
            lastComment {
              ...RecipientViewComments_PublicPetitionFieldComment
              ...PublicPetitionFieldCommentExcerpt_PetitionFieldComment
              createdAt
              author {
                ... on PublicUser {
                  id
                  fullName
                }
                ... on PublicContact {
                  id
                  fullName
                  isMe
                }
              }
            }
          }
        }
      }
    }
    ${PublicPetitionFieldCommentExcerpt.fragments.PetitionFieldComment}
    ${RecipientViewComments.fragments.PublicPetitionFieldComment}
  `,
  gql`
    query RecipientViewComments_publicPetitionField($keycode: ID!, $petitionFieldId: GID!) {
      publicPetitionField(keycode: $keycode, petitionFieldId: $petitionFieldId) {
        id
        title
        type
        commentCount
        unreadCommentCount
        hasCommentsEnabled
        comments {
          id
          ...RecipientViewComments_PublicPetitionFieldComment
        }
      }
    }
    ${RecipientViewComments.fragments.PublicPetitionFieldComment}
  `,
];

const _mutations = [
  gql`
    mutation RecipientViewComments_markPetitionFieldCommentsAsRead(
      $keycode: ID!
      $petitionFieldCommentIds: [GID!]!
    ) {
      publicMarkPetitionFieldCommentsAsRead(
        keycode: $keycode
        petitionFieldCommentIds: $petitionFieldCommentIds
      ) {
        id
        isUnread
        field {
          id
          unreadCommentCount
        }
      }
    }
  `,
  gql`
    mutation RecipientViewComments_createPetitionFieldComment(
      $keycode: ID!
      $petitionFieldId: GID!
      $content: JSON!
    ) {
      publicCreatePetitionFieldComment(
        keycode: $keycode
        petitionFieldId: $petitionFieldId
        content: $content
      ) {
        ...PublicPetitionFieldComment_PublicPetitionFieldComment
        field {
          id
          commentCount
          unreadCommentCount
          comments {
            id
          }
        }
      }
    }
    ${PublicPetitionFieldComment.fragments.PublicPetitionFieldComment}
  `,
  gql`
    mutation RecipientViewComments_updatePetitionFieldComment(
      $keycode: ID!
      $petitionFieldId: GID!
      $petitionFieldCommentId: GID!
      $content: JSON!
    ) {
      publicUpdatePetitionFieldComment(
        keycode: $keycode
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
        content: $content
      ) {
        ...PublicPetitionFieldComment_PublicPetitionFieldComment
      }
    }
    ${PublicPetitionFieldComment.fragments.PublicPetitionFieldComment}
  `,
  gql`
    mutation RecipientViewComments_deletePetitionFieldComment(
      $keycode: ID!
      $petitionFieldId: GID!
      $petitionFieldCommentId: GID!
    ) {
      publicDeletePetitionFieldComment(
        keycode: $keycode
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
      ) {
        id
        commentCount
        unreadCommentCount
        comments {
          id
        }
      }
    }
  `,
];
