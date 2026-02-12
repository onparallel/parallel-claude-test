import { Box, Center, FormControl, List, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
} from "@parallel/components/common/UserSelect";
import { Text } from "@parallel/components/ui";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { waitFor } from "@parallel/utils/promises/waitFor";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { AnimatePresence, motion } from "framer-motion";
import { RefAttributes, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
  RecipientViewPetitionFieldLayout_PetitionFieldSelection,
  RecipientViewPetitionFieldLayoutProps,
} from "../../recipient-view/fields/RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "../../recipient-view/fields/RecipientViewPetitionFieldReplyStatusIndicator";

interface PreviewPetitionFieldUserAssignmentProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onCreateReply: (content: { value: string | null }) => Promise<string | undefined>;
  onUpdateReply: (replyId: string, content: any) => Promise<void>;
  onDeleteReply: (replyId: string) => void;
  onError: (error: any) => void;
  isInvalid?: boolean;
  parentReplyId?: string;
}

export const PreviewPetitionFieldUserAssignment = ({
  field,
  isDisabled,
  onCreateReply,
  onUpdateReply,
  onDeleteReply,
  onCommentsButtonClick,
  onDownloadAttachment,
  onError,
  isInvalid,
  parentReplyId,
}: PreviewPetitionFieldUserAssignmentProps) => {
  const options = field.options as FieldOptions["USER_ASSIGNMENT"];

  const fieldReplies = completedFieldReplies(field);

  const filteredCompletedFieldReplies = parentReplyId
    ? field.replies.filter(
        (r) => r.parent?.id === parentReplyId && fieldReplies.some((fr) => fr.id === r.id),
      )
    : fieldReplies;

  const filteredReplies = parentReplyId
    ? field.replies.filter((r) => r.parent?.id === parentReplyId)
    : field.replies;

  const [showNewReply, setShowNewReply] = useState(filteredReplies.length === 0);
  const [value, setValue] = useState<UserSelectSelection | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAlreadyRepliedError, setHasAlreadyRepliedError] = useState(false);
  const newReplyRef = useRef<any>(null);
  const replyRefs = useMultipleRefs<any>();
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});

  const _handleSearchUsers = useSearchUsers();

  const excludeUserIds = useMemo(() => {
    return filteredReplies.map((r) => r.content?.value?.id).filter((id): id is string => !!id);
  }, [filteredReplies]);

  const handleSearchUsers = useCallback(
    async (search: string) => {
      return await _handleSearchUsers(search, {
        excludeIds: [...excludeUserIds, ...(value?.id ? [value.id] : [])],
        allowedUsersInGroupIds: options.allowedUserGroupId
          ? [options.allowedUserGroupId]
          : undefined,
      });
    },
    [_handleSearchUsers, excludeUserIds, value?.id, options.allowedUserGroupId],
  );

  useEffect(() => {
    if (hasAlreadyRepliedError) {
      setHasAlreadyRepliedError(false);
      setValue(null);
    }
  }, [filteredReplies]);

  useEffect(() => {
    if (field.multiple && filteredReplies.length > 0 && showNewReply) {
      setShowNewReply(false);
    }
  }, [filteredReplies.length]);

  const handleUpdate = useMemoFactory(
    (replyId: string) => async (content: { value: string | null }) => {
      await onUpdateReply(replyId, content);
    },
    [onUpdateReply],
  );

  const handleDelete = useMemoFactory(
    (replyId: string) => async () => {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
      if (filteredReplies.length === 1) {
        setShowNewReply(true);
      }
    },
    [filteredReplies, onDeleteReply],
  );

  function handleAddNewReply() {
    setShowNewReply(true);
    setTimeout(() => newReplyRef.current?.focus());
  }

  const id = `reply-${field.id}-${parentReplyId ? `${parentReplyId}-new` : "new"}`;

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={!isDisabled && field.multiple}
      addNewReplyIsDisabled={showNewReply}
      onAddNewReply={handleAddNewReply}
      onDownloadAttachment={onDownloadAttachment}
    >
      {filteredCompletedFieldReplies.length ? (
        <Text fontSize="sm" color="gray.600">
          <FormattedMessage
            id="component.recipient-view-petition-field-card.replies-submitted"
            defaultMessage="{count, plural, =1 {1 reply submitted} other {# replies submitted}}"
            values={{ count: filteredCompletedFieldReplies.length }}
          />
        </Text>
      ) : hasAlreadyRepliedError ? (
        <Text fontSize="sm" color="red.500">
          <FormattedMessage id="generic.reply-not-submitted" defaultMessage="Reply not sent" />
        </Text>
      ) : null}
      {filteredReplies.length ? (
        <List as={Stack} marginTop={1}>
          <AnimatePresence initial={false}>
            {filteredReplies.map((reply) => (
              <motion.li
                key={reply.id}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <RecipientViewPetitionFieldReplyUserAssignment
                  ref={replyRefs[reply.id]}
                  field={field}
                  reply={reply}
                  isDisabled={isDisabled || isDeletingReply[reply.id] || reply.isAnonymized}
                  onUpdate={handleUpdate(reply.id)}
                  onDelete={handleDelete(reply.id)}
                  options={options}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      {(field.multiple && showNewReply) || filteredReplies.length === 0 ? (
        <FormControl id={id} isDisabled={isDisabled}>
          <Box flex="1" position="relative" marginTop={2} minWidth="0">
            <UserSelect
              ref={newReplyRef as any}
              isDisabled={isDisabled}
              value={value}
              onChange={async (user) => {
                setValue(user);
                setIsSaving(true);
                try {
                  const replyId = await onCreateReply({ value: user?.id ?? null });
                  if (replyId) {
                    setShowNewReply(false);
                    setValue(null);
                    await waitFor(1);
                    replyRefs[replyId].current?.focus();
                  }
                } catch (e) {
                  if (isApolloError(e, "FIELD_ALREADY_REPLIED_ERROR")) {
                    setHasAlreadyRepliedError(true);
                  }
                  onError(e);
                }
                setIsSaving(false);
              }}
              onSearch={handleSearchUsers}
              isInvalid={isInvalid || hasAlreadyRepliedError}
            />

            <Center height="100%" position="absolute" insetEnd="42px" top={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
            </Center>
          </Box>
        </FormControl>
      ) : null}
    </RecipientViewPetitionFieldLayout>
  );
};

interface RecipientViewPetitionFieldReplyUserAssignmentProps {
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled: boolean;
  onUpdate: (content: { value: string | null }) => Promise<void>;
  onDelete: () => void;
  options: FieldOptions["USER_ASSIGNMENT"];
}

function RecipientViewPetitionFieldReplyUserAssignment({
  ref,
  field,
  reply,
  isDisabled,
  onUpdate,
  onDelete,
  options,
}: RecipientViewPetitionFieldReplyUserAssignmentProps & RefAttributes<UserSelectInstance<false>>) {
  const intl = useIntl();
  const [value, setValue] = useState<UserSelectSelection | null>(reply.content.value);
  const [isSaving, setIsSaving] = useState(false);

  const _handleSearchUsers = useSearchUsers();

  const excludeUserIds = useMemo(() => {
    const parentReplyId = reply.parent?.id;
    const siblingReplies = parentReplyId
      ? field.replies.filter(
          (r: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection) =>
            r.parent?.id === parentReplyId && r.id !== reply.id,
        )
      : field.replies.filter(
          (r: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection) =>
            !r.parent && r.id !== reply.id,
        );

    return siblingReplies
      .map(
        (r: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection) => r.content?.value?.id,
      )
      .filter((id): id is string => !!id);
  }, [field.replies, reply.id, reply.parent?.id]);

  const handleSearchUsers = useCallback(
    async (search: string) => {
      return await _handleSearchUsers(search, {
        excludeIds: [...excludeUserIds, ...(value?.id ? [value.id] : [])],
        allowedUsersInGroupIds: options.allowedUserGroupId
          ? [options.allowedUserGroupId]
          : undefined,
      });
    },
    [_handleSearchUsers, excludeUserIds, value?.id, options.allowedUserGroupId],
  );

  const id = `reply-${field.id}${reply.parent ? `-${reply.parent.id}` : ""}-${reply.id}`;

  return (
    <Stack direction="row">
      <FormControl id={id} isDisabled={isDisabled}>
        <Box flex="1" position="relative" minWidth="0">
          <Box position="relative">
            <UserSelect
              ref={ref}
              isDisabled={isDisabled || reply.status === "APPROVED"}
              isInvalid={reply.status === "REJECTED"}
              value={value}
              onChange={async (user) => {
                setValue(user);
                setIsSaving(true);
                try {
                  await onUpdate({ value: user?.id ?? null });
                } catch {}
                setIsSaving(false);
              }}
              onSearch={handleSearchUsers}
              placeholder={
                reply.isAnonymized
                  ? intl.formatMessage({
                      id: "generic.reply-not-available",
                      defaultMessage: "Reply not available",
                    })
                  : undefined
              }
            />

            <Center height="100%" position="absolute" insetEnd="42px" top={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator reply={reply} isSaving={isSaving} />
            </Center>
          </Box>
        </Box>
      </FormControl>
      <IconButtonWithTooltip
        disabled={isDisabled || reply.status === "APPROVED"}
        onClick={() => onDelete()}
        variant="ghost"
        icon={<DeleteIcon />}
        size="md"
        placement="bottom"
        label={intl.formatMessage({
          id: "component.recipient-view-petition-field-reply.remove-reply-label",
          defaultMessage: "Remove reply",
        })}
      />
    </Stack>
  );
}
