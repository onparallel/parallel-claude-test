import { DataProxy, gql, useApolloClient } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Center,
  Collapse,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Portal,
  Spinner,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { CommentIcon, MoreVerticalIcon } from "@parallel/chakra/icons";
import { BaseDialog } from "@parallel/components/common/BaseDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import {
  RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables,
  RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables,
  RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationVariables,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentCountsFragment,
  RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables,
  RecipientViewPetitionFieldCommentsQuery,
  RecipientViewPetitionFieldCommentsQueryVariables,
  useRecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation,
  useRecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation,
  useRecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation,
  useRecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation,
  useRecipientViewPetitionFieldCommentsQuery,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { updateQuery } from "@parallel/utils/apollo/updateQuery";
import { FORMATS } from "@parallel/utils/dates";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../../common/BreakLines";
import { DateTime } from "../../common/DateTime";
import { DeletedContact } from "../../common/DeletedContact";
import { Divider } from "../../common/Divider";
import { GrowingTextarea } from "../../common/GrowingTextarea";
import { SmallPopover } from "../../common/SmallPopover";
import { Spacer } from "../../common/Spacer";

interface RecipientViewPetitionFieldCommentsDialogProps {
  keycode: string;
  access: RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment;
  field: RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment;
}

export function RecipientViewPetitionFieldCommentsDialog({
  keycode,
  access,
  field,
  ...props
}: DialogProps<RecipientViewPetitionFieldCommentsDialogProps>) {
  const intl = useIntl();

  const { data, loading } = useRecipientViewPetitionFieldCommentsQuery({
    variables: {
      keycode,
      petitionFieldId: field.id,
    },
  });
  const comments = data?.petitionFieldComments ?? [];

  const [draft, setDraft] = useState("");
  const [inputFocused, inputFocusBind] = useFocus({
    onBlurDelay: 300,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const closeRef = useRef<HTMLButtonElement>(null);

  const markPetitionFieldCommentsAsRead = useMarkPetitionFieldCommentsAsRead();
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const petitionFieldCommentIds = comments
        .filter((c) => c.isUnread)
        .map((c) => c.id);
      if (petitionFieldCommentIds.length > 0) {
        await markPetitionFieldCommentsAsRead({
          keycode,
          petitionFieldCommentIds,
          petitionFieldId: field.id,
        });
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [field.id, comments.map((c) => c.id).join(",")]);

  const createPetitionFieldComment = useCreatePetitionFieldComment();
  async function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && event.metaKey) {
      event.preventDefault();
      try {
        await createPetitionFieldComment({
          keycode,
          petitionFieldId: field.id,
          content: draft.trim(),
        });
      } catch {}
      setNativeValue(textareaRef.current!, "");
    }
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
  }

  async function handleSubmitClick() {
    try {
      await createPetitionFieldComment({
        keycode,
        petitionFieldId: field.id,
        content: draft.trim(),
      });
    } catch {}
    setNativeValue(textareaRef.current!, "");
    closeRef.current!.focus();
  }

  function handleCancelClick() {
    setNativeValue(textareaRef.current!, "");
    closeRef.current!.focus();
  }

  const updatePetitionFieldComment = useUpdatePetitionFieldComment();
  async function handleEditCommentContent(commentId: string, content: string) {
    try {
      await updatePetitionFieldComment({
        keycode,
        petitionFieldId: field.id,
        petitionFieldCommentId: commentId,
        content,
      });
    } catch {}
  }

  const deletePetitionFieldComment = useDeletePetitionFieldComment();
  async function handleDeleteClick(commentId: string) {
    try {
      await deletePetitionFieldComment({
        keycode,
        petitionFieldId: field.id,
        petitionFieldCommentId: commentId,
      });
    } catch {}
  }

  const isExpanded = Boolean(inputFocused || draft);

  return (
    <BaseDialog closeOnOverlayClick={false} {...props}>
      <ModalContent maxHeight="calc(100vh - 7.5rem)">
        <ModalCloseButton
          ref={closeRef}
          aria-label={intl.formatMessage({
            id: "generic.close",
            defaultMessage: "Close",
          })}
        />
        <ModalHeader>
          {field.title || (
            <Text fontWeight="normal" textStyle="hint">
              <FormattedMessage
                id="generic.untitled-field"
                defaultMessage="Untitled field"
              />
            </Text>
          )}
        </ModalHeader>
        <Divider />
        <ModalBody
          padding={0}
          overflow="auto"
          display="flex"
          flexDirection="column-reverse"
          minHeight="0"
        >
          {loading ? (
            <Center minHeight={64}>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="purple.500"
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
              <CommentIcon color="gray.300" boxSize="64px" />
              <Text color="gray.500">
                {access.granter!.fullName ? (
                  <FormattedMessage
                    id="recipient-view.field-comments.cta-with-name"
                    defaultMessage="Have any questions? Ask {name} here"
                    values={{ name: access.granter!.fullName }}
                  />
                ) : (
                  <FormattedMessage
                    id="recipient-view.field-comments.cta"
                    defaultMessage="Have any questions? Ask here"
                  />
                )}
              </Text>
            </Flex>
          ) : (
            <Stack spacing={0} divider={<Divider />}>
              {comments.map((comment, i) => (
                <FieldComment
                  key={comment.id}
                  comment={comment}
                  contactId={access.contact!.id}
                  onEdit={(content) =>
                    handleEditCommentContent(comment.id, content)
                  }
                  onDelete={() => handleDeleteClick(comment.id)}
                />
              ))}
            </Stack>
          )}
        </ModalBody>
        <Divider />
        <ModalFooter display="block">
          <GrowingTextarea
            ref={textareaRef}
            height="20px"
            size="sm"
            borderRadius="md"
            paddingX={2}
            minHeight={0}
            rows={1}
            placeholder={intl.formatMessage({
              id: "recipient-view.field-comments.placeholder",
              defaultMessage: "Ask here your questions and doubts",
            })}
            value={draft}
            onKeyDown={handleKeyDown as any}
            onChange={handleDraftChange as any}
            {...inputFocusBind}
          />
          <Collapse in={isExpanded}>
            <Stack direction="row" justifyContent="flex-end" paddingTop={2}>
              <Button size="sm" onClick={handleCancelClick}>
                <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                size="sm"
                colorScheme="purple"
                isDisabled={draft.trim().length === 0}
                onClick={handleSubmitClick}
              >
                <FormattedMessage id="generic.submit" defaultMessage="Submit" />
              </Button>
            </Stack>
          </Collapse>
        </ModalFooter>
      </ModalContent>
    </BaseDialog>
  );
}

