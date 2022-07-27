import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Center,
  Flex,
  HStack,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CommentIcon } from "@parallel/chakra/icons";
import { BaseDialog } from "@parallel/components/common/dialogs/BaseDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PublicPetitionFieldComment } from "@parallel/components/common/PublicPetitionFieldComment";
import {
  CommentEditor,
  CommentEditorInstance,
  emptyCommentEditorValue,
  isEmptyCommentEditorValue,
} from "@parallel/components/common/slate/CommentEditor";
import {
  RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument,
  RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument,
  RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadDocument,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment,
  RecipientViewPetitionFieldCommentsDialog_publicPetitionFieldDocument,
  RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument,
  Tone,
} from "@parallel/graphql/__types";
import { isMetaReturn } from "@parallel/utils/keys";
import { useTimeoutEffect } from "@parallel/utils/useTimeoutEffect";
import { KeyboardEvent, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../../common/Divider";

interface RecipientViewPetitionFieldCommentsDialogProps {
  keycode: string;
  fieldId: string;
  access: RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment;
  tone: Tone;
}

export function RecipientViewPetitionFieldCommentsDialog({
  keycode,
  access,
  fieldId,
  tone,
  ...props
}: DialogProps<RecipientViewPetitionFieldCommentsDialogProps>) {
  const intl = useIntl();

  const { data, loading } = useQuery(
    RecipientViewPetitionFieldCommentsDialog_publicPetitionFieldDocument,
    { variables: { keycode, petitionFieldId: fieldId } }
  );
  const field = data?.publicPetitionField;
  const comments = data?.publicPetitionField.comments ?? [];

  const [draft, setDraft] = useState(emptyCommentEditorValue());
  const isDraftEmpty = isEmptyCommentEditorValue(draft);
  const editorRef = useRef<CommentEditorInstance>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [markPetitionFieldCommentsAsRead] = useMutation(
    RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadDocument
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
    [fieldId, comments.map((c) => c.id).join(",")]
  );

  const [createPetitionFieldComment] = useMutation(
    RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument
  );
  async function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isMetaReturn(event)) {
      event.preventDefault();
      await handleSubmitClick();
    }
  }

  async function handleSubmitClick() {
    if (!isEmptyCommentEditorValue(draft)) {
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
    closeRef.current!.focus();
  }

  const [updatePetitionFieldComment] = useMutation(
    RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument
  );

  async function handleEditCommentContent(commentId: string, content: any) {
    try {
      await updatePetitionFieldComment({
        variables: {
          keycode,
          petitionFieldId: fieldId,
          petitionFieldCommentId: commentId,
          content,
        },
      });
    } catch {}
  }

  const [deletePetitionFieldComment] = useMutation(
    RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument
  );
  async function handleDeleteClick(commentId: string) {
    try {
      await deletePetitionFieldComment({
        variables: {
          keycode,
          petitionFieldId: fieldId,
          petitionFieldCommentId: commentId,
        },
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
        {loading ? null : (
          <ModalHeader paddingRight={12}>
            {field!.title || (
              <Text fontWeight="normal" textStyle="hint">
                <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
              </Text>
            )}
          </ModalHeader>
        )}
        <Divider />
        <ModalBody padding={0} display="flex" flexDirection="column-reverse" minHeight="0">
          {loading ? (
            <Center minHeight={64}>
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
              textAlign="center"
            >
              <CommentIcon color="gray.300" boxSize="64px" />
              <Text color="gray.500">
                {access.granter!.fullName ? (
                  <FormattedMessage
                    id="recipient-view.field-comments.cta-with-name"
                    defaultMessage="{tone, select, INFORMAL{Have} other{Do you have}} any questions? Ask {name} here"
                    values={{ name: access.granter!.fullName, tone }}
                  />
                ) : (
                  <FormattedMessage
                    id="recipient-view.field-comments.cta"
                    defaultMessage="{tone, select, INFORMAL{Have} other{Do you have}} any questions? Ask here"
                    values={{ tone }}
                  />
                )}
              </Text>
            </Flex>
          ) : (
            <Stack spacing={0} divider={<Divider />} overflow="auto">
              {comments.map((comment) => (
                <PublicPetitionFieldComment
                  key={comment.id}
                  comment={comment}
                  onEdit={(content) => handleEditCommentContent(comment.id, content)}
                  onDelete={() => handleDeleteClick(comment.id)}
                />
              ))}
            </Stack>
          )}
        </ModalBody>
        {loading ? null : (
          <>
            <Divider />
            <ModalFooter display="block" padding={2}>
              <HStack>
                <CommentEditor
                  id={`comment-draft-editor-${fieldId}`}
                  ref={editorRef}
                  value={draft}
                  onChange={setDraft}
                  onKeyDown={handleKeyDown}
                  placeholder={intl.formatMessage(
                    {
                      id: "recipient-view.field-comments.placeholder",
                      defaultMessage: "Ask here your questions and doubts",
                    },
                    { tone }
                  )}
                />
                <Button colorScheme="primary" isDisabled={isDraftEmpty} onClick={handleSubmitClick}>
                  <FormattedMessage id="generic.submit" defaultMessage="Submit" />
                </Button>
              </HStack>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </BaseDialog>
  );
}

export function usePetitionFieldCommentsDialog() {
  return useDialog(RecipientViewPetitionFieldCommentsDialog);
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
        commentCount
        unreadCommentCount
        comments {
          id
          ...PublicPetitionFieldComment_PublicPetitionFieldComment
        }
      }
      ${PublicPetitionFieldComment.fragments.PublicPetitionFieldComment}
    `;
  },
};

const _queries = [
  gql`
    query RecipientViewPetitionFieldCommentsDialog_publicPetitionField(
      $keycode: ID!
      $petitionFieldId: GID!
    ) {
      publicPetitionField(keycode: $keycode, petitionFieldId: $petitionFieldId) {
        ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
      }
    }
    ${RecipientViewPetitionFieldCommentsDialog.fragments.PublicPetitionField}
  `,
];

const _mutations = [
  gql`
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
        field {
          id
          unreadCommentCount
        }
      }
    }
  `,
  gql`
    mutation RecipientViewPetitionFieldCommentsDialog_createPetitionFieldComment(
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
    mutation RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldComment(
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
    mutation RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldComment(
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
