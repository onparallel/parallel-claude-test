import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Box,
  Center,
  Flex,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { VariablesOf } from "@graphql-typed-document-node/core";
import { CommentIcon, NoteIcon } from "@parallel/chakra/icons";
import { BaseDialog } from "@parallel/components/common/dialogs/BaseDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FieldComment } from "@parallel/components/common/FieldComment";
import { Link } from "@parallel/components/common/Link";
import { PetitionCommentsAndNotes } from "@parallel/components/petition-common/PetitionCommentsAndNotes";
import {
  PreviewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument,
  PreviewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument,
  PreviewPetitionFieldCommentsDialog_petitionFieldQueryDocument,
  PreviewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument,
  PreviewPetitionFieldCommentsDialog_userDocument,
  PreviewPetitionField_PetitionFieldFragment,
  Tone,
} from "@parallel/graphql/__types";
import { isMetaReturn } from "@parallel/utils/keys";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { KeyboardEvent, useCallback, useEffect, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../../common/Divider";

interface PreviewPetitionFieldCommentsDialogProps {
  petitionId: string;
  field: PreviewPetitionField_PetitionFieldFragment;
  isTemplate?: boolean;
  tone: Tone;
  isDisabled: boolean;
  onlyInternalComments: boolean;
}

export function PreviewPetitionFieldCommentsDialog({
  petitionId,
  field,
  isTemplate,
  tone,
  isDisabled,
  onlyInternalComments,
  ...props
}: DialogProps<PreviewPetitionFieldCommentsDialogProps>) {
  const intl = useIntl();

  const { data: userData } = useQuery(PreviewPetitionFieldCommentsDialog_userDocument);

  const myId = userData?.me.id;
  const { data, loading } = useQuery(
    PreviewPetitionFieldCommentsDialog_petitionFieldQueryDocument,
    {
      variables: { petitionId, petitionFieldId: field.id },
      fetchPolicy: "cache-and-network",
    }
  );

  const comments = data?.petitionField.comments ?? [];
  const hasCommentsEnabled = field.isInternal ? false : field.hasCommentsEnabled;
  const closeRef = useRef<HTMLButtonElement>(null);

  const updateIsReadNotification = useUpdateIsReadNotification();
  async function handleMarkAsUnread(commentId: string) {
    await updateIsReadNotification({
      petitionFieldCommentIds: [commentId],
      isRead: false,
    });
  }

  useEffect(() => {
    if (comments.length) {
      const timeout = setTimeout(async () => {
        const petitionFieldCommentIds = comments.filter((c) => c.isUnread).map((c) => c.id);
        if (petitionFieldCommentIds.length > 0) {
          await updateIsReadNotification({
            petitionFieldCommentIds,
            isRead: true,
          });
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [field.id, comments.length]);

  const createPetitionFieldComment = useCreatePetitionFieldComment();
  async function handleKeyDown({
    event,
    content,
    isInternal,
  }: {
    event: KeyboardEvent<HTMLTextAreaElement>;
    content: string;
    isInternal: boolean;
  }) {
    let cleanTextarea = false;
    if (isTemplate) return cleanTextarea;
    if (isMetaReturn(event) && content) {
      event.preventDefault();
      try {
        await createPetitionFieldComment({
          petitionId,
          petitionFieldId: field.id,
          content,
          isInternal,
        });
        cleanTextarea = true;
      } catch {}
    }
    return cleanTextarea;
  }

  async function handleSubmitClick({
    content,
    isInternal,
  }: {
    content: string;
    isInternal: boolean;
  }) {
    if (isTemplate) return;
    try {
      await createPetitionFieldComment({
        petitionId,
        petitionFieldId: field.id,
        content,
        isInternal,
      });
    } catch {}
    closeRef.current!.focus();
  }

  const updatePetitionFieldComment = useUpdatePetitionFieldComment();
  async function handleEditCommentContent(commentId: string, content: string) {
    if (isTemplate) return;
    try {
      await updatePetitionFieldComment({
        petitionId,
        petitionFieldId: field.id,
        petitionFieldCommentId: commentId,
        content,
      });
    } catch {}
  }

  const deletePetitionFieldComment = useDeletePetitionFieldComment();
  async function handleDeleteClick(commentId: string) {
    if (isTemplate) return;
    try {
      await deletePetitionFieldComment({
        petitionId,
        petitionFieldId: field.id,
        petitionFieldCommentId: commentId,
      });
    } catch {}
  }

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
        <ModalHeader paddingRight={12}>
          {field.title || (
            <Text fontWeight="normal" textStyle="hint">
              <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
            </Text>
          )}
        </ModalHeader>
        <Divider />
        <ModalBody padding={0} minHeight="0">
          <PetitionCommentsAndNotes
            body={
              <>
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
                    overflow="auto"
                    flexDirection="column"
                    paddingX={4}
                    paddingY={8}
                    justifyContent="center"
                    alignItems="center"
                  >
                    {hasCommentsEnabled ? (
                      <>
                        <CommentIcon color="gray.300" boxSize="64px" />
                      </>
                    ) : (
                      <Stack alignItems="center" textAlign="center">
                        <NoteIcon boxSize="64px" color="gray.200" />
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
                      </Stack>
                    )}
                  </Flex>
                ) : (
                  <Stack
                    spacing={0}
                    divider={<Divider />}
                    overflow="auto"
                    maxHeight="calc(100vh - 20rem)"
                  >
                    {comments.map((comment) => (
                      <FieldComment
                        key={comment.id}
                        comment={comment}
                        isAuthor={myId === comment.author?.id}
                        onEdit={(content) => handleEditCommentContent(comment.id, content)}
                        onDelete={() => handleDeleteClick(comment.id)}
                        onMarkAsUnread={() => handleMarkAsUnread(comment.id)}
                      />
                    ))}
                  </Stack>
                )}
                {isTemplate ? (
                  <Box padding={2}>
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Text>
                        <FormattedMessage
                          id="component.preview-comments-dialog.template-no-comments-added"
                          defaultMessage="<b>Preview only</b> - comments are disabled."
                        />
                      </Text>
                    </Alert>
                  </Box>
                ) : null}
              </>
            }
            isDisabled={isDisabled}
            isTemplate={isTemplate ?? false}
            hasCommentsEnabled={hasCommentsEnabled}
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
        </ModalBody>
      </ModalContent>
    </BaseDialog>
  );
}

export function usePreviewPetitionFieldCommentsDialog() {
  return useDialog(PreviewPetitionFieldCommentsDialog);
}

PreviewPetitionFieldCommentsDialog.fragments = {
  get PetitionField() {
    return gql`
      fragment PreviewPetitionFieldCommentsDialog_PetitionField on PetitionField {
        id
        title
        isInternal
        commentCount
        unreadCommentCount
        comments {
          ...FieldComment_PetitionFieldComment
        }
        hasCommentsEnabled
      }
      ${FieldComment.fragments.PetitionFieldComment}
    `;
  },
};

PreviewPetitionFieldCommentsDialog.queries = [
  gql`
    query PreviewPetitionFieldCommentsDialog_user {
      me {
        id
      }
    }
  `,
  gql`
    query PreviewPetitionFieldCommentsDialog_petitionFieldQuery(
      $petitionId: GID!
      $petitionFieldId: GID!
    ) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        ...PreviewPetitionFieldCommentsDialog_PetitionField
      }
    }
    ${PreviewPetitionFieldCommentsDialog.fragments.PetitionField}
  `,
];

PreviewPetitionFieldCommentsDialog.mutations = [
  gql`
    mutation PreviewPetitionFieldCommentsDialog_createPetitionFieldComment(
      $petitionId: GID!
      $petitionFieldId: GID!
      $content: String!
      $isInternal: Boolean
    ) {
      createPetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        content: $content
        isInternal: $isInternal
      ) {
        ...FieldComment_PetitionFieldComment
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
    ${FieldComment.fragments.PetitionFieldComment}
  `,
  gql`
    mutation PreviewPetitionFieldCommentsDialog_updatePetitionFieldComment(
      $petitionId: GID!
      $petitionFieldId: GID!
      $petitionFieldCommentId: GID!
      $content: String!
    ) {
      updatePetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
        content: $content
      ) {
        ...FieldComment_PetitionFieldComment
        field {
          id
          comments {
            id
          }
        }
      }
    }
    ${FieldComment.fragments.PetitionFieldComment}
  `,
  gql`
    mutation PreviewPetitionFieldCommentsDialog_deletePetitionFieldComment(
      $petitionId: GID!
      $petitionFieldId: GID!
      $petitionFieldCommentId: GID!
    ) {
      deletePetitionFieldComment(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        petitionFieldCommentId: $petitionFieldCommentId
      ) {
        ...PreviewPetitionFieldCommentsDialog_PetitionField
        commentCount
        unreadCommentCount
        comments {
          id
        }
      }
    }
    ${PreviewPetitionFieldCommentsDialog.fragments.PetitionField}
  `,
];

export function useCreatePetitionFieldComment() {
  const [createPetitionFieldComment] = useMutation(
    PreviewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument
  );

  return useCallback(
    async (
      variables: VariablesOf<
        typeof PreviewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument
      >
    ) => {
      await createPetitionFieldComment({ variables });
    },
    [createPetitionFieldComment]
  );
}

export function useUpdatePetitionFieldComment() {
  const [updatePetitionFieldComment] = useMutation(
    PreviewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument
  );
  return useCallback(
    async (
      variables: VariablesOf<
        typeof PreviewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument
      >
    ) => {
      await updatePetitionFieldComment({ variables });
    },
    [updatePetitionFieldComment]
  );
}

export function useDeletePetitionFieldComment() {
  const [deletePetitionFieldComment] = useMutation(
    PreviewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument
  );
  return useCallback(
    async (
      variables: VariablesOf<
        typeof PreviewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument
      >
    ) => {
      await deletePetitionFieldComment({ variables });
    },
    [deletePetitionFieldComment]
  );
}
