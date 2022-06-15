import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Checkbox,
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
import { VariablesOf } from "@graphql-typed-document-node/core";
import { AlertCircleIcon, CommentIcon } from "@parallel/chakra/icons";
import { BaseDialog } from "@parallel/components/common/dialogs/BaseDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FieldComment } from "@parallel/components/common/FieldComment";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { Link } from "@parallel/components/common/Link";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
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
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../../common/Divider";
import { GrowingTextarea } from "../../common/GrowingTextarea";

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
  const hasInternalComments = userData?.me.hasInternalComments ?? false;

  const { data, loading } = useQuery(
    PreviewPetitionFieldCommentsDialog_petitionFieldQueryDocument,
    {
      variables: { petitionId, petitionFieldId: field.id },
      fetchPolicy: "cache-and-network",
    }
  );

  const comments = data?.petitionField.comments ?? [];

  const [draft, setDraft] = useState("");
  const [inputFocused, inputFocusBind] = useFocus({
    onBlurDelay: 300,
  });

  const hasCommentsEnabled = field.isInternal ? false : field.hasCommentsEnabled;

  const [isInternalComment, setInternalComment] = useState(
    !hasCommentsEnabled || onlyInternalComments
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  async function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isTemplate) return;
    const content = draft.trim();
    if (isMetaReturn(event) && content) {
      event.preventDefault();
      try {
        await createPetitionFieldComment({
          petitionId,
          petitionFieldId: field.id,
          content,
          isInternal: isInternalComment,
        });
      } catch {}
      setNativeValue(textareaRef.current!, "");
    }
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
  }

  async function handleSubmitClick() {
    if (isTemplate) return;
    try {
      await createPetitionFieldComment({
        petitionId,
        petitionFieldId: field.id,
        content: draft.trim(),
        isInternal: isInternalComment,
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
        <ModalBody padding={0} display="flex" flexDirection="column-reverse" minHeight="0">
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
                  <Text color="gray.500">
                    <FormattedMessage
                      id="component.preview-petition-field-comments-dialog.comments-cta"
                      defaultMessage="Have any questions? Ask here"
                    />
                  </Text>
                </>
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
          ) : (
            <Stack spacing={0} divider={<Divider />} overflow="auto">
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
        </ModalBody>
        <Divider />
        <ModalFooter display="block">
          <GrowingTextarea
            ref={textareaRef}
            size="sm"
            borderRadius="md"
            paddingX={2}
            minHeight={0}
            maxHeight={20}
            rows={1}
            placeholder={intl.formatMessage(
              {
                id: "recipient-view.field-comments.placeholder",
                defaultMessage: "Ask here your questions and doubts",
              },
              { tone }
            )}
            value={draft}
            onKeyDown={handleKeyDown as any}
            onChange={handleDraftChange as any}
            isDisabled={isDisabled || (!hasCommentsEnabled && !hasInternalComments)}
            {...inputFocusBind}
          />
          <PaddedCollapse in={isExpanded}>
            <Stack
              direction="row"
              justifyContent={hasInternalComments ? "space-between" : "flex-end"}
              paddingTop={2}
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
                  size="sm"
                  colorScheme="primary"
                  isDisabled={draft.trim().length === 0 || isTemplate}
                  onClick={handleSubmitClick}
                >
                  <FormattedMessage id="generic.submit" defaultMessage="Submit" />
                </Button>
              </Stack>
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
        hasInternalComments: hasFeatureFlag(featureFlag: INTERNAL_COMMENTS)
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
