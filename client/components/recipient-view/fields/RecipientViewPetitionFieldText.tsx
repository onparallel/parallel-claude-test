import { Center, Flex, List, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { Text } from "@parallel/components/ui";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { isMetaReturn } from "@parallel/utils/keys";
import { waitFor } from "@parallel/utils/promises/waitFor";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  RefAttributes,
  useEffect,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, pick } from "remeda";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
  RecipientViewPetitionFieldLayout_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

export interface RecipientViewPetitionFieldTextProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onUpdateReply: (replyId: string, content: { value: string }) => Promise<void>;
  onCreateReply: (content: { value: string }) => Promise<string | undefined>;
  onError: (error: any) => void;
  isInvalid?: boolean;
  parentReplyId?: string;
}

export function RecipientViewPetitionFieldText({
  field,
  isDisabled,
  onDownloadAttachment,
  onDeleteReply,
  onUpdateReply,
  onCreateReply,
  onCommentsButtonClick,
  onError,
  isInvalid,
  parentReplyId,
}: RecipientViewPetitionFieldTextProps) {
  const intl = useIntl();

  const filteredReplies = parentReplyId
    ? field.replies.filter((r) => r.parent?.id === parentReplyId)
    : field.replies;

  const [showNewReply, setShowNewReply] = useState(filteredReplies.length === 0);
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasAlreadyRepliedError, setHasAlreadyRepliedError] = useState(false);
  const isDeletingReplyRef = useRef<Record<string, boolean>>({});
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const newReplyRef = useRef<HTMLTextAreaElement>(null);
  const replyRefs = useMultipleRefs<HTMLTextAreaElement>();

  const options = field.options as FieldOptions["TEXT"];

  useEffect(() => {
    if (hasAlreadyRepliedError) {
      setHasAlreadyRepliedError(false);
      setValue("");
    }
  }, [filteredReplies]);

  function handleAddNewReply() {
    setShowNewReply(true);
    setTimeout(() => newReplyRef.current?.focus());
  }

  async function handleMouseDownNewReply(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    handleAddNewReply();
    await handleCreate.immediateIfPending(value, false);
  }

  const handleUpdate = useMemoFactory(
    (replyId: string) => async (value: string) => {
      await onUpdateReply(replyId, { value });
    },
    [onUpdateReply],
  );

  const handleDelete = useMemoFactory(
    (replyId: string) => async (focusPrev?: boolean) => {
      if (isDeletingReplyRef.current[replyId]) {
        // avoid double delete when backspace + blur
        return;
      }
      isDeletingReplyRef.current[replyId] = true;
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      if (focusPrev) {
        const index = filteredReplies.findIndex((r) => r.id === replyId);
        if (index > 0) {
          const prevId = filteredReplies[index - 1].id;
          const element = replyRefs[prevId].current!;
          if (isNonNullish(element)) {
            if (element.type === "text") {
              // selectionStart does not work on inputs that are not type="text" (e.g. email)
              element.selectionStart = element.value.length;
            }
            element.focus();
          }
        }
      }
      await onDeleteReply(replyId);

      delete isDeletingReplyRef.current[replyId];
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
      if (filteredReplies.length === 1) {
        handleAddNewReply();
      }
    },
    [filteredReplies, onDeleteReply],
  );

  const handleCreate = useDebouncedCallback(
    async (value: string, focusCreatedReply: boolean) => {
      if (!value) {
        return;
      }
      let selection: { selectionStart: number; selectionEnd: number } | undefined;
      setIsSaving(true);
      try {
        if (isNonNullish(newReplyRef.current)) {
          // save selection to restore it after creating the reply,
          // need to do it before createReply because it will remove the textarea from the DOM
          // and the ref will be null
          selection = pick(newReplyRef.current!, ["selectionStart", "selectionEnd"]);
        }
        const replyId = await onCreateReply({ value });

        if (replyId) {
          setValue("");
          if (focusCreatedReply) {
            setShowNewReply(false);
            await waitFor(1);
            const newReplyElement = replyRefs[replyId].current!;
            if (newReplyElement) {
              newReplyElement.selectionStart =
                selection?.selectionStart ?? newReplyElement.value.length;
              newReplyElement.selectionEnd =
                selection?.selectionEnd ?? newReplyElement.value.length;

              newReplyElement.focus();
              newReplyElement.setSelectionRange(
                selection?.selectionStart ?? newReplyElement.value.length,
                selection?.selectionEnd ?? newReplyElement.value.length,
              );
            }
          }
        }
      } catch (e) {
        onError(e);
        if (isApolloError(e, "FIELD_ALREADY_REPLIED_ERROR")) {
          setHasAlreadyRepliedError(true);
        }
      }
      setIsSaving(false);
    },
    2000,
    [onCreateReply],
  );

  const inputProps = {
    id: `reply-${field.id}-${parentReplyId ? `${parentReplyId}-new` : "new"}`,
    ref: newReplyRef as any,
    paddingEnd: 10,
    isDisabled: isDisabled,
    maxLength: field.options.maxLength ?? undefined,
    value,
    isInvalid: isInvalid || hasAlreadyRepliedError,
    onKeyDown: async (event: KeyboardEvent) => {
      if (isMetaReturn(event) && field.multiple) {
        await handleCreate.immediateIfPending(value, false);
      } else if (event.key === "Backspace" && value === "") {
        if (filteredReplies.length > 0) {
          event.preventDefault();
          setShowNewReply(false);
          const lastReplyId = filteredReplies[filteredReplies.length - 1].id;
          replyRefs[lastReplyId].current!.focus();
        }
      }
    },
    onBlur: async () => {
      if (value) {
        await handleCreate.immediateIfPending(value, false);
        setShowNewReply(false);
      } else if (!value && filteredReplies.length > 0) {
        setShowNewReply(false);
      }
    },
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
      if (isSaving) {
        // prevent creating 2 replies
        return;
      }
      setValue(event.target.value);
      handleCreate(event.target.value, true);
    },
    placeholder:
      options.placeholder ??
      intl.formatMessage({
        id: "component.recipient-view-petition-field-reply.text-placeholder",
        defaultMessage: "Enter your answer",
      }),
  };

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={!isDisabled && field.multiple}
      addNewReplyIsDisabled={showNewReply && value.length === 0}
      onAddNewReply={handleAddNewReply}
      onDownloadAttachment={onDownloadAttachment}
      onMouseDownNewReply={handleMouseDownNewReply}
    >
      {filteredReplies.length ? (
        <Text fontSize="sm" color="gray.600">
          <FormattedMessage
            id="component.recipient-view-petition-field-card.replies-submitted"
            defaultMessage="{count, plural, =1 {1 reply submitted} other {# replies submitted}}"
            values={{ count: filteredReplies.length }}
          />
        </Text>
      ) : hasAlreadyRepliedError ? (
        <Text fontSize="sm" color="red.500">
          <FormattedMessage id="generic.reply-not-submitted" defaultMessage="Reply not sent" />
        </Text>
      ) : null}
      {filteredReplies.length ? (
        <List as={Stack} marginTop={2}>
          <AnimatePresence initial={false}>
            {filteredReplies.map((reply) => (
              <motion.li
                key={reply.id}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <RecipientViewPetitionFieldReplyText
                  ref={replyRefs[reply.id]}
                  field={field}
                  reply={reply}
                  isDisabled={isDisabled || isDeletingReply[reply.id] || reply.isAnonymized}
                  onUpdate={handleUpdate(reply.id)}
                  onDelete={handleDelete(reply.id)}
                  onAddNewReply={handleAddNewReply}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      {(field.multiple && showNewReply) || filteredReplies.length === 0 ? (
        <Flex flex="1" position="relative" marginTop={2}>
          <GrowingTextarea
            data-testid="recipient-view-field-text-new-reply-textarea"
            {...inputProps}
          />

          <Center boxSize={10} position="absolute" insetEnd={0} bottom={0}>
            <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
          </Center>
        </Flex>
      ) : null}
    </RecipientViewPetitionFieldLayout>
  );
}

interface RecipientViewPetitionFieldReplyTextProps {
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled: boolean;
  onUpdate: (content: string) => Promise<void>;
  onDelete: (focusPrev?: boolean) => void;
  onAddNewReply: () => void;
}

export function RecipientViewPetitionFieldReplyText({
  ref,
  field,
  reply,
  isDisabled,
  onUpdate,
  onDelete,
  onAddNewReply,
}: RecipientViewPetitionFieldReplyTextProps & RefAttributes<HTMLTextAreaElement>) {
  const intl = useIntl();
  const [value, setValue] = useState(reply.content.value ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const options = field.options as FieldOptions["TEXT"];

  const debouncedUpdateReply = useDebouncedCallback(
    async (value: string) => {
      setIsSaving(true);
      try {
        await onUpdate(value.trim());
      } catch {}
      setIsSaving(false);
    },
    1000,
    [onUpdate],
  );

  const props = {
    id: `reply-${field.id}${reply.parent ? `-${reply.parent.id}` : ""}-${reply.id}`,
    ref,
    paddingEnd: 10,
    value,
    maxLength: field.options.maxLength ?? undefined,
    isDisabled: isDisabled || reply.status === "APPROVED",
    isInvalid: reply.status === "REJECTED",
    onKeyDown: async (event: KeyboardEvent) => {
      if (isMetaReturn(event) && field.multiple) {
        onAddNewReply();
      } else if (event.key === "Backspace" && value === "") {
        event.preventDefault();
        debouncedUpdateReply.clear();
        onDelete(true);
      }
    },
    onBlur: async () => {
      if (value) {
        await debouncedUpdateReply.immediateIfPending(value);
      } else {
        debouncedUpdateReply.clear();
        onDelete();
      }
    },
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(event.target.value);
      debouncedUpdateReply(event.target.value);
    },
    placeholder: reply.isAnonymized
      ? intl.formatMessage({
          id: "generic.reply-not-available",
          defaultMessage: "Reply not available",
        })
      : (options.placeholder ??
        intl.formatMessage({
          id: "component.recipient-view-petition-field-reply.text-placeholder",
          defaultMessage: "Enter your answer",
        })),
    sx: { _placeholderShown: { fontStyle: reply.isAnonymized ? "italic" : "normal" } },
  };

  return (
    <Stack direction="row">
      <Flex flex="1" position="relative">
        <GrowingTextarea data-testid="recipient-view-field-text-reply-textarea" {...props} />
        <Center boxSize={10} position="absolute" insetEnd={0} bottom={0}>
          <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} reply={reply} />
        </Center>
      </Flex>
      <IconButtonWithTooltip
        disabled={isDisabled || reply.status === "APPROVED"}
        onClick={() => {
          debouncedUpdateReply.clear();
          onDelete();
        }}
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
