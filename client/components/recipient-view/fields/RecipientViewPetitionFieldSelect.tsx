import { Box, Center, FormControl, List, Stack, Text } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SimpleOption, SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { waitFor } from "@parallel/utils/promises/waitFor";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { SelectInstance as _SelectInstance } from "react-select";
import { zip } from "remeda";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
  RecipientViewPetitionFieldLayout_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldLayout";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

export interface RecipientViewPetitionFieldSelectProps
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

type SelectInstance = _SelectInstance<SimpleOption, false>;

export function RecipientViewPetitionFieldSelect({
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
}: RecipientViewPetitionFieldSelectProps) {
  const intl = useIntl();

  const fieldReplies = completedFieldReplies(field);

  const filteredCompletedFieldReplies = parentReplyId
    ? field.replies.filter(
        (r) => r.parent?.id === parentReplyId && fieldReplies.some((fr) => fr.id === r.id),
      )
    : fieldReplies;

  const filteredReplies = parentReplyId
    ? field.replies.filter((r) => r.parent?.id === parentReplyId)
    : field.replies;

  const [showNewReply, setShowNewReply] = useState(filteredReplies.length === 0);
  const [value, setValue] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAlreadyRepliedError, setHasAlreadyRepliedError] = useState(false);
  const newReplyRef = useRef<SelectInstance>(null);
  const replyRefs = useMultipleRefs<SelectInstance>();
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});

  const options = field.options as FieldOptions["SELECT"];
  const values = useMemo(
    () =>
      zip(options.values, options.labels ?? options.values).map(([value, label]) => ({
        value,
        label,
      })),
    [field.options],
  );

  useEffect(() => {
    if (hasAlreadyRepliedError) {
      setHasAlreadyRepliedError(false);
      setValue(null);
    }
  }, [filteredReplies]);

  useEffect(() => {
    if (field.multiple && filteredReplies.length > 0 && showNewReply) {
      setShowNewReply(false);
    }
  }, [filteredReplies.length]);

  const handleUpdate = useMemoFactory(
    (replyId: string) => async (value: string) => {
      await onUpdateReply(replyId, { value });
    },
    [onUpdateReply],
  );

  const handleDelete = useMemoFactory(
    (replyId: string) => async () => {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
      if (filteredReplies.length === 1) {
        setShowNewReply(true);
      }
    },
    [filteredReplies, onDeleteReply],
  );

  function handleAddNewReply() {
    setShowNewReply(true);
    setTimeout(() => newReplyRef.current?.focus());
  }

  const id = `reply-${field.id}-${parentReplyId ? `${parentReplyId}-new` : "new"}`;

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      showAddNewReply={!isDisabled && field.multiple}
      addNewReplyIsDisabled={showNewReply}
      onAddNewReply={handleAddNewReply}
      onDownloadAttachment={onDownloadAttachment}
    >
      {filteredCompletedFieldReplies.length ? (
        <Text fontSize="sm" color="gray.600">
          <FormattedMessage
            id="component.recipient-view-petition-field-card.replies-submitted"
            defaultMessage="{count, plural, =1 {1 reply submitted} other {# replies submitted}}"
            values={{ count: filteredCompletedFieldReplies.length }}
          />
        </Text>
      ) : hasAlreadyRepliedError ? (
        <Text fontSize="sm" color="red.500">
          <FormattedMessage id="generic.reply-not-submitted" defaultMessage="Reply not sent" />
        </Text>
      ) : null}
      {filteredReplies.length ? (
        <List as={Stack} marginTop={1}>
          <AnimatePresence initial={false}>
            {filteredReplies.map((reply) => (
              <motion.li
                key={reply.id}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <RecipientViewPetitionFieldReplySelect
                  ref={replyRefs[reply.id]}
                  field={field}
                  reply={reply}
                  isDisabled={isDisabled || isDeletingReply[reply.id] || reply.isAnonymized}
                  onUpdate={handleUpdate(reply.id)}
                  onDelete={handleDelete(reply.id)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      {(field.multiple && showNewReply) || filteredReplies.length === 0 ? (
        <FormControl id={id} isDisabled={isDisabled}>
          <Box flex="1" position="relative" marginTop={2} minWidth="0">
            <SimpleSelect
              ref={newReplyRef as any}
              data-testid="recipient-view-field-select-new-reply-select"
              isDisabled={isDisabled}
              value={value}
              options={values}
              onChange={async (value) => {
                setValue(value);
                setIsSaving(true);
                try {
                  const replyId = await onCreateReply({ value: value! });
                  if (replyId) {
                    setShowNewReply(false);
                    setValue(null);
                    await waitFor(1);
                    replyRefs[replyId].current?.focus();
                  }
                } catch (e) {
                  if (isApolloError(e, "FIELD_ALREADY_REPLIED_ERROR")) {
                    setHasAlreadyRepliedError(true);
                  }
                  onError(e);
                }
                setIsSaving(false);
              }}
              placeholder={
                options.placeholder ??
                intl.formatMessage({
                  id: "component.recipient-view-petition-field-reply.select-placeholder",
                  defaultMessage: "Select an option",
                })
              }
              styles={{
                menu: (styles) => ({ ...styles, zIndex: 100 }),
                valueContainer: (styles) => ({ ...styles, paddingInlineEnd: 32 }),
              }}
              isInvalid={isInvalid || hasAlreadyRepliedError}
            />
            <Center height="100%" position="absolute" insetEnd="42px" top={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
            </Center>
          </Box>
        </FormControl>
      ) : null}
    </RecipientViewPetitionFieldLayout>
  );
}

interface RecipientViewPetitionFieldReplySelectProps {
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled: boolean;
  onUpdate: (content: string) => Promise<void>;
  onDelete: () => void;
}

const RecipientViewPetitionFieldReplySelect = forwardRef<
  SelectInstance,
  RecipientViewPetitionFieldReplySelectProps
>(function RecipientViewPetitionFieldReplySelect(
  { field, reply, isDisabled, onUpdate, onDelete },
  ref,
) {
  const intl = useIntl();
  const [value, setValue] = useState(reply.content.value);
  const [isSaving, setIsSaving] = useState(false);

  const options = field.options as FieldOptions["SELECT"];
  const values = useMemo(
    () =>
      zip(options.values, options.labels ?? options.values).map(([value, label]) => ({
        value,
        label,
      })),
    [field.options],
  );

  const id = `reply-${field.id}${reply.parent ? `-${reply.parent.id}` : ""}-${reply.id}`;
  return (
    <Stack direction="row">
      <FormControl id={id} isDisabled={isDisabled}>
        <Box flex="1" position="relative" minWidth="0">
          <Box position="relative">
            <SimpleSelect
              ref={ref}
              data-testid="recipient-view-field-select-reply-select"
              isDisabled={isDisabled || reply.status === "APPROVED"}
              isInvalid={reply.status === "REJECTED"}
              value={value}
              options={values}
              onChange={async (value) => {
                setValue(value);
                setIsSaving(true);
                try {
                  await onUpdate(value);
                } catch {}
                setIsSaving(false);
              }}
              placeholder={
                reply.isAnonymized
                  ? intl.formatMessage({
                      id: "generic.reply-not-available",
                      defaultMessage: "Reply not available",
                    })
                  : (options.placeholder ??
                    intl.formatMessage({
                      id: "generic.select-an-option",
                      defaultMessage: "Select an option",
                    }))
              }
              styles={{
                menu: (styles) => ({ ...styles, zIndex: 100 }),
                valueContainer: (styles) => ({ ...styles, paddingInlineEnd: 32 }),
                placeholder: (base) => ({
                  ...base,
                  fontStyle: reply.isAnonymized ? "italic" : "normal",
                }),
              }}
            />
            <Center height="100%" position="absolute" insetEnd="42px" top={0}>
              <RecipientViewPetitionFieldReplyStatusIndicator reply={reply} isSaving={isSaving} />
            </Center>
          </Box>
        </Box>
      </FormControl>
      <IconButtonWithTooltip
        isDisabled={isDisabled || reply.status === "APPROVED"}
        onClick={() => onDelete()}
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
