import { Center, Flex, FormControl, HStack, List, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { FormatFormErrorMessage, ShortTextInput } from "@parallel/components/common/ShortTextInput";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { isMetaReturn } from "@parallel/utils/keys";
import { waitFor } from "@parallel/utils/promises/waitFor";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { useShortTextFormats } from "@parallel/utils/useShortTextFormats";
import { isValidEmail } from "@parallel/utils/validation";
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
import { isNonNullish, pick } from "remeda";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
  RecipientViewPetitionFieldLayout_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";
import { Text } from "@parallel/components/ui";

export interface RecipientViewPetitionFieldShortTextProps
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
  hasAlreadyRepliedError?: boolean;
}

export function RecipientViewPetitionFieldShortText({
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
}: RecipientViewPetitionFieldShortTextProps) {
  const intl = useIntl();

  const filteredReplies = parentReplyId
    ? field.replies.filter((r) => r.parent?.id === parentReplyId)
    : field.replies;

  const [showNewReply, setShowNewReply] = useState(filteredReplies.length === 0);
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isDeletingReplyRef = useRef<Record<string, boolean>>({});
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const [isInvalidReply, setIsInvalidReply] = useState<Record<string, boolean>>({});
  const [hasAlreadyRepliedError, setHasAlreadyRepliedError] = useState(false);
  const newReplyRef = useRef<HTMLInputElement>(null);
  const replyRefs = useMultipleRefs<HTMLInputElement>();

  const options = field.options as FieldOptions["SHORT_TEXT"];

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

  const replyProps = useMemoFactory(
    (replyId: string) => ({
      onUpdate: async (value: string) => {
        try {
          await onUpdateReply(replyId, { value });
        } catch (e) {
          if (isApolloError(e, "INVALID_REPLY_ERROR")) {
            handleInvalidReply(field.id, true);
          }
          onError(e);
        }
      },
      onDelete: async (focusPrev?: boolean) => {
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
            if (element.type === "text") {
              // setSelectionRange does not work on inputs that are not type="text" (e.g. email)
              element!.selectionStart = element!.value.length;
            }
            element!.focus();
          }
        }
        await onDeleteReply(replyId);

        delete isDeletingReplyRef.current[replyId];
        setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
        handleInvalidReply(replyId, false);
        if (filteredReplies.length === 1) {
          handleAddNewReply();
        }
      },
      onInvalid: (isInvalid: boolean) => {
        if (isInvalid) {
          setIsInvalidReply((curr) => ({ ...curr, [replyId]: true }));
        } else {
          setIsInvalidReply(({ [replyId]: _, ...curr }) => curr);
        }
      },
    }),
    [onUpdateReply, filteredReplies, onDeleteReply],
  );

  const handleCreate = useDebouncedCallback(
    async (value: string, focusCreatedReply: boolean) => {
      if (!value) {
        return false;
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
            await waitFor(1);
            const newReplyElement = replyRefs[replyId].current!;
            if (newReplyElement && options.format !== "EMAIL") {
              newReplyElement.selectionStart =
                selection?.selectionStart ?? newReplyElement.value.length;
              newReplyElement.selectionEnd =
                selection?.selectionEnd ?? newReplyElement.value.length;

              newReplyElement.setSelectionRange(
                selection?.selectionStart ?? newReplyElement.value.length,
                selection?.selectionEnd ?? newReplyElement.value.length,
              );
            }
            newReplyElement?.focus();
          }
        }
      } catch (e) {
        if (isApolloError(e, "INVALID_REPLY_ERROR")) {
          handleInvalidReply(field.id, true);
        } else if (isApolloError(e, "FIELD_ALREADY_REPLIED_ERROR")) {
          setHasAlreadyRepliedError(true);
        }
        onError(e);
        return false;
      } finally {
        setIsSaving(false);
      }
      return true;
    },
    2000,
    [onCreateReply],
  );

  const handleInvalidReply = (replyId: string, isInvalid: boolean) => {
    if (isInvalid) {
      setIsInvalidReply((curr) => ({ ...curr, [replyId]: true }));
    } else {
      setIsInvalidReply(({ [replyId]: _, ...curr }) => curr);
    }
  };

  const formats = useShortTextFormats();
  const format = isNonNullish(options.format)
    ? formats.find((f) => f.value === options.format)
    : null;

  const inputProps = {
    id: `reply-${field.id}-${parentReplyId ? `${parentReplyId}-new` : "new"}`,
    ref: newReplyRef,
    paddingEnd: 10,
    isDisabled: isDisabled,
    isInvalid: isInvalidReply[field.id] || isInvalid || hasAlreadyRepliedError,
    maxLength: field.options.maxLength ?? undefined,
    value,
    onKeyDown: async (event: KeyboardEvent) => {
      if (options.format === "EMAIL" && !isValidEmail(value)) {
        return;
      }
      if (isMetaReturn(event) && field.multiple) {
        await handleCreate.immediate(value, false);
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
      if (!value) {
        handleInvalidReply(field.id, false);
      } else if (format?.validate && !format.validate(value)) {
        handleInvalidReply(field.id, true);
      } else {
        if (await handleCreate.immediateIfPending(value, false)) {
          setShowNewReply(false);
        }
      }

      if (!value && filteredReplies.length > 0) {
        setShowNewReply(false);
      }
    },
    onChange: (value: string) => {
      if (isInvalidReply[field.id] && format?.validate && format.validate(value)) {
        handleInvalidReply(field.id, false);
      }

      if (value.length > 0 && (format?.validate ? format.validate(value) : true)) {
        handleCreate(value, true);
      } else {
        handleCreate.clear();
      }
      setValue(value);
    },
    placeholder:
      options.placeholder ??
      (format
        ? intl.formatMessage(
            {
              id: "generic.for-example",
              defaultMessage: "E.g. {example}",
            },
            { example: format.example },
          )
        : intl.formatMessage({
            id: "component.recipient-view-petition-field-reply.text-placeholder",
            defaultMessage: "Enter your answer",
          })),
  };

  const isInvalidValue = value.length === 0 || (format?.validate ? !format.validate(value) : false);

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={!isDisabled && field.multiple}
      addNewReplyIsDisabled={showNewReply && isInvalidValue}
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
                <RecipientViewPetitionFieldReplyShortText
                  ref={replyRefs[reply.id]}
                  field={field}
                  reply={reply}
                  isDisabled={isDisabled || isDeletingReply[reply.id] || reply.isAnonymized}
                  onAddNewReply={handleAddNewReply}
                  isInvalid={isInvalidReply[reply.id]}
                  {...replyProps(reply.id)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      <FormControl isInvalid={isInvalidReply[field.id] || hasAlreadyRepliedError}>
        {(field.multiple && showNewReply) || filteredReplies.length === 0 ? (
          <Flex flex="1" position="relative" marginTop={2}>
            <ShortTextInput
              data-testid="recipient-view-field-short-text-new-reply-input"
              {...inputProps}
              format={format}
            />

            <Center boxSize={10} position="absolute" insetEnd={0} bottom={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
            </Center>
          </Flex>
        ) : null}
        {isNonNullish(format) ? <FormatFormErrorMessage format={format} /> : null}
      </FormControl>
    </RecipientViewPetitionFieldLayout>
  );
}

interface RecipientViewPetitionFieldReplyShortTextProps {
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled: boolean;
  isInvalid: boolean;
  onUpdate: (content: string) => Promise<void>;
  onDelete: (focusPrev?: boolean) => void;
  onAddNewReply: () => void;
  onInvalid: (invalid: boolean) => void;
}

export const RecipientViewPetitionFieldReplyShortText = forwardRef<
  HTMLInputElement,
  RecipientViewPetitionFieldReplyShortTextProps
>(function RecipientViewPetitionFieldReplyShortText(
  { field, reply, isDisabled, isInvalid, onInvalid, onUpdate, onDelete, onAddNewReply },
  ref,
) {
  const intl = useIntl();
  const [value, setValue] = useState(reply.content.value ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const options = field.options as FieldOptions["SHORT_TEXT"];

  const debouncedUpdateReply = useDebouncedCallback(
    async (value: string) => {
      setIsSaving(true);
      try {
        await onUpdate(value.trim());
      } catch (e) {
        if (isApolloError(e, "INVALID_REPLY_ERROR")) {
          onInvalid(true);
        }
      }
      setIsSaving(false);
    },
    1000,
    [onUpdate],
  );

  const formats = useShortTextFormats();
  const format = isNonNullish(options.format)
    ? formats.find((f) => f.value === options.format)
    : null;
  const props: ComponentProps<typeof ShortTextInput> = {
    id: `reply-${field.id}${reply.parent ? `-${reply.parent.id}` : ""}-${reply.id}`,
    ref,
    paddingEnd: 10,
    value,
    maxLength: field.options.maxLength ?? undefined,
    isDisabled: isDisabled || reply.status === "APPROVED",
    onKeyDown: async (e) => {
      if (isMetaReturn(e) && field.multiple) {
        onAddNewReply();
      } else if (e.key === "Backspace" && value === "") {
        e.preventDefault();
        debouncedUpdateReply.clear();
        onDelete(true);
      }
    },
    onBlur: async () => {
      if (value && value !== reply.content.value) {
        if (format?.validate && !format.validate(value)) {
          onInvalid(true);
          return;
        }
        if (isInvalid) {
          onInvalid(false);
        }
        await debouncedUpdateReply.immediate(value);
      } else if (!value) {
        debouncedUpdateReply.clear();
        onDelete();
      }
    },
    onChange: (value: string) => {
      if (isInvalid && format?.validate && format.validate(value)) {
        onInvalid(false);
      }
      setValue(value);
    },
    placeholder: reply.isAnonymized
      ? intl.formatMessage({
          id: "generic.reply-not-available",
          defaultMessage: "Reply not available",
        })
      : (options.placeholder ??
        (format
          ? intl.formatMessage(
              {
                id: "generic.for-example",
                defaultMessage: "E.g. {example}",
              },
              { example: format.example },
            )
          : intl.formatMessage({
              id: "component.recipient-view-petition-field-reply.text-placeholder",
              defaultMessage: "Enter your answer",
            }))),
    sx: { _placeholderShown: { fontStyle: reply.isAnonymized ? "italic" : "normal" } },
  };

  return (
    <FormControl isInvalid={reply.status === "REJECTED" || isInvalid}>
      <HStack>
        <Flex flex="1" position="relative">
          <ShortTextInput
            data-testid="recipient-view-field-short-text-reply-input"
            {...props}
            format={format}
          />

          <Center boxSize={10} position="absolute" insetEnd={0} bottom={0}>
            <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} reply={reply} />
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
      </HStack>
      {isInvalid && isNonNullish(format) ? <FormatFormErrorMessage format={format} /> : null}
    </FormControl>
  );
});