export function usePetitionFieldCommentsDialog() {
  return useDialog(RecipientViewPetitionFieldCommentsDialog);
}

function FieldComment({
  comment,
  contactId,
  onDelete,
  onEdit,
}: {
  comment: RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment;
  contactId: string;
  onDelete: () => void;
  onEdit: (content: string) => void;
}) {
  const intl = useIntl();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleEditClick() {
    setContent(comment.content);
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current!.focus();
      textareaRef.current!.select();
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && event.metaKey) {
      event.preventDefault();
      setIsEditing(false);
      onEdit(content);
    }
  }

  function handleCancelClick() {
    setIsEditing(false);
  }

  function handleSaveClick() {
    setIsEditing(false);
    onEdit(content);
  }

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value);
  }

  return (
    <Box
      paddingX={6}
      paddingY={2}
      backgroundColor={
        !comment.publishedAt
          ? "yellow.50"
          : comment.isUnread
          ? "purple.50"
          : "white"
      }
    >
      <Box fontSize="sm" display="flex" alignItems="center">
        <Box as="strong" marginRight={2}>
          {comment.author?.__typename === "PublicContact" ? (
            comment.author.fullName
          ) : comment.author?.__typename === "PublicUser" ? (
            comment.author.fullName
          ) : (
            <DeletedContact />
          )}
        </Box>
        {comment.publishedAt ? (
          <DateTime
            color="gray.500"
            value={comment.publishedAt}
            format={FORMATS.LLL}
            useRelativeTime
          />
        ) : (
          <SmallPopover
            content={
              <Text fontSize="sm">
                <FormattedMessage
                  id="petition-replies.pending-comment-popover"
                  defaultMessage="Send all your pending comments at once to notify in a single email"
                />
              </Text>
            }
          >
            <Badge colorScheme="yellow" variant="outline" cursor="default">
              <FormattedMessage
                id="petition-replies.comment-pending.label"
                defaultMessage="Pending"
              />
            </Badge>
          </SmallPopover>
        )}
        <Spacer />
        {contactId === comment.author?.id ? (
          <Menu placement="bottom-end">
            <Tooltip
              label={intl.formatMessage({
                id: "generic.more-options",
                defaultMessage: "More options...",
              })}
            >
              <MenuButton
                as={IconButton}
                variant="ghost"
                size="xs"
                icon={<MoreVerticalIcon />}
                aria-label={intl.formatMessage({
                  id: "generic.more-options",
                  defaultMessage: "More options...",
                })}
              />
            </Tooltip>
            <Portal>
              <MenuList minWidth="160px">
                <MenuItem onClick={handleEditClick}>
                  <FormattedMessage id="generic.edit" defaultMessage="Edit" />
                </MenuItem>
                <MenuItem onClick={onDelete}>
                  <FormattedMessage
                    id="generic.delete"
                    defaultMessage="Delete"
                  />
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        ) : null}
      </Box>
      {isEditing ? (
        <Box marginTop={1} marginX={-2}>
          <GrowingTextarea
            ref={textareaRef}
            height="20px"
            size="sm"
            borderRadius="md"
            paddingX={2}
            minHeight={0}
            rows={1}
            value={content}
            onKeyDown={handleKeyDown as any}
            onChange={handleContentChange as any}
          />
          <Stack direction="row" justifyContent="flex-end" marginTop={2}>
            <Button size="sm" onClick={handleCancelClick}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
            <Button size="sm" colorScheme="purple" onClick={handleSaveClick}>
              <FormattedMessage id="generic.save" defaultMessage="Save" />
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box fontSize="sm">
          <BreakLines text={content} />
        </Box>
      )}
    </Box>
  );
}

