import { Center, Flex, List, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { PhoneInputLazy } from "@parallel/components/common/PhoneInputLazy";
import { isMetaReturn } from "@parallel/utils/keys";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import { ComponentProps, forwardRef, KeyboardEvent, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { isDefined, pick } from "remeda";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
  RecipientViewPetitionFieldCard_PetitionFieldReplySelection,
  RecipientViewPetitionFieldCard_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

export interface RecipientViewPetitionFieldPhoneProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onUpdateReply: (replyId: string, value: string) => void;
  onCreateReply: (value: string) => Promise<string | undefined>;
}

export function RecipientViewPetitionFieldPhone({
  field,
  isDisabled,
  isInvalid,
  onDownloadAttachment,
  onDeleteReply,
  onUpdateReply,
  onCreateReply,
  onCommentsButtonClick,
}: RecipientViewPetitionFieldPhoneProps) {
  const options = field.options as FieldOptions["PHONE"];
  const [showNewReply, setShowNewReply] = useState(field.replies.length === 0);
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isDeletingReplyRef = useRef<Record<string, boolean>>({});
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const [isInvalidValue, setIsInvalidValue] = useState(false);

  const newReplyRef = useRef<HTMLInputElement>(null);
  const replyRefs = useMultipleRefs<HTMLInputElement>();

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
        } else {
          setValue("");
        }
      }
      await onDeleteReply(replyId);

      delete isDeletingReplyRef.current[replyId];
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
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
              if (newReplyElement) {
                Object.assign(newReplyElement, selection);
                newReplyElement.focus();
                newReplyElement.setSelectionRange(
                  newReplyElement.value.length,
                  newReplyElement.value.length
                );
              }
            });
          }
        }
      } catch {}
      setIsSaving(false);
    },
    1000,
    [onCreateReply]
  );

  const props: ComponentProps<typeof PhoneInputLazy> = {
    id: `reply-${field.id}-new`,
    inputRef: newReplyRef,
    paddingRight: 10,
    isDisabled: isDisabled,
    isInvalid: isInvalidValue,
    onKeyDown: async (event: KeyboardEvent) => {
      if (isMetaReturn(event) && field.multiple) {
        await handleCreate.immediate(value, false);
      } else if (event.key === "Backspace" && (!isDefined(value) || value === "")) {
        if (field.replies.length > 0) {
          event.preventDefault();
          setShowNewReply(false);
          const lastReplyId = field.replies[field.replies.length - 1].id;
          replyRefs[lastReplyId].current!.focus();
        }
      }
    },
    placeholder: options.placeholder ?? undefined,
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
      {(field.multiple && showNewReply) || field.replies.length === 0 ? (
        <Flex flex="1" position="relative" marginTop={2}>
          <PhoneInputLazy
            value={value}
            onChange={(value: string, { isValid }) => {
              if (isSaving) {
                // prevent creating 2 replies
                return;
              }
              setIsInvalidValue(!isValid && isDefined(value));
              setValue(value);
            }}
            onBlur={async (value: string, { isValid }) => {
              if (value && isValid) {
                await handleCreate.immediate(value, false);
                setShowNewReply(false);
              } else if (!value && field.replies.length > 0) {
                setShowNewReply(false);
              }
            }}
            {...props}
          />
          <Center boxSize={10} position="absolute" right={0} bottom={0}>
            <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
          </Center>
        </Flex>
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
}

interface RecipientViewPetitionFieldReplyPhoneProps {
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldCard_PetitionFieldReplySelection;
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
  ref
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
    [onUpdate]
  );

  const props: ComponentProps<typeof PhoneInputLazy> = {
    id: `reply-${field.id}-${reply.id}`,
    inputRef: ref,
    paddingRight: 10,
    isDisabled: isDisabled || reply.status === "APPROVED",
    isInvalid: isInvalidValue || reply.status === "REJECTED",
    onKeyDown: async (event: KeyboardEvent) => {
      if (isMetaReturn(event) && field.multiple) {
        onAddNewReply();
      } else if (event.key === "Backspace" && !isDefined(value)) {
        event.preventDefault();
        debouncedUpdateReply.clear();
        onDelete(true);
      }
    },
    placeholder: reply.isAnonymized
      ? intl.formatMessage({
          id: "component.recipient-view-petition-field-reply.not-available",
          defaultMessage: "Reply not available",
        })
      : options.placeholder ?? undefined,
    sx: { _placeholderShown: { fontStyle: reply.isAnonymized ? "italic" : "normal" } },
  };

  return (
    <Stack direction="row">
      <Flex flex="1" position="relative">
        <PhoneInputLazy
          value={value}
          onChange={(value: string, { isValid }) => {
            setIsInvalidValue(!isValid && isDefined(value));
            setValue(value);
          }}
          onBlur={async (value: string, { isValid }) => {
            if (isValid && isDefined(value) && value !== reply.content.value) {
              await debouncedUpdateReply.immediate(value);
            } else if (!isDefined(value)) {
              debouncedUpdateReply.clear();
              onDelete();
            }
          }}
          {...props}
        />
        <Center boxSize={10} position="absolute" right={0} bottom={0}>
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
