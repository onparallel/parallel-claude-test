import { Center, Flex, List, Stack, Text } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { PhoneInputLazy } from "@parallel/components/common/PhoneInputLazy";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { isMetaReturn } from "@parallel/utils/keys";
import { waitFor } from "@parallel/utils/promises/waitFor";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import {
  ComponentProps,
  KeyboardEvent,
  MouseEvent,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish, pick } from "remeda";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
  RecipientViewPetitionFieldLayout_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

export interface RecipientViewPetitionFieldPhoneProps
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

export function RecipientViewPetitionFieldPhone({
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
}: RecipientViewPetitionFieldPhoneProps) {
  const filteredReplies = parentReplyId
    ? field.replies.filter((r) => r.parent?.id === parentReplyId)
    : field.replies;

  const options = field.options as FieldOptions["PHONE"];
  const [showNewReply, setShowNewReply] = useState(filteredReplies.length === 0);
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isDeletingReplyRef = useRef<Record<string, boolean>>({});
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const [isInvalidValue, setIsInvalidValue] = useState(false);
  const [hasAlreadyRepliedError, setHasAlreadyRepliedError] = useState(false);

  const newReplyRef = useRef<HTMLInputElement>(null);
  const replyRefs = useMultipleRefs<HTMLInputElement>();

  useEffect(() => {
    if (hasAlreadyRepliedError) {
      setHasAlreadyRepliedError(false);
      setValue("");
    }
  }, [filteredReplies]);

  useEffect(() => {
    if (field.multiple && filteredReplies.length > 0 && showNewReply) {
      setShowNewReply(false);
    }
  }, [filteredReplies.length]);

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
          replyRefs[prevId].current!.selectionStart = replyRefs[prevId].current!.value.length;
          replyRefs[prevId].current!.focus();
        } else {
          setValue("");
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
      setIsSaving(true);
      let selection: { selectionStart: number | null; selectionEnd: number | null } | undefined;
      try {
        if (isNonNullish(newReplyRef.current)) {
          // save selection to restore it after creating the reply,
          // need to do it before createReply because it will remove the input from the DOM
          // and the ref will be null
          selection = pick(newReplyRef.current, ["selectionStart", "selectionEnd"]);
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
        if (isApolloError(e, "FIELD_ALREADY_REPLIED_ERROR")) {
          setHasAlreadyRepliedError(true);
        }
        onError(e);
      }
      setIsSaving(false);
    },
    1000,
    [onCreateReply],
  );

  const props: ComponentProps<typeof PhoneInputLazy> = {
    id: `reply-${field.id}-${parentReplyId ? `${parentReplyId}-new` : "new"}`,
    inputRef: newReplyRef,
    paddingInlineEnd: 10,
    isDisabled: isDisabled,
    isInvalid: isInvalidValue || isInvalid || hasAlreadyRepliedError,
    onKeyDown: async (event: KeyboardEvent) => {
      if (isMetaReturn(event) && field.multiple) {
        await handleCreate.immediate(value, false);
      } else if (event.key === "Backspace" && (isNullish(value) || value === "")) {
        if (filteredReplies.length > 0) {
          event.preventDefault();
          setShowNewReply(false);
          const lastReplyId = filteredReplies[filteredReplies.length - 1].id;
          replyRefs[lastReplyId].current!.focus();
        }
      }
    },
    placeholder: options.placeholder ?? undefined,
  };

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={!isDisabled && field.multiple}
      addNewReplyIsDisabled={
        showNewReply && (value?.length === 0 || (value?.length > 0 && isInvalidValue))
      }
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
                <RecipientViewPetitionFieldReplyPhone
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
          <PhoneInputLazy
            value={value}
            onChange={(value, { isValid }) => {
              if (isSaving) {
                // prevent creating 2 replies
                return;
              }
              if (isNonNullish(value) && isValid) {
                handleCreate(value, true);
              } else {
                handleCreate.clear();
              }
              setIsInvalidValue(!isValid && isNonNullish(value));
              setValue(value ?? "");
            }}
            onBlur={async (value, { isValid }) => {
              if (value && isValid) {
                await handleCreate.immediateIfPending(value, false);
                setShowNewReply(false);
              } else if (!value && filteredReplies.length > 0) {
                setShowNewReply(false);
              }
            }}
            {...props}
          />
          <Center boxSize={10} position="absolute" insetEnd={0} bottom={0}>
            <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
          </Center>
        </Flex>
      ) : null}
    </RecipientViewPetitionFieldLayout>
  );
}

interface RecipientViewPetitionFieldReplyPhoneProps {
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled: boolean;
  onUpdate: (content: string) => Promise<void>;
  onDelete: (focusPrev?: boolean) => void;
  onAddNewReply: () => void;
}

export const RecipientViewPetitionFieldReplyPhone = forwardRef<
  HTMLInputElement,
  RecipientViewPetitionFieldReplyPhoneProps
>(function RecipientViewPetitionFieldReplyPhone(
  { field, reply, isDisabled, onUpdate, onDelete, onAddNewReply },
  ref,
) {
  const intl = useIntl();
  const [value, setValue] = useState(reply.content.value ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const options = field.options as FieldOptions["PHONE"];
  const [isInvalidValue, setIsInvalidValue] = useState(false);

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

  const props: ComponentProps<typeof PhoneInputLazy> = {
    id: `reply-${field.id}${reply.parent ? `-${reply.parent.id}` : ""}-${reply.id}`,
    inputRef: ref,
    paddingEnd: 10,
    isDisabled: isDisabled || reply.status === "APPROVED",
    isInvalid: isInvalidValue || reply.status === "REJECTED",
    onKeyDown: async (event: KeyboardEvent) => {
      if (isMetaReturn(event) && field.multiple) {
        onAddNewReply();
      } else if (event.key === "Backspace" && isNullish(value)) {
        event.preventDefault();
        debouncedUpdateReply.clear();
        onDelete(true);
      }
    },
    placeholder: reply.isAnonymized
      ? intl.formatMessage({
          id: "generic.reply-not-available",
          defaultMessage: "Reply not available",
        })
      : (options.placeholder ?? undefined),
    sx: { _placeholderShown: { fontStyle: reply.isAnonymized ? "italic" : "normal" } },
  };

  return (
    <Stack direction="row">
      <Flex flex="1" position="relative">
        <PhoneInputLazy
          value={value}
          onChange={(value, { isValid }) => {
            setIsInvalidValue(!isValid && isNonNullish(value));
            setValue(value);
          }}
          onBlur={async (value, { isValid }) => {
            if (isValid && isNonNullish(value) && value !== reply.content.value) {
              await debouncedUpdateReply.immediate(value);
            } else if (isNullish(value)) {
              debouncedUpdateReply.clear();
              onDelete();
            }
          }}
          {...props}
        />
        <Center boxSize={10} position="absolute" insetEnd={0} bottom={0}>
          <RecipientViewPetitionFieldReplyStatusIndicator reply={reply} isSaving={isSaving} />
        </Center>
      </Flex>
      <IconButtonWithTooltip
        isDisabled={isDisabled || reply.status === "APPROVED"}
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
});