RecipientViewPetitionFieldCommentsDialog.fragments = {
  get PublicPetitionAccess() {
    return gql`
      fragment RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccess on PublicPetitionAccess {
        granter {
          fullName
        }
        contact {
          id
        }
      }
    `;
  },
  get PublicPetitionField() {
    return gql`
      fragment RecipientViewPetitionFieldCommentsDialog_PublicPetitionField on PublicPetitionField {
        id
        title
      }
    `;
  },
  get PublicPetitionFieldComment() {
    return gql`
      fragment RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment on PublicPetitionFieldComment {
        id
        author {
          ... on PublicUser {
            id
            fullName
          }
          ... on PublicContact {
            id
            fullName
          }
        }
        content
        publishedAt
        isUnread
      }
    `;
  },
};

const _comments = gql`
  query RecipientViewPetitionFieldComments(
    $keycode: ID!
    $petitionFieldId: GID!
  ) {
    petitionFieldComments(
      keycode: $keycode
      petitionFieldId: $petitionFieldId
    ) {
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
    }
  }
  ${RecipientViewPetitionFieldCommentsDialog.fragments
    .PublicPetitionFieldComment}
`;

const _publicMarkPetitionFieldCommentsAsRead = gql`
  mutation RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsRead(
    $keycode: ID!
    $petitionFieldCommentIds: [GID!]!
  ) {
    publicMarkPetitionFieldCommentsAsRead(
      keycode: $keycode
      petitionFieldCommentIds: $petitionFieldCommentIds
    ) {
      id
      isUnread
    }
  }
`;

function useMarkPetitionFieldCommentsAsRead() {
  const [
    markPetitionFieldCommentsAsRead,
  ] = useRecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation();
  return useCallback(async function ({
    petitionFieldId,
    ...variables
  }: {
    petitionFieldId: string;
  } & RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationVariables) {
    await markPetitionFieldCommentsAsRead({
      variables,
      update(client, { data }) {
        if (data) {
          updatePetitionFieldCommentCounts(
            client,
            petitionFieldId,
            (field) => ({
              ...field,
              unreadCommentCount:
                field.unreadCommentCount -
                variables.petitionFieldCommentIds.length,
            })
          );
        }
      },
    });
  }, []);
}

const _publicCreatePetitionFieldComment = gql`
  mutation RecipientViewPetitionFieldCommentsDialog_createPetitionFieldComment(
    $keycode: ID!
    $petitionFieldId: GID!
    $content: String!
  ) {
    publicCreatePetitionFieldComment(
      keycode: $keycode
      petitionFieldId: $petitionFieldId
      content: $content
    ) {
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
    }
  }
  ${RecipientViewPetitionFieldCommentsDialog.fragments
    .PublicPetitionFieldComment}
`;

