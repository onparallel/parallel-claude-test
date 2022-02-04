import { Center, Flex, List, Stack, Text } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { InputCleave } from "@parallel/components/common/InputCleave";
import { PetitionLocale } from "@parallel/graphql/__types";
import { getSeparator } from "@parallel/utils/intl";
import { isMetaReturn } from "@parallel/utils/keys";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChangeEvent,
  FocusEvent,
  forwardRef,
  KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";
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
  onUpdateReply: (replyId: string, value: string) => void;
  onCreateReply: (value: string) => Promise<string | undefined>;
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
  const [value, setValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const isDeletingReplyRef = useRef<Record<string, boolean>>({});
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});

  const newReplyRef = useRef<HTMLInputElement>(null);
  const replyRefs = useMultipleRefs<HTMLInputElement>();
  const options = field.options as FieldOptions["NUMBER"];

  function handleAddNewReply() {
    setShowNewReply(true);
    setTimeout(() => {
      newReplyRef.current?.focus();
    });
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

  const cleaveOptions = useMemo(
    () => ({
      numeral: true,
      numeralDecimalMark: getSeparator(intl.locale as PetitionLocale, "decimal"),
      delimiter: getSeparator(intl.locale as PetitionLocale, "group"),
      numeralPositiveOnly:
        field.options.range?.min !== undefined ? field.options.range?.min >= 0 : false,
    }),
    [intl.locale, field.options.range?.min]
  );

  const inputProps = {
    value,
    id: `reply-${field.id}-new`,
    ref: newReplyRef as any,
    isDisabled: isDisabled,
    isInvalid: false,
    options: cleaveOptions,
    onKeyDown: async (event: KeyboardEvent) => {
      if (isMetaReturn(event) && field.multiple) {
        await handleCreate.immediateIfPending(value, false);
      } else if (event.key === "Backspace" && value === "") {
        if (field.replies.length > 0) {
          event.preventDefault();
          setShowNewReply(false);
          const lastReplyId = field.replies[field.replies.length - 1].id;
          replyRefs[lastReplyId].current!.focus();
        }
      }
    },
    onBlur: async (event: FocusEvent<HTMLInputElement>) => {
      console.log("CREATE - onBlur - event.target.rawValue: ", event.target.rawValue);
      console.log("CREATE - onBlur - event.target.value: ", event.target.value);

      const valueAsNumber = Number(event.target.rawValue);
      const valueAsString = event.target.value;

      if (valueAsString) {
        if (isNaN(valueAsNumber) || !isBetweenLimits(options, valueAsNumber)) {
          // set invalid true
          return;
        }
        await handleCreate.immediateIfPending(valueAsString, false);
        handleCreate.clear();
        setShowNewReply(false);
      } else if (field.replies.length > 0) {
        setShowNewReply(false);
      }
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      console.log("CREATE - onChange - event.target.rawValue: ", event.target.rawValue);
      console.log("CREATE - onChange - event.target.value: ", event.target.value);

      const valueAsNumber = Number(event.target.rawValue);
      const valueAsString = event.target.value;

      if (isNaN(valueAsNumber) || valueAsString.endsWith(".")) {
        setValue(valueAsString);
        return;
      }
      if (isSaving || !isBetweenLimits(options, valueAsNumber)) {
        return;
      } else {
        // set invalid false
      }
      setValue(valueAsString);
      handleCreate(String(valueAsNumber), true);
    },
    placeholder:
      options.placeholder ??
      intl.formatMessage({
        id: "component.recipient-view-petition-field-reply.text-placeholder",
        defaultMessage: "Enter your answer",
      }),
  };

  const hasRange =
    field.options.range.isActive &&
    (field.options.range?.min !== undefined || field.options.range?.max !== undefined);

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
        <Text fontSize="sm" marginRight={2}>
          <FormattedMessage
            id="component.recipient-view-petition-field-number.only-numbers"
            defaultMessage="Only numbers"
          />{" "}
          {hasRange ? (
            <>
              {field.options.range.min !== undefined && field.options.range.max === undefined ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-number.range-min-description"
                  defaultMessage="greater than or euqal to {min}"
                  values={{ min: field.options.range?.min }}
                />
              ) : null}
              {field.options.range.max !== undefined && field.options.range.min === undefined ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-number.range-max-description"
                  defaultMessage="less than or equal to {max}"
                  values={{ max: field.options.range?.max }}
                />
              ) : null}
              {field.options.range.min !== undefined && field.options.range.max !== undefined ? (
                <FormattedMessage
                  id="component.recipient-view-petition-field-number.range-min-max-description"
                  defaultMessage="between {min} and {max}, both included"
                  values={{ min: field.options.range?.min, max: field.options.range?.max }}
                />
              ) : null}
            </>
          ) : null}
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
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      {(field.multiple && showNewReply) || field.replies.length === 0 ? (
        <Flex flex="1" position="relative" marginTop={2}>
          <InputCleave {...inputProps} />
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
  onUpdate: (content: string) => Promise<void>;
  onDelete: (focusPrev?: boolean) => void;
  onAddNewReply: () => void;
}

export const RecipientViewPetitionFieldReplyNumber = forwardRef<
  HTMLInputElement,
  RecipientViewPetitionFieldReplyNumberProps
>(function RecipientViewPetitionFieldReplyNumber(
  { field, reply, isDisabled, onUpdate, onDelete, onAddNewReply },
  ref
) {
  const intl = useIntl();
  const [value, setValue] = useState(
    reply.content.text ? intl.formatNumber(reply.content.text) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const options = field.options as FieldOptions["NUMBER"];

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

  const cleaveOptions = useMemo(
    () => ({
      numeral: true,
      numeralDecimalMark: getSeparator(intl.locale as PetitionLocale, "decimal"),
      delimiter: getSeparator(intl.locale as PetitionLocale, "group"),
      numeralPositiveOnly:
        field.options.range?.min !== undefined ? Math.sign(field.options.range?.min) > -1 : false,
    }),
    [intl.locale, field.options.range?.min]
  );

  const props = {
    value,
    id: `reply-${field.id}-${reply.id}`,
    ref: ref as any,
    isDisabled: isDisabled || reply.status === "APPROVED",
    isInvalid: reply.status === "REJECTED" || isInvalid,
    paddingRight: 10,
    options: cleaveOptions,
    onKeyDown: async (event: KeyboardEvent) => {
      if (isMetaReturn(event) && field.multiple) {
        onAddNewReply();
      } else if (event.key === "Backspace" && value === "") {
        event.preventDefault();
        debouncedUpdateReply.clear();
        onDelete(true);
      }
    },
    onBlur: async (event: FocusEvent<HTMLInputElement>) => {
      console.log("Update - onBlur - event.target.rawValue: ", event.target.rawValue);
      console.log("Update - onBlur - event.target.value: ", event.target.value);

      const valueAsNumber = Number(event.target.rawValue);
      const valueAsString = event.target.value;

      if (valueAsString) {
        if (isNaN(valueAsNumber) || !isBetweenLimits(options, valueAsNumber)) {
          setIsInvalid(true);
          return;
        }
        await debouncedUpdateReply.immediateIfPending(event.target.rawValue);
        debouncedUpdateReply.clear();
      } else {
        debouncedUpdateReply.clear();
        onDelete();
      }
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      console.log("Update - onChange - event.target.rawValue: ", event.target.rawValue);
      console.log("Update - onChange - event.target.value: ", event.target.value);

      const valueAsNumber = Number(event.target.rawValue);
      const valueAsString = event.target.value;

      if (isNaN(valueAsNumber) || valueAsString.endsWith(".")) {
        setValue(valueAsString);
        return;
      }
      if (!isBetweenLimits(options, valueAsNumber)) {
        return;
      } else {
        setIsInvalid(false);
      }
      if (valueAsString !== value) {
        setValue(valueAsString);
        debouncedUpdateReply(String(valueAsNumber));
      }
    },
    placeholder:
      options.placeholder ??
      intl.formatMessage({
        id: "component.recipient-view-petition-field-reply.text-placeholder",
        defaultMessage: "Enter your answer",
      }),
  };

  return (
    <Stack direction="row">
      <Flex flex="1" position="relative">
        <InputCleave {...props} />
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

function isBetweenLimits(options: FieldOptions["NUMBER"], value: number) {
  if (options.range.isActive) {
    const min = options.range?.min ?? -Infinity;
    const max = options.range?.max ?? Infinity;
    if (value >= Number(min) && value <= Number(max)) return true;
    return false;
  }
  return true;
}
