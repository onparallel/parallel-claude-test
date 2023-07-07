import { Box, Button, Center, Flex, HStack, List, Stack, Text } from "@chakra-ui/react";
import { DeleteIcon, FieldDateIcon } from "@parallel/chakra/icons";
import { DateInput } from "@parallel/components/common/DateInput";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { TimezoneSelect } from "@parallel/components/common/TimezoneSelect";
import { prettifyTimezone } from "@parallel/utils/dates";
import { isMetaReturn } from "@parallel/utils/keys";
import { waitFor } from "@parallel/utils/promises/waitFor";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { isValidDateString } from "@parallel/utils/validation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChangeEvent,
  forwardRef,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
  RecipientViewPetitionFieldCard_PetitionFieldReplySelection,
  RecipientViewPetitionFieldCard_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";
import { useMetadata } from "@parallel/utils/withMetadata";

type FieldDateTimeReply = {
  datetime: string;
  timezone: string;
};

export interface RecipientViewPetitionFieldDateTimeProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onUpdateReply: (replyId: string, value: FieldDateTimeReply) => void;
  onCreateReply: (value: FieldDateTimeReply) => Promise<string | undefined>;
}

export function RecipientViewPetitionFieldDateTime({
  field,
  isDisabled,
  isInvalid,
  onDownloadAttachment,
  onDeleteReply,
  onUpdateReply,
  onCreateReply,
  onCommentsButtonClick,
}: RecipientViewPetitionFieldDateTimeProps) {
  const [showNewReply, setShowNewReply] = useState(field.replies.length === 0);
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isDeletingReplyRef = useRef<Record<string, boolean>>({});
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});

  const newReplyRef = useRef<HTMLInputElement>(null);
  const replyRefs = useMultipleRefs<HTMLInputElement>();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { browserName } = useMetadata();

  useEffect(() => {
    if (field.multiple && field.replies.length > 0 && showNewReply) {
      setShowNewReply(false);
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

  const handleUpdate = useMemoFactory(
    (replyId: string) => async (value: FieldDateTimeReply) => {
      await onUpdateReply(replyId, value);
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
        const index = field.replies.findIndex((r) => r.id === replyId);
        if (index > 0) {
          const prevId = field.replies[index - 1].id;
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
    [field.replies, onDeleteReply],
  );

  const handleCreate = useDebouncedCallback(
    async (value: string, focusCreatedReply: boolean) => {
      if (!value) {
        return;
      }
      setIsSaving(true);
      try {
        const replyId = await onCreateReply({
          datetime: value,
          timezone,
        });
        if (replyId) {
          setValue("");
          if (focusCreatedReply) {
            setShowNewReply(false);
            await waitFor(1);
            const newReplyElement = replyRefs[replyId].current!;
            if (newReplyElement) {
              newReplyElement.focus();
            }
          }
        }
      } catch {}
      setIsSaving(false);
    },
    1000,
    [onCreateReply],
  );

  const inputProps = {
    id: `reply-${field.id}-new`,
    ref: newReplyRef as any,
    paddingRight: 3,
    isDisabled,
    value,
    // This removes the reset button on Firefox
    required: true,
    onKeyDown: async (event: KeyboardEvent) => {
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
      if (value) {
        await handleCreate.immediate(value, false);
        setShowNewReply(false);
      } else if (!value && field.replies.length > 0) {
        setShowNewReply(false);
      }
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      if (isSaving) {
        // prevent creating 2 replies
        return;
      }
      setValue(event.target.value);
    },
  };
  return (
    <RecipientViewPetitionFieldCard
      field={field}
      isInvalid={isInvalid}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={!isDisabled && field.multiple}
      addNewReplyIsDisabled={showNewReply && !isValidDateString(value)}
      onAddNewReply={handleAddNewReply}
      onDownloadAttachment={onDownloadAttachment}
      onMouseDownNewReply={handleMouseDownNewReply}
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
                <RecipientViewPetitionFieldReplyDate
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
        <Stack>
          <Flex flex="1" position="relative" marginTop={2}>
            <DateInput {...inputProps} type="datetime-local" />
            {browserName !== "Firefox" ? (
              <Center boxSize={10} position="absolute" right={0} bottom={0} pointerEvents="none">
                <FieldDateIcon fontSize="18px" color={isDisabled ? "gray.400" : undefined} />
              </Center>
            ) : null}

            <Center boxSize={10} position="absolute" right={8} bottom={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
            </Center>
          </Flex>
        </Stack>
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
}

interface RecipientViewPetitionFieldReplyDateProps {
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldCard_PetitionFieldReplySelection;
  isDisabled: boolean;
  onUpdate: (content: FieldDateTimeReply) => Promise<void>;
  onDelete: (focusPrev?: boolean) => void;
  onAddNewReply: () => void;
}

export const RecipientViewPetitionFieldReplyDate = forwardRef<
  HTMLInputElement,
  RecipientViewPetitionFieldReplyDateProps
>(function RecipientViewPetitionFieldReplyDate(
  { field, reply, isDisabled, onUpdate, onDelete, onAddNewReply },
  ref,
) {
  const intl = useIntl();
  const [value, setValue] = useState(reply.content.datetime ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [timezone, setTimezone] = useState(reply.content.timezone);
  const [showTimezone, setShowTimezone] = useState(false);

  const { browserName } = useMetadata();

  const debouncedUpdateReply = useDebouncedCallback(
    async (value: string, timezone: string) => {
      setIsSaving(true);
      try {
        await onUpdate({
          datetime: value,
          timezone,
        });
      } catch {}
      setIsSaving(false);
    },
    1000,
    [onUpdate],
  );

  const props = {
    type: reply.isAnonymized ? "text" : "datetime-local",
    id: `reply-${field.id}-${reply.id}`,
    ref: ref as any,
    paddingRight: 3,
    value,
    // This removes the reset button on Firefox
    required: true,
    sx: {
      _placeholderShown: { fontStyle: reply.isAnonymized ? "italic" : "normal" },
    },
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
      if (value && value !== reply.content.datetime) {
        await debouncedUpdateReply.immediate(value, timezone);
      } else if (!value) {
        debouncedUpdateReply.clear();
        onDelete();
      }
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    },
    placeholder: reply.isAnonymized
      ? intl.formatMessage({
          id: "generic.reply-not-available",
          defaultMessage: "Reply not available",
        })
      : undefined,
  };

  const handleRestoreTimezoneDefaults = async () => {
    setIsSaving(true);
    setTimezone(userTimezone);
    setShowTimezone(false);
    try {
      await onUpdate({
        datetime: value,
        timezone: userTimezone,
      });
    } catch {}
    setIsSaving(false);
  };

  const handleChangeTimezone = async (timezone: string) => {
    setIsSaving(true);
    setTimezone(timezone);
    try {
      await onUpdate({
        datetime: value,
        timezone,
      });
    } catch {}
    setIsSaving(false);
  };

  return (
    <Stack>
      <Stack direction={showTimezone ? { base: "column", lg: "row" } : "row"}>
        <Flex flex="1" position="relative">
          <DateInput {...props} />
          {browserName !== "Firefox" || reply.status === "APPROVED" ? (
            <Center boxSize={10} position="absolute" right={0} bottom={0} pointerEvents="none">
              <FieldDateIcon
                fontSize="18px"
                color={isDisabled || reply.status === "APPROVED" ? "gray.400" : undefined}
              />
            </Center>
          ) : null}

          <Center boxSize={10} position="absolute" right={8} bottom={0}>
            <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} reply={reply} />
          </Center>
        </Flex>
        <HStack flex={showTimezone ? "1" : undefined}>
          {showTimezone ? (
            <Box minW="180px" w="100%">
              <TimezoneSelect onChange={(zone) => handleChangeTimezone(zone!)} value={timezone} />
            </Box>
          ) : null}
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
      </Stack>
      <HStack>
        {showTimezone ? (
          <Text color="gray.600" fontSize="sm" as="span">
            <FormattedMessage
              id="component.recipient-view-petition-field-date-time.select-timezone"
              defaultMessage="Select the time zone you need."
            />
            <Button
              variant="link"
              fontWeight={600}
              size="sm"
              onClick={handleRestoreTimezoneDefaults}
              marginLeft={2}
              isDisabled={isDisabled || reply.status === "APPROVED"}
            >
              <FormattedMessage
                id="component.recipient-view-petition-field-date-time.restore-defaults"
                defaultMessage="Restore default"
              />
            </Button>
          </Text>
        ) : (
          <Text color="gray.600" fontSize="sm" as="span">
            <FormattedMessage
              id="component.recipient-view-petition-field-date-time.using-timezone"
              defaultMessage="You are using the time zone {timezone}."
              values={{ timezone: prettifyTimezone(timezone) }}
            />
            <Button
              variant="link"
              fontWeight={600}
              size="sm"
              onClick={() => setShowTimezone(true)}
              marginLeft={1.5}
              isDisabled={isDisabled || reply.status === "APPROVED"}
            >
              <FormattedMessage
                id="component.recipient-view-petition-field-date-time.change-zone"
                defaultMessage="Change"
              />
            </Button>
          </Text>
        )}
      </HStack>
    </Stack>
  );
});
