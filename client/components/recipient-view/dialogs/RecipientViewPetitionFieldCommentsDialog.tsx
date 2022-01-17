import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Center,
  Flex,
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
import { FieldComment } from "@parallel/components/common/FieldComment";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import {
  RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument,
  RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument,
  RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadDocument,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment,
  RecipientViewPetitionFieldCommentsDialog_publicPetitionFieldDocument,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment,
  RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument,
} from "@parallel/graphql/__types";
import { isMetaReturn } from "@parallel/utils/keys";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../../common/Divider";
import { GrowingTextarea } from "../../common/GrowingTextarea";

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

  const { data, loading } = useQuery(
    RecipientViewPetitionFieldCommentsDialog_publicPetitionFieldDocument,
    {
      variables: { keycode, petitionFieldId: field.id },
    }
  );
  const comments = data?.publicPetitionField.comments ?? [];

  const [draft, setDraft] = useState("");
  const [inputFocused, inputFocusBind] = useFocus({
    onBlurDelay: 300,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const closeRef = useRef<HTMLButtonElement>(null);

  const [markPetitionFieldCommentsAsRead] = useMutation(
    RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadDocument
  );

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const petitionFieldCommentIds = comments.filter((c) => c.isUnread).map((c) => c.id);
      if (petitionFieldCommentIds.length > 0) {
        await markPetitionFieldCommentsAsRead({
          variables: {
            keycode,
            petitionFieldCommentIds,
          },
        });
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [field.id, comments.map((c) => c.id).join(",")]);

  const [createPetitionFieldComment] = useMutation(
    RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument
  );
  async function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const content = draft.trim();
    if (isMetaReturn(event) && content) {
      event.preventDefault();
      try {
        await createPetitionFieldComment({
          variables: {
            keycode,
            petitionFieldId: field.id,
            content,
          },
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
        variables: {
          keycode,
          petitionFieldId: field.id,
          content: draft.trim(),
        },
      });
    } catch {}
    setNativeValue(textareaRef.current!, "");
    closeRef.current!.focus();
  }

  function handleCancelClick() {
    setNativeValue(textareaRef.current!, "");
    closeRef.current!.focus();
  }

  const [updatePetitionFieldComment] = useMutation(
    RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument
  );

  async function handleEditCommentContent(commentId: string, content: string) {
    try {
      await updatePetitionFieldComment({
        variables: {
          keycode,
          petitionFieldId: field.id,
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
          petitionFieldId: field.id,
          petitionFieldCommentId: commentId,
        },
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
        <ModalHeader paddingRight={12}>
          {field.title || (
            <Text fontWeight="normal" textStyle="hint">
              <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
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
                  isAuthor={access.contact!.id === comment.author?.id}
                  onEdit={(content) => handleEditCommentContent(comment.id, content)}
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
          <PaddedCollapse in={isExpanded}>
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
          </PaddedCollapse>
        </ModalFooter>
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
  get PetitionField() {
    return gql`
      fragment RecipientViewPetitionFieldCommentsDialog_PetitionField on PetitionField {
        id
        title
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
};

RecipientViewPetitionFieldCommentsDialog.queries = [
  gql`
    query RecipientViewPetitionFieldCommentsDialog_publicPetitionField(
      $keycode: ID!
      $petitionFieldId: GID!
    ) {
      publicPetitionField(keycode: $keycode, petitionFieldId: $petitionFieldId) {
        id
        title
        comments {
          id
          ...FieldComment_PublicPetitionFieldComment
        }
      }
    }
    ${FieldComment.fragments.PublicPetitionFieldComment}
  `,
];

RecipientViewPetitionFieldCommentsDialog.mutations = [
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
      }
    }
  `,
  gql`
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
        ...FieldComment_PublicPetitionFieldComment
        field {
          id
          comments {
            id
          }
        }
      }
    }
    ${FieldComment.fragments.PublicPetitionFieldComment}
  `,
  gql`
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
        ...FieldComment_PublicPetitionFieldComment
      }
    }
    ${FieldComment.fragments.PublicPetitionFieldComment}
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
        comments {
          id
        }
      }
    }
  `,
];
