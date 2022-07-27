import { gql, useQuery } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Box,
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
import { CommentIcon, NoteIcon } from "@parallel/chakra/icons";
import { BaseDialog } from "@parallel/components/common/dialogs/BaseDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Link } from "@parallel/components/common/Link";
import { PetitionFieldComment } from "@parallel/components/common/PetitionFieldComment";
import { PetitionCommentsAndNotesEditor } from "@parallel/components/petition-common/PetitionCommentsAndNotesEditor";
import {
  PreviewPetitionFieldCommentsDialog_petitionFieldQueryDocument,
  PreviewPetitionField_PetitionFieldFragment,
  Tone,
} from "@parallel/graphql/__types";
import { useGetMyId } from "@parallel/utils/apollo/getMyId";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useTimeoutEffect } from "@parallel/utils/useTimeoutEffect";
import { useCallback, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  useCreatePetitionFieldComment,
  useDeletePetitionFieldComment,
  useUpdatePetitionFieldComment,
} from "../../../utils/mutations/comments";
import { Divider } from "../../common/Divider";

interface PreviewPetitionFieldCommentsDialogProps {
  petitionId: string;
  field: PreviewPetitionField_PetitionFieldFragment;
  isTemplate?: boolean;
  tone: Tone;
  isDisabled: boolean;
  onlyReadPermission: boolean;
}

export function PreviewPetitionFieldCommentsDialog({
  petitionId,
  field,
  isTemplate,
  tone,
  isDisabled,
  onlyReadPermission,
  ...props
}: DialogProps<PreviewPetitionFieldCommentsDialogProps>) {
  const intl = useIntl();

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

  useTimeoutEffect(
    async () => {
      const petitionFieldCommentIds = comments.filter((c) => c.isUnread).map((c) => c.id);
      if (petitionFieldCommentIds.length > 0) {
        await updateIsReadNotification({
          petitionFieldCommentIds,
          isRead: true,
        });
      }
    },
    1000,
    [field.id, comments.length]
  );

  const createPetitionFieldComment = useCreatePetitionFieldComment();

  async function handleSubmitClick(content: any, isNote: boolean) {
    if (isTemplate) return;
    try {
      await createPetitionFieldComment({
        petitionId,
        petitionFieldId: field.id,
        content,
        isInternal: isNote,
      });
    } catch {}
    closeRef.current!.focus();
  }

  const updatePetitionFieldComment = useUpdatePetitionFieldComment();
  async function handleEditCommentContent(commentId: string, content: any) {
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

  const searchUsers = useSearchUsers();
  const myId = useGetMyId();
  const handleSearcMentionables = useCallback(
    async (search: string) => {
      return await searchUsers(search, { includeGroups: true, excludeUsers: [myId] });
    },
    [searchUsers]
  );

  return (
    <BaseDialog closeOnOverlayClick={false} {...props}>
      <ModalContent
        className="with-organization-brand-theme"
        maxHeight="calc(100vh - 7.5rem)"
        minHeight="calc(60vh - 7.5rem)"
        overflow="hidden"
      >
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
              {hasCommentsEnabled && !onlyReadPermission ? (
                <>
                  <CommentIcon color="gray.300" boxSize="64px" />
                </>
              ) : (
                <Stack alignItems="center" textAlign="center">
                  <NoteIcon boxSize="64px" color="gray.200" />
                  {onlyReadPermission ? null : (
                    <>
                      <Text color="gray.400">
                        <FormattedMessage
                          id="petition-replies.field-comments.only-notes"
                          defaultMessage="This field only accepts notes"
                        />
                      </Text>
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
                    </>
                  )}
                </Stack>
              )}
            </Flex>
          ) : (
            <>
              <Stack
                spacing={0}
                divider={<Divider />}
                overflow="auto"
                maxHeight="calc(100vh - 20rem)"
              >
                {comments.map((comment) => (
                  <PetitionFieldComment
                    key={comment.id}
                    comment={comment}
                    onEdit={(content) => handleEditCommentContent(comment.id, content)}
                    onDelete={() => handleDeleteClick(comment.id)}
                    onMarkAsUnread={() => handleMarkAsUnread(comment.id)}
                    onSearchMentionables={handleSearcMentionables}
                  />
                ))}
              </Stack>
              <Divider />
            </>
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
        <ModalFooter paddingX={0} paddingTop={2} paddingBottom={0}>
          <PetitionCommentsAndNotesEditor
            id={field.id}
            isDisabled={isDisabled}
            isTemplate={isTemplate ?? false}
            onSearchMentionables={handleSearcMentionables}
            hasCommentsEnabled={hasCommentsEnabled && !onlyReadPermission}
            onSubmit={handleSubmitClick}
          />
        </ModalFooter>
      </ModalContent>
    </BaseDialog>
  );
}

export function usePreviewPetitionFieldCommentsDialog() {
  return useDialog(PreviewPetitionFieldCommentsDialog);
}

PreviewPetitionFieldCommentsDialog.fragments = {
  PetitionField: gql`
    fragment PreviewPetitionFieldCommentsDialog_PetitionField on PetitionField {
      id
      title
      isInternal
      commentCount
      unreadCommentCount
      comments {
        ...PetitionFieldComment_PetitionFieldComment
      }
      hasCommentsEnabled
    }
    ${PetitionFieldComment.fragments.PetitionFieldComment}
  `,
};

const _queries = [
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
