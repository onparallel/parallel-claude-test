import { Center, Flex, List, Stack, Text } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { isMetaReturn } from "@parallel/utils/keys";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import { ComponentPropsWithRef, forwardRef, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
  RecipientViewPetitionFieldCard_PetitionFieldReplySelection,
  RecipientViewPetitionFieldCard_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";
export interface RecipientViewPetitionFieldNumberProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onUpdateReply: (replyId: string, value: number) => void;
  onCreateReply: (value: number) => Promise<string | undefined>;
}

export function RecipientViewPetitionFieldNumber({
  field,
  isDisabled,
  isInvalid,
  hasCommentsEnabled,
  onDownloadAttachment,
  onDeleteReply,
  onUpdateReply,
  onCreateReply,
  onCommentsButtonClick,
}: RecipientViewPetitionFieldNumberProps) {
  const intl = useIntl();

  const [showNewReply, setShowNewReply] = useState(field.replies.length === 0);
  const [value, setValue] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const isDeletingReplyRef = useRef<Record<string, boolean>>({});
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const [isInvalidReply, setIsInvalidReply] = useState<Record<string, boolean>>({});

  const newReplyRef = useRef<HTMLInputElement>(null);
  const replyRefs = useMultipleRefs<HTMLInputElement>();

  const { range, placeholder, decimals, prefix, suffix } = field.options as FieldOptions["NUMBER"];

  const hasPrefix = isDefined(prefix) || isDefined(suffix) ? true : false;
  const isTailPrefix = isDefined(suffix);
  const prefixValue = isTailPrefix ? suffix : prefix;

  function handleAddNewReply() {
    setShowNewReply(true);
    setTimeout(() => {
      newReplyRef.current?.focus();
    });
  }

  const handleUpdate = useMemoFactory(
    (replyId: string) => async (value: number) => {
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
      setIsInvalidReply(({ [replyId]: _, ...curr }) => curr);
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
    async (value: number, focusCreatedReply: boolean) => {
      setIsInvalidReply(({ [field.id]: _, ...curr }) => curr);
      setIsSaving(true);
      try {
        const replyId = await onCreateReply(value);
        if (replyId) {
          setValue(undefined);
          if (focusCreatedReply) {
            setShowNewReply(false);
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

  const inputProps = {
    value,
    id: `reply-${field.id}-new`,
    ref: newReplyRef,
    isDisabled: isDisabled,
    isInvalid: isInvalidReply[field.id],
    positiveOnly: isDefined(range.min) && range.min >= 0,
    decimals: decimals ?? 2,
    prefix: hasPrefix ? prefixValue : undefined,
    tailPrefix: hasPrefix ? isTailPrefix : undefined,
    onKeyDown: async (event) => {
      if (
        isMetaReturn(event) &&
        field.multiple &&
        isDefined(value) &&
        isBetweenLimits(range, value)
      ) {
        await handleCreate.immediate(value, true);
        handleAddNewReply();
      } else if (event.key === "Backspace" && value === undefined) {
        if (field.replies.length > 0) {
          event.preventDefault();
          setShowNewReply(false);
          const lastReplyId = field.replies[field.replies.length - 1].id;
          replyRefs[lastReplyId].current!.focus();
        }
      }
    },
    onBlur: async () => {
      if (!isDefined(value)) {
        setIsInvalidReply(({ [field.id]: _, ...curr }) => curr);
      } else if (!isBetweenLimits(range, value)) {
        setIsInvalidReply((curr) => ({ ...curr, [field.id]: true }));
      } else {
        await handleCreate.immediate(value, true);
        handleCreate.clear();
        setShowNewReply(false);
      }
      if (
        (field.replies.length > 0 && !isDefined(value)) ||
        (isDefined(value) && isBetweenLimits(range, value))
      ) {
        setShowNewReply(false);
      }
    },
    onChange: (value) => {
      if (!isDefined(value)) {
        setValue(undefined);
      } else {
        if (!isBetweenLimits(range, value)) {
          setIsInvalidReply((curr) => ({ ...curr, [field.id]: true }));
        } else {
          setIsInvalidReply(({ [field.id]: _, ...curr }) => curr);
        }
        setValue(value);
      }
    },
    placeholder:
      placeholder ?? hasPrefix
        ? prefixValue
        : intl.formatMessage({
            id: "component.recipient-view-petition-field-reply.text-placeholder",
            defaultMessage: "Enter your answer",
          }),
  } as ComponentPropsWithRef<typeof NumeralInput>;

  const hasRange = isDefined(range.min) || isDefined(range.max);

  return (
    <RecipientViewPetitionFieldCard
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={!isDisabled && field.multiple}
      addNewReplyIsDisabled={showNewReply}
      onAddNewReply={handleAddNewReply}
      onDownloadAttachment={onDownloadAttachment}
    >
      <Flex flexWrap="wrap" alignItems="center">
        <Text
          fontSize="sm"
          marginRight={2}
          color={Object.keys(isInvalidReply).length ? "red.500" : "gray.500"}
        >
          {hasRange ? (
            <>
              {isDefined(range.min) && !isDefined(range.max) ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-number.range-min-description"
                  defaultMessage="Numeric {multiple, select, true{answers} other {answer}} greater than or equal to {min, number}"
                  values={{ min: range.min, multiple: field.multiple }}
                />
              ) : null}
              {isDefined(range.max) && !isDefined(range.min) ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-number.range-max-description"
                  defaultMessage="Numeric {multiple, select, true{answers} other {answer}} lower than or equal to {max, number}"
                  values={{ max: range.max, multiple: field.multiple }}
                />
              ) : null}
              {isDefined(range.min) && isDefined(range.max) ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-number.range-min-max-description"
                  defaultMessage="Numeric {multiple, select, true{answers} other {answer}} between {min, number} and {max, number}, both included"
                  values={{ min: range.min, max: range.max, multiple: field.multiple }}
                />
              ) : null}
            </>
          ) : (
            <FormattedMessage
              id="component.recipient-view-petition-field-number.only-numbers"
              defaultMessage="Numeric {multiple, select, true{answers} other {answer}}"
              values={{ multiple: field.multiple }}
            />
          )}
        </Text>
        {field.replies.length ? (
          <Text fontSize="sm" color="gray.500">
            {"("}
            <FormattedMessage
              id="component.recipient-view-petition-field-card.replies-submitted"
              defaultMessage="{count, plural, =1 {1 reply submitted} other {# replies submitted}}"
              values={{ count: field.replies.length }}
            />
            {")"}
          </Text>
        ) : null}
      </Flex>
      {field.replies.length ? (
        <List as={Stack} marginTop={2}>
          <AnimatePresence initial={false}>
            {field.replies.map((reply) => (
              <motion.li
                key={reply.id}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <RecipientViewPetitionFieldReplyNumber
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
          <NumeralInput {...inputProps} />
          <Center boxSize={10} position="absolute" right={0} bottom={0}>
            <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
          </Center>
        </Flex>
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
}

interface RecipientViewPetitionFieldReplyNumberProps {
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldCard_PetitionFieldReplySelection;
  isDisabled: boolean;
  onUpdate: (content: number) => Promise<void>;
  onDelete: (focusPrev?: boolean) => void;
  onAddNewReply: () => void;
  onInvalid: (replyId: string, value: boolean) => void;
}

export const RecipientViewPetitionFieldReplyNumber = forwardRef<
  HTMLInputElement,
  RecipientViewPetitionFieldReplyNumberProps
>(function RecipientViewPetitionFieldReplyNumber(
  { field, reply, isDisabled, onUpdate, onDelete, onAddNewReply, onInvalid },
  ref
) {
  const { range, placeholder, decimals, prefix, suffix } = field.options as FieldOptions["NUMBER"];

  const hasPrefix = isDefined(prefix) || isDefined(suffix) ? true : false;
  const isTailPrefix = isDefined(suffix);
  const prefixValue = isTailPrefix ? suffix : prefix;

  const intl = useIntl();
  const [value, setValue] = useState(reply.content.value as number | undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isInvalid, setIsInvalid] = useState(!isBetweenLimits(range, reply.content.value));

  useEffect(() => {
    onInvalid(reply.id, isInvalid);
  }, [isInvalid]);

  const debouncedUpdateReply = useDebouncedCallback(
    async (value: number) => {
      setIsSaving(true);
      try {
        await onUpdate(value);
      } catch {}
      setIsSaving(false);
    },
    1000,
    [onUpdate]
  );

  const props = {
    value,
    id: `reply-${field.id}-${reply.id}`,
    ref: ref,
    isDisabled: isDisabled || reply.status === "APPROVED",
    isInvalid: reply.status === "REJECTED" || isInvalid,
    paddingRight: 10,
    positiveOnly: isDefined(range.min) && range.min >= 0,
    decimals: decimals ?? 2,
    prefix: hasPrefix ? prefixValue : undefined,
    tailPrefix: hasPrefix ? isTailPrefix : undefined,
    onKeyDown: async (event) => {
      if (isMetaReturn(event) && field.multiple) {
        onAddNewReply();
      } else if (event.key === "Backspace" && value === undefined) {
        event.preventDefault();
        debouncedUpdateReply.clear();
        onDelete(true);
      }
    },
    onBlur: async () => {
      if (isDefined(value) && value !== reply.content.value) {
        if (isBetweenLimits(range, value)) {
          await debouncedUpdateReply.immediate(value);
        } else {
          setIsInvalid(true);
        }
      } else if (!isDefined(value)) {
        debouncedUpdateReply.clear();
        onDelete();
      }
    },
    onChange: (value) => {
      setValue(value);
      if (isDefined(value)) {
        setIsInvalid(!isBetweenLimits(range, value));
      }
    },
    placeholder:
      placeholder ?? hasPrefix
        ? prefixValue
        : intl.formatMessage({
            id: "component.recipient-view-petition-field-reply.text-placeholder",
            defaultMessage: "Enter your answer",
          }),
  } as ComponentPropsWithRef<typeof NumeralInput>;

  return (
    <Stack direction="row">
      <Flex flex="1" position="relative">
        <NumeralInput {...props} />
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

function isBetweenLimits(range: FieldOptions["NUMBER"]["range"], value: number) {
  return value >= (range.min ?? -Infinity) && value <= (range.max ?? Infinity);
}
