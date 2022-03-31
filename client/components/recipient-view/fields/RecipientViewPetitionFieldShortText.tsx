import {
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormErrorMessageProps,
  HStack,
  Input,
  InputProps,
  List,
  Stack,
} from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { isMetaReturn } from "@parallel/utils/keys";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { ShortTextFormat, useShortTextFormats } from "@parallel/utils/useShortTextFormats";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { AnimatePresence, motion } from "framer-motion";
import { ComponentProps, forwardRef, useImperativeHandle, useRef, useState } from "react";
import { IMaskInput } from "react-imask";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, pick } from "remeda";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
  RecipientViewPetitionFieldCard_PetitionFieldReplySelection,
  RecipientViewPetitionFieldCard_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

export interface RecipientViewPetitionFieldShortTextProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onUpdateReply: (replyId: string, value: string) => void;
  onCreateReply: (value: string) => Promise<string | undefined>;
}

export function RecipientViewPetitionFieldShortText({
  field,
  isDisabled,
  isInvalid,
  onDownloadAttachment,
  onDeleteReply,
  onUpdateReply,
  onCreateReply,
  onCommentsButtonClick,
}: RecipientViewPetitionFieldShortTextProps) {
  const intl = useIntl();

  const [showNewReply, setShowNewReply] = useState(field.replies.length === 0);
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isDeletingReplyRef = useRef<Record<string, boolean>>({});
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const [isInvalidReply, setIsInvalidReply] = useState<Record<string, boolean>>({});

  const newReplyRef = useRef<HTMLInputElement>(null);
  const replyRefs = useMultipleRefs<HTMLInputElement>();

  const options = field.options as FieldOptions["SHORT_TEXT"];

  function handleAddNewReply() {
    setShowNewReply(true);
    setTimeout(() => newReplyRef.current?.focus());
  }

  const replyProps = useMemoFactory(
    (replyId: string) => ({
      onUpdate: async (value: string) => {
        await onUpdateReply(replyId, value);
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
    [onUpdateReply, field.replies, onDeleteReply]
  );

  const handleCreate = useDebouncedCallback(
    async (value: string, focusCreatedReply: boolean) => {
      if (!value) {
        return;
      }
      setIsSaving(true);
      try {
        const replyId = await onCreateReply(value);
        if (replyId) {
          const selection = pick(newReplyRef.current!, ["selectionStart", "selectionEnd"]);
          setValue("");
          if (focusCreatedReply) {
            setShowNewReply(false);
            setTimeout(() => {
              const newReplyElement = replyRefs[replyId].current!;
              if (options.format !== "EMAIL") {
                Object.assign(newReplyElement, selection);
                newReplyElement?.setSelectionRange(
                  newReplyElement.value.length,
                  newReplyElement.value.length
                );
              }
              newReplyElement?.focus();
            });
          }
        }
      } catch {}
      setIsSaving(false);
    },
    1000,
    [onCreateReply]
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
  const inputProps: ComponentProps<typeof ShortTextInput> = {
    id: `reply-${field.id}-new`,
    ref: newReplyRef,
    paddingRight: 10,
    isDisabled: isDisabled,
    isInvalid: isInvalidReply[field.id],
    maxLength: field.options.maxLength ?? undefined,
    value,
    onKeyDown: async (event) => {
      if (options.format === "EMAIL" && !EMAIL_REGEX.test(value)) {
        return;
      }
      if (isMetaReturn(event) && field.multiple) {
        await handleCreate.immediate(value, true);
        handleAddNewReply();
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
        await handleCreate.immediate(value, false);
        setShowNewReply(false);
      }

      if (!value && field.replies.length > 0) {
        setShowNewReply(false);
      }
    },
    onValueChange: (value) => {
      if (isInvalidReply[field.id] && format?.validate && format.validate(value)) {
        handleInvalidReply(field.id, false);
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
            { example: format.example }
          )
        : intl.formatMessage({
            id: "component.recipient-view-petition-field-reply.text-placeholder",
            defaultMessage: "Enter your answer",
          })),
  };

  return (
    <RecipientViewPetitionFieldCard
      field={field}
      isInvalid={isInvalid}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={!isDisabled && field.multiple}
      addNewReplyIsDisabled={showNewReply}
      onAddNewReply={handleAddNewReply}
      onDownloadAttachment={onDownloadAttachment}
    >
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
      <FormControl isInvalid={isInvalidReply[field.id]}>
        {(field.multiple && showNewReply) || field.replies.length === 0 ? (
          <Flex flex="1" position="relative" marginTop={2}>
            <ShortTextInput {...inputProps} format={format} />
            <Center boxSize={10} position="absolute" right={0} bottom={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
            </Center>
          </Flex>
        ) : null}
        {isDefined(format) ? <FormatFormErrorMessage format={format} /> : null}
      </FormControl>
    </RecipientViewPetitionFieldCard>
  );
}

interface RecipientViewPetitionFieldReplyShortTextProps {
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldCard_PetitionFieldReplySelection;
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
  ref
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
      } catch {}
      setIsSaving(false);
    },
    1000,
    [onUpdate]
  );

  const formats = useShortTextFormats();
  const format = isDefined(options.format) ? formats.find((f) => f.value === options.format) : null;

  const props: ComponentProps<typeof ShortTextInput> = {
    id: `reply-${field.id}-${reply.id}`,
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
          id: "component.recipient-view-petition-field-reply.not-available",
          defaultMessage: "Reply not available",
        })
      : options.placeholder ??
        (format
          ? intl.formatMessage(
              {
                id: "generic.for-example",
                defaultMessage: "E.g. {example}",
              },
              { example: format.example }
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
          <ShortTextInput {...props} format={format} />
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

const ShortTextInput = chakraForwardRef<
  "input",
  InputProps & {
    onValueChange: (value: string) => void;
    format?: Maybe<ShortTextFormat>;
  }
>(function ShortTextInput({ format, onValueChange, ...props }, ref) {
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
    [format?.type]
  );
  const [maskProps, setMaskProps] = useState(
    format?.type === "MASK" ? format.maskProps((props.value as string) ?? "") : null
  );
  return (
    <Input
      ref={inputRef}
      {...(format?.type === "MASK"
        ? {
            as: IMaskInput,
            ...maskProps,
            onAccept: (value: string) => {
              if (format?.type === "MASK") {
                setMaskProps(format.maskProps(value));
              }
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
