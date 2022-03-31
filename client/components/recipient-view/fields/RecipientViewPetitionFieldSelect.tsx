import { Box, Center, List, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  SimpleOption,
  SimpleSelect,
  toSimpleSelectOption,
} from "@parallel/components/common/SimpleSelect";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { SelectInstance as _SelectInstance } from "react-select";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
  RecipientViewPetitionFieldCard_PetitionFieldReplySelection,
  RecipientViewPetitionFieldCard_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

export interface RecipientViewPetitionFieldSelectProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onUpdateReply: (replyId: string, value: string) => void;
  onCreateReply: (value: string) => Promise<string | undefined>;
}

type SelectInstance = _SelectInstance<SimpleOption, false>;

export function RecipientViewPetitionFieldSelect({
  field,
  isDisabled,
  isInvalid,
  onDownloadAttachment,
  onDeleteReply,
  onUpdateReply,
  onCreateReply,
  onCommentsButtonClick,
}: RecipientViewPetitionFieldSelectProps) {
  const intl = useIntl();

  const [showNewReply, setShowNewReply] = useState(field.replies.length === 0);
  const [value, setValue] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const newReplyRef = useRef<SelectInstance>(null);
  const replyRefs = useMultipleRefs<SelectInstance>();
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});

  const options = field.options as FieldOptions["SELECT"];
  const values = useMemo(
    () => options.values.map((option) => toSimpleSelectOption(option)!),
    [field.options]
  );

  const handleUpdate = useMemoFactory(
    (replyId: string) => async (value: string) => {
      await onUpdateReply(replyId, value);
    },
    [onUpdateReply]
  );

  const handleDelete = useMemoFactory(
    (replyId: string) => async () => {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
      if (field.replies.length === 1) {
        setShowNewReply(true);
      }
    },
    [field.replies, onDeleteReply]
  );

  function handleAddNewReply() {
    setShowNewReply(true);
    setTimeout(() => newReplyRef.current?.focus());
  }

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
        <List as={Stack} marginTop={1}>
          <AnimatePresence initial={false}>
            {field.replies.map((reply) => (
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
      {(field.multiple && showNewReply) || field.replies.length === 0 ? (
        <Box flex="1" position="relative" marginTop={2}>
          <SimpleSelect
            ref={newReplyRef as any}
            id={`reply-${field.id}-new`}
            isDisabled={isDisabled}
            value={value}
            options={values}
            onChange={async (value) => {
              setValue(value);
              setIsSaving(true);
              try {
                const replyId = await onCreateReply(value!);
                if (replyId) {
                  setShowNewReply(false);
                  setValue(null);
                  setTimeout(() => {
                    replyRefs[replyId].current?.focus();
                  });
                }
              } catch {}
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
              valueContainer: (styles) => ({ ...styles, paddingRight: 32 }),
            }}
          />
          <Center height="100%" position="absolute" right="42px" top={0}>
            <RecipientViewPetitionFieldReplyStatusIndicator isSaving={isSaving} />
          </Center>
        </Box>
      ) : null}
    </RecipientViewPetitionFieldCard>
  );
}

interface RecipientViewPetitionFieldReplySelectProps {
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  reply: RecipientViewPetitionFieldCard_PetitionFieldReplySelection;
  isDisabled: boolean;
  onUpdate: (content: string) => Promise<void>;
  onDelete: () => void;
}

const RecipientViewPetitionFieldReplySelect = forwardRef<
  SelectInstance,
  RecipientViewPetitionFieldReplySelectProps
>(function RecipientViewPetitionFieldReplySelect(
  { field, reply, isDisabled, onUpdate, onDelete },
  ref
) {
  const intl = useIntl();
  const [value, setValue] = useState(reply.content.value);
  const [isSaving, setIsSaving] = useState(false);

  const options = field.options as FieldOptions["SELECT"];

  const values = useMemo(
    () => options.values.map((option) => toSimpleSelectOption(option)!),
    [options.values]
  );

  return (
    <Stack direction="row">
      <Box flex="1" position="relative">
        <Box position="relative">
          <SimpleSelect
            ref={ref}
            id={`reply-${field.id}-${reply.id}`}
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
                    id: "component.recipient-view-petition-field-reply.not-available",
                    defaultMessage: "Reply not available",
                  })
                : options.placeholder ??
                  intl.formatMessage({
                    id: "generic.select-an-option",
                    defaultMessage: "Select an option",
                  })
            }
            styles={{
              menu: (styles) => ({ ...styles, zIndex: 100 }),
              valueContainer: (styles) => ({ ...styles, paddingRight: 32 }),
              placeholder: (base) => ({
                ...base,
                fontStyle: reply.isAnonymized ? "italic" : "normal",
              }),
            }}
          />
          <Center height="100%" position="absolute" right="42px" top={0}>
            <RecipientViewPetitionFieldReplyStatusIndicator reply={reply} isSaving={isSaving} />
          </Center>
        </Box>
      </Box>
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
