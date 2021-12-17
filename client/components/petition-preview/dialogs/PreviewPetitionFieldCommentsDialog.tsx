import { DataProxy, gql, useMutation } from "@apollo/client";
import {
  Button,
  Flex,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
} from "@chakra-ui/react";
import { VariablesOf } from "@graphql-typed-document-node/core";
import { CommentIcon } from "@parallel/chakra/icons";
import { BaseDialog } from "@parallel/components/common/dialogs/BaseDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FieldComment } from "@parallel/components/common/FieldComment";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import {
  PreviewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument,
  PreviewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument,
  PreviewPetitionFieldCommentsDialog_PetitionFieldFragment,
  PreviewPetitionFieldCommentsDialog_PetitionFieldFragmentDoc,
  PreviewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument,
  PreviewPetitionField_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { isMetaReturn } from "@parallel/utils/keys";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import { ChangeEvent, KeyboardEvent, useCallback, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../../common/Divider";
import { GrowingTextarea } from "../../common/GrowingTextarea";

interface PreviewPetitionFieldCommentsDialogProps {
  petitionId: string;
  field: PreviewPetitionField_PetitionFieldFragment;
}

export function PreviewPetitionFieldCommentsDialog({
  petitionId,
  field,
  ...props
}: DialogProps<PreviewPetitionFieldCommentsDialogProps>) {
  const intl = useIntl();

  const comments = field.comments;

  const [draft, setDraft] = useState("");
  const [inputFocused, inputFocusBind] = useFocus({
    onBlurDelay: 300,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const closeRef = useRef<HTMLButtonElement>(null);

  const createPetitionFieldComment = useCreatePetitionFieldComment();
  async function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const content = draft.trim();
    if (isMetaReturn(event) && content) {
      event.preventDefault();
      try {
        await createPetitionFieldComment({
          petitionId,
          petitionFieldId: field.id,
          content,
          isInternal: false,
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
        petitionId,
        petitionFieldId: field.id,
        content: draft.trim(),
        isInternal: false,
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
        petitionId,
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
        petitionId,
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
          {comments.length === 0 ? (
            <Flex
              flexDirection="column"
              paddingX={4}
              paddingY={8}
              justifyContent="center"
              alignItems="center"
            >
              <CommentIcon color="gray.300" boxSize="64px" />
              <Text color="gray.500">
                <FormattedMessage
                  id="recipient-view.field-comments.cta"
                  defaultMessage="Have any questions? Ask here"
                />
              </Text>
            </Flex>
          ) : (
            <Stack spacing={0} divider={<Divider />}>
              {comments.map((comment, i) => (
                <FieldComment
                  key={comment.id}
                  comment={comment}
                  contactId={comment.author?.id ?? ""}
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

export function usePreviewPetitionFieldCommentsDialog() {
  return useDialog(PreviewPetitionFieldCommentsDialog);
}

PreviewPetitionFieldCommentsDialog.fragments = {
  get PetitionFieldComment() {
    return gql`
      fragment PreviewPetitionFieldCommentsDialog_PetitionFieldComment on PetitionFieldComment {
        id
        createdAt
        content
        isUnread
        author {
          ... on User {
            id
            fullName
          }
          ... on PetitionAccess {
            id
            granter {
              id
              fullName
            }
            contact {
              id
              fullName
            }
          }
        }
      }
    `;
  },
  get PetitionField() {
    return gql`
      fragment PreviewPetitionFieldCommentsDialog_PetitionField on PetitionField {
        id
        title
        comments {
          ...PreviewPetitionFieldCommentsDialog_PetitionFieldComment
        }
      }
      ${this.PetitionFieldComment}
    `;
  },
};

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
        ...PreviewPetitionFieldCommentsDialog_PetitionField
      }
    }
    ${PreviewPetitionFieldCommentsDialog.fragments.PetitionField}
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
        ...PreviewPetitionFieldCommentsDialog_PetitionField
      }
    }
    ${PreviewPetitionFieldCommentsDialog.fragments.PetitionField}
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
      }
    }
    ${PreviewPetitionFieldCommentsDialog.fragments.PetitionField}
  `,
];

function useCreatePetitionFieldComment() {
  const [createPetitionFieldComment] = useMutation(
    PreviewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument
  );

  return useCallback(
    async (
      variables: VariablesOf<
        typeof PreviewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument
      >
    ) => {
      await createPetitionFieldComment({
        variables,
        update(cache, { data }) {
          if (data) {
            updatePetitionFieldComments(
              cache,
              variables.petitionFieldId,
              () => data!.createPetitionFieldComment.comments
            );
          }
        },
      });
    },
    [createPetitionFieldComment]
  );
}

function useUpdatePetitionFieldComment() {
  const [updatePetitionFieldComment] = useMutation(
    PreviewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument
  );
  return useCallback(
    async (
      variables: VariablesOf<
        typeof PreviewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument
      >
    ) => {
      await updatePetitionFieldComment({
        variables,
        update(cache, { data }) {
          if (data) {
            updatePetitionFieldComments(
              cache,
              variables.petitionFieldId,
              () => data!.updatePetitionFieldComment.comments
            );
          }
        },
      });
    },
    [updatePetitionFieldComment]
  );
}

function useDeletePetitionFieldComment() {
  const [deletePetitionFieldComment] = useMutation(
    PreviewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument
  );
  return useCallback(
    async (
      variables: VariablesOf<
        typeof PreviewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument
      >
    ) => {
      await deletePetitionFieldComment({
        variables,
        update(cache, { data }) {
          if (data) {
            updatePetitionFieldComments(
              cache,
              variables.petitionFieldId,
              () => data!.deletePetitionFieldComment.comments
            );
          }
        },
      });
    },
    [deletePetitionFieldComment]
  );
}

function updatePetitionFieldComments(
  proxy: DataProxy,
  petitionFieldId: string,
  updateFn: () => PreviewPetitionFieldCommentsDialog_PetitionFieldFragment["comments"]
) {
  updateFragment(proxy, {
    id: petitionFieldId,
    fragment: PreviewPetitionFieldCommentsDialog_PetitionFieldFragmentDoc,
    data: (cached) => ({ ...cached!, comments: updateFn() }),
  });
}