function useCreatePetitionFieldComment() {
  const [
    createPetitionFieldComment,
  ] = useRecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation();
  return useCallback(
    async (
      variables: RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables
    ) => {
      await createPetitionFieldComment({
        variables,
        update(client, { data }) {
          if (data) {
            updatePetitionFieldComments(
              client,
              variables.keycode,
              variables.petitionFieldId,
              (comments) => [
                ...comments,
                data!.publicCreatePetitionFieldComment,
              ]
            );

            updatePetitionFieldCommentCounts(
              client,
              variables.petitionFieldId,
              (field) => ({
                ...field,
                commentCount: field.commentCount + 1,
                unpublishedCommentCount: field.unpublishedCommentCount + 1,
              })
            );
          }
        },
      });
    },
    [createPetitionFieldComment]
  );
}

const _publicUpdatePetitionFieldComment = gql`
  mutation RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldComment(
    $keycode: ID!
    $petitionFieldId: GID!
    $petitionFieldCommentId: GID!
    $content: String!
  ) {
    publicUpdatePetitionFieldComment(
      keycode: $keycode
      petitionFieldId: $petitionFieldId
      petitionFieldCommentId: $petitionFieldCommentId
      content: $content
    ) {
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
    }
  }
  ${RecipientViewPetitionFieldCommentsDialog.fragments
    .PublicPetitionFieldComment}
`;

function useUpdatePetitionFieldComment() {
  const [
    updatePetitionFieldComment,
  ] = useRecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation();
  const apollo = useApolloClient();
  return useCallback(
    async (
      variables: RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables
    ) => {
      await updatePetitionFieldComment({
        variables,
        optimisticResponse: () => {
          const comment = apollo.readFragment<RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment>(
            {
              fragment:
                RecipientViewPetitionFieldCommentsDialog.fragments
                  .PublicPetitionFieldComment,
              id: variables.petitionFieldCommentId,
            }
          );
          return {
            publicUpdatePetitionFieldComment: {
              ...comment!,
              content: variables.content,
            },
          };
        },
      });
    },
    [updatePetitionFieldComment]
  );
}

const _deletePetitionFieldComment = gql`
  mutation RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldComment(
    $keycode: ID!
    $petitionFieldId: GID!
    $petitionFieldCommentId: GID!
  ) {
    publicDeletePetitionFieldComment(
      keycode: $keycode
      petitionFieldId: $petitionFieldId
      petitionFieldCommentId: $petitionFieldCommentId
    )
  }
`;

function useDeletePetitionFieldComment() {
  const [
    deletePetitionFieldComment,
  ] = useRecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation();
  return useCallback(
    async (
      variables: RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables
    ) => {
      await deletePetitionFieldComment({
        variables,
        update(client, { data }) {
          if (data) {
            const { previous } = updatePetitionFieldComments(
              client,
              variables.keycode,
              variables.petitionFieldId,
              (comments) =>
                comments.filter(
                  (c) => c.id !== variables.petitionFieldCommentId
                )
            );
            const removed = previous?.petitionFieldComments?.find(
              (c) => c.id === variables.petitionFieldCommentId
            );
            if (removed) {
              updatePetitionFieldCommentCounts(
                client,
                variables.petitionFieldId,
                (field) => ({
                  ...field,
                  commentCount: field.commentCount - 1,
                  unpublishedCommentCount:
                    field.unpublishedCommentCount -
                    (removed.publishedAt ? 0 : 1),
                })
              );
            }
          }
        },
      });
    },
    [deletePetitionFieldComment]
  );
}

function updatePetitionFieldComments(
  proxy: DataProxy,
  keycode: string,
  petitionFieldId: string,
  updateFn: (
    cached: RecipientViewPetitionFieldCommentsQuery["petitionFieldComments"]
  ) => RecipientViewPetitionFieldCommentsQuery["petitionFieldComments"]
) {
  return updateQuery<
    RecipientViewPetitionFieldCommentsQuery,
    RecipientViewPetitionFieldCommentsQueryVariables
  >(proxy, {
    query: _comments,
    variables: { keycode, petitionFieldId },
    data: (cached) => ({
      petitionFieldComments: updateFn(cached!.petitionFieldComments),
    }),
  });
}

function updatePetitionFieldCommentCounts(
  proxy: DataProxy,
  petitionFieldId: string,
  updateFn: (
    cached: RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentCountsFragment
  ) => RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentCountsFragment
) {
  return updateFragment<RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentCountsFragment>(
    proxy,
    {
      fragment: gql`
        fragment RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentCounts on PublicPetitionField {
          commentCount
          unpublishedCommentCount
          unreadCommentCount
        }
      `,
      id: petitionFieldId,
      data: (field) => updateFn(field!),
    }
  );
}
