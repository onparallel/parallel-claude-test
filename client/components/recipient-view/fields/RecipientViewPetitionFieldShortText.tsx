import { Center, Flex, FormControl, FormErrorMessage, Input, List, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { MaskedInput } from "@parallel/components/common/MaskedInput";
import { isMetaReturn } from "@parallel/utils/keys";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useFormatPlacehoders } from "@parallel/utils/useFormatPlaceholders";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, forwardRef, KeyboardEvent, useEffect, useRef, useState } from "react";
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

  const formatPlaceholder = useFormatPlacehoders(options.format ?? "");

  function handleAddNewReply() {
    setShowNewReply(true);
    setTimeout(() => newReplyRef.current?.focus());
  }

  const handleUpdate = useMemoFactory(
    (replyId: string) => async (value: string) => {
      await onUpdateReply(replyId, value);
    },
    [onUpdateReply]
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
        const index = field.replies.findIndex((r) => r.id === replyId);
        if (index > 0) {
          const prevId = field.replies[index - 1].id;
          replyRefs[prevId].current!.selectionStart = replyRefs[prevId].current!.value.length;
          replyRefs[prevId].current!.focus();
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
    [field.replies, onDeleteReply]
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

  const handleOnChange = (value: string) => {
    setValue(value);
  };

  const inputProps = {
    id: `reply-${field.id}-new`,
    ref: newReplyRef as any,
    paddingRight: 10,
    isDisabled: isDisabled,
    isInvalid: isInvalidReply[field.id],
    maxLength: field.options.maxLength ?? undefined,
    value,
    onKeyDown: async (event: KeyboardEvent) => {
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
      } else if (options.format === "EMAIL" && !EMAIL_REGEX.test(value)) {
        handleInvalidReply(field.id, true);
      } else {
        await handleCreate.immediate(value, false);
        setShowNewReply(false);
      }

      if (!value && field.replies.length > 0) {
        setShowNewReply(false);
      }
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      if (
        isInvalidReply[field.id] &&
        options.format === "EMAIL" &&
        EMAIL_REGEX.test(event.target.value)
      ) {
        handleInvalidReply(field.id, false);
      }
      handleOnChange(event.target.value);
    },
    placeholder:
      options.placeholder ??
      formatPlaceholder ??
      intl.formatMessage({
        id: "component.recipient-view-petition-field-reply.text-placeholder",
        defaultMessage: "Enter your answer",
      }),
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
      <FormControl isInvalid={Boolean(Object.keys(isInvalidReply).length)}>
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
                    isDisabled={isDisabled || isDeletingReply[reply.id]}
                    onUpdate={handleUpdate(reply.id)}
                    onDelete={handleDelete(reply.id)}
                    onAddNewReply={handleAddNewReply}
                    onInvalid={handleInvalidReply}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </List>
        ) : null}
        {(field.multiple && showNewReply) || field.replies.length === 0 ? (
          <Flex flex="1" position="relative" marginTop={2}>
            {isDefined(options.format) && options.format !== "EMAIL" ? (
              <MaskedInput {...inputProps} onChange={handleOnChange} format={options.format} />
            ) : (
              <Input
                {...inputProps}
                type={options.format === "EMAIL" ? "email" : undefined}
                name={options.format === "EMAIL" ? "email" : undefined}
              />
            )}
            <Center boxSize={10} position="absolute" right={0} bottom={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
            </Center>
          </Flex>
        ) : null}
        <FormErrorMessage>
          <FormattedMessage
            id="generic.forms.invalid-email-error"
            defaultMessage="Please, enter a valid email"
          />
        </FormErrorMessage>
      </FormControl>
    </RecipientViewPetitionFieldCard>
  );
}

interface RecipientViewPetitionFieldReplyShortTextProps {
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldCard_PetitionFieldReplySelection;
  isDisabled: boolean;
  onUpdate: (content: string) => Promise<void>;
  onDelete: (focusPrev?: boolean) => void;
  onAddNewReply: () => void;
  onInvalid: (replyId: string, value: boolean) => void;
}

export const RecipientViewPetitionFieldReplyShortText = forwardRef<
  HTMLInputElement,
  RecipientViewPetitionFieldReplyShortTextProps
>(function RecipientViewPetitionFieldReplyShortText(
  { field, reply, isDisabled, onUpdate, onDelete, onAddNewReply, onInvalid },
  ref
) {
  const intl = useIntl();
  const [value, setValue] = useState(reply.content.value ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    onInvalid(reply.id, isInvalid);
  }, [isInvalid]);

  const options = field.options as FieldOptions["SHORT_TEXT"];

  const formatPlaceholder = useFormatPlacehoders(options.format ?? "");

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

  const handleOnChange = (value: string) => {
    setValue(value);
  };

  const props = {
    id: `reply-${field.id}-${reply.id}`,
    ref: ref as any,
    paddingRight: 10,
    value,
    maxLength: field.options.maxLength ?? undefined,
    isDisabled: isDisabled || reply.status === "APPROVED",
    isInvalid: reply.status === "REJECTED" || isInvalid,
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
      if (value && value !== reply.content.value) {
        if (options.format === "EMAIL" && !EMAIL_REGEX.test(value)) {
          setIsInvalid(true);
          return;
        }
        if (isInvalid) setIsInvalid(false);
        await debouncedUpdateReply.immediate(value);
      } else if (!value) {
        debouncedUpdateReply.clear();
        onDelete();
      }
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      if (isInvalid && options.format === "EMAIL" && EMAIL_REGEX.test(event.target.value)) {
        setIsInvalid(false);
      }
      handleOnChange(event.target.value);
    },
    placeholder:
      options.placeholder ??
      formatPlaceholder ??
      intl.formatMessage({
        id: "component.recipient-view-petition-field-reply.text-placeholder",
        defaultMessage: "Enter your answer",
      }),
  };

  return (
    <Stack direction="row">
      <Flex flex="1" position="relative">
        {isDefined(options.format) && options.format !== "EMAIL" ? (
          <MaskedInput {...props} onChange={handleOnChange} format={options.format} />
        ) : (
          <Input
            {...props}
            type={options.format === "EMAIL" ? "email" : undefined}
            name={options.format === "EMAIL" ? "email" : undefined}
          />
        )}
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
    </Stack>
  );
});
