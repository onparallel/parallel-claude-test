import {
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormErrorMessageProps,
  HStack,
  Input,
  List,
  Stack,
  Text,
} from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { isMetaReturn } from "@parallel/utils/keys";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { waitFor } from "@parallel/utils/promises/waitFor";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { ShortTextFormat, useShortTextFormats } from "@parallel/utils/useShortTextFormats";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ComponentProps,
  KeyboardEvent,
  MouseEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { IMaskInput } from "react-imask";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, pick } from "remeda";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
  RecipientViewPetitionFieldLayout_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

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

  const [showNewReply, setShowNewReply] = useState(field.replies.length === 0);
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
  }, [field.replies]);

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
        await onUpdateReply(replyId, { value });
      },
      onDelete: async (focusPrev?: boolean) => {
        if (isDeletingReplyRef.current[replyId]) {
          // avoid double delete when backspace + blur
          return;
        }
        isDeletingReplyRef.current[replyId] = true;
        setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
        if (focusPrev) {
          const index = field.replies.findIndex((r) => r.id === replyId);
          if (index > 0) {
            const prevId = field.replies[index - 1].id;
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
        if (field.replies.length === 1) {
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
    [onUpdateReply, field.replies, onDeleteReply],
  );

  const handleCreate = useDebouncedCallback(
    async (value: string, focusCreatedReply: boolean) => {
      if (!value) {
        return false;
      }
      setIsSaving(true);
      try {
        const replyId = await onCreateReply({ value });
        if (replyId) {
          const selection = pick(newReplyRef.current!, ["selectionStart", "selectionEnd"]);
          setValue("");
          if (focusCreatedReply) {
            await waitFor(1);
            const newReplyElement = replyRefs[replyId].current!;
            if (newReplyElement && options.format !== "EMAIL") {
              Object.assign(newReplyElement, selection);
              newReplyElement?.setSelectionRange(
                newReplyElement.value.length,
                newReplyElement.value.length,
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
  const format = isDefined(options.format) ? formats.find((f) => f.value === options.format) : null;

  const inputProps = {
    id: `reply-${field.id}-${parentReplyId ? `${parentReplyId}-new` : "new"}`,
    ref: newReplyRef,
    paddingRight: 10,
    isDisabled: isDisabled,
    isInvalid: isInvalidReply[field.id] || isInvalid || hasAlreadyRepliedError,
    maxLength: field.options.maxLength ?? undefined,
    value,
    onKeyDown: async (event: KeyboardEvent) => {
      if (options.format === "EMAIL" && !EMAIL_REGEX.test(value)) {
        return;
      }
      if (isMetaReturn(event) && field.multiple) {
        await handleCreate.immediate(value, false);
      } else if (event.key === "Backspace" && value === "") {
        if (field.replies.length > 0) {
          event.preventDefault();
          setShowNewReply(false);
          const lastReplyId = field.replies[field.replies.length - 1].id;
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

      if (!value && field.replies.length > 0) {
        setShowNewReply(false);
      }
    },
    onValueChange: (value: string) => {
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
  const fieldReplies = completedFieldReplies(field);

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
      {fieldReplies.length ? (
        <Text fontSize="sm" color="gray.600">
          <FormattedMessage
            id="component.recipient-view-petition-field-card.replies-submitted"
            defaultMessage="{count, plural, =1 {1 reply submitted} other {# replies submitted}}"
            values={{ count: fieldReplies.length }}
          />
        </Text>
      ) : hasAlreadyRepliedError ? (
        <Text fontSize="sm" color="red.500">
          <FormattedMessage id="generic.reply-not-submitted" defaultMessage="Reply not sent" />
        </Text>
      ) : null}
      {field.replies.length ? (
        <List as={Stack} marginTop={2}>
          <AnimatePresence initial={false}>
            {field.replies.map((reply) => (
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
        {(field.multiple && showNewReply) || field.replies.length === 0 ? (
          <Flex flex="1" position="relative" marginTop={2}>
            <ShortTextInput
              data-testid="recipient-view-field-short-text-new-reply-input"
              {...inputProps}
              format={format}
            />
            <Center boxSize={10} position="absolute" right={0} bottom={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
            </Center>
          </Flex>
        ) : null}
        {isDefined(format) ? <FormatFormErrorMessage format={format} /> : null}
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
  const format = isDefined(options.format) ? formats.find((f) => f.value === options.format) : null;
  const props: ComponentProps<typeof ShortTextInput> = {
    id: `reply-${field.id}${reply.parent ? `-${reply.parent.id}` : ""}-${reply.id}`,
    ref,
    paddingRight: 10,
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
    onValueChange: (value) => {
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
      : options.placeholder ??
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
          <Center boxSize={10} position="absolute" right={0} bottom={0}>
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
      {isInvalid && isDefined(format) ? <FormatFormErrorMessage format={format} /> : null}
    </FormControl>
  );
});

interface ShortTextInput {
  onValueChange: (value: string) => void;
  format?: Maybe<ShortTextFormat>;
}

const ShortTextInput = chakraForwardRef<"input", ShortTextInput>(function ShortTextInput(
  { format, onValueChange, ...props },
  ref,
) {
  const inputRef = useRef<any>(null);
  useImperativeHandle(
    ref,
    () => {
      if (format?.type === "MASK") {
        return inputRef.current?.element;
      } else {
        return inputRef.current;
      }
    },
    [format?.type],
  );
  return (
    <Input
      ref={inputRef}
      {...(format?.type === "MASK"
        ? {
            as: IMaskInput,
            ...format.maskProps,
            onAccept: (value: string) => {
              onValueChange(value);
            },
          }
        : {
            onChange: (e) => onValueChange(e.target.value),
          })}
      {...format?.inputProps}
      {...props}
    />
  );
});

const FormatFormErrorMessage = chakraForwardRef<
  "div",
  Omit<FormErrorMessageProps, "children"> & {
    format: ShortTextFormat;
  }
>(function FormatFormErrorMessage({ format, ...props }, ref) {
  return (
    <FormErrorMessage ref={ref} {...props}>
      <FormattedMessage
        id="component.recipient-view-petition-field-short-text.format-error"
        defaultMessage="Please, enter a valid {format}."
        values={{ format: format.label }}
      />
    </FormErrorMessage>
  );
});
