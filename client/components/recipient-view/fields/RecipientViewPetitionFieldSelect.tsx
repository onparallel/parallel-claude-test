import { Box, Center, List, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment } from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useRecipientViewReactSelectProps } from "@parallel/utils/react-select/hooks";
import { toSelectOption } from "@parallel/utils/react-select/toSelectOption";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useCreateSimpleReply, useDeletePetitionReply, useUpdateSimpleReply } from "./mutations";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyStatusIndicator } from "./RecipientViewPetitionFieldReplyStatusIndicator";

export interface RecipientViewPetitionFieldSelectProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  petitionId: string;
  isDisabled: boolean;
}

type SelectInstance = Select<{ label: string; value: string }, false, never>;

export function RecipientViewPetitionFieldSelect({
  petitionId,
  keycode,
  access,
  field,
  isDisabled,
  isInvalid,
  hasCommentsEnabled,
  onDownloadAttachment,
}: RecipientViewPetitionFieldSelectProps) {
  const intl = useIntl();

  const [showNewReply, setShowNewReply] = useState(field.replies.length === 0);
  const [value, setValue] = useState(toSelectOption(null));
  const [isSaving, setIsSaving] = useState(false);

  const newReplyRef = useRef<SelectInstance>(null);
  const replyRefs = useMultipleRefs<SelectInstance>();
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});

  const options = field.options as FieldOptions["SELECT"];

  const updateSimpleReply = useUpdateSimpleReply();

  const handleUpdate = useMemoFactory(
    (replyId: string) => async (value: string) => {
      await updateSimpleReply({ petitionId, replyId, keycode, value });
    },
    [keycode, updateSimpleReply]
  );
  const deleteReply = useDeletePetitionReply();
  const handleDelete = useMemoFactory(
    (replyId: string) => async () => {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await deleteReply({ petitionId, fieldId: field.id, replyId, keycode });
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
      if (field.replies.length === 1) {
        setShowNewReply(true);
      }
    },
    [keycode, field.id, field.replies, deleteReply]
  );

  const createSimpleReply = useCreateSimpleReply();

  async function handleOnChange(value: any) {
    setValue(value);
    setIsSaving(true);
    try {
      const reply = await createSimpleReply({
        petitionId,
        keycode,
        fieldId: field.id,
        value: value.value,
      });
      if (reply) {
        setShowNewReply(false);
        setValue(null);
        setTimeout(() => {
          replyRefs[reply.id].current?.focus();
        });
      }
    } catch {}
    setIsSaving(false);
  }

  function handleAddNewReply() {
    setShowNewReply(true);
    setTimeout(() => newReplyRef.current?.focus());
  }

  const rsProps = useRecipientViewReactSelectProps({
    id: `reply-${field.id}-new`,
    isDisabled,
  });

  const values = useMemo(() => options.values.map(toSelectOption), [options.values]);

  return (
    <RecipientViewPetitionFieldCard
      keycode={keycode}
      access={access}
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      showAddNewReply={!isDisabled && !showNewReply && field.multiple}
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
                  isDisabled={isDisabled || isDeletingReply[reply.id]}
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
          <Select
            {...rsProps}
            ref={newReplyRef as any}
            value={value}
            options={values as any}
            onChange={handleOnChange}
            placeholder={
              options.placeholder ??
              intl.formatMessage({
                id: "component.recipient-view-petition-field-reply.select-placeholder",
                defaultMessage: "Select an option",
              })
            }
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
  field: RecipientViewPetitionFieldSelectProps["field"];
  reply: RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
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
  const [value, setValue] = useState(toSelectOption(reply.content.text));
  const [isSaving, setIsSaving] = useState(false);

  const options = field.options as FieldOptions["SELECT"];
  const rsProps = useRecipientViewReactSelectProps({
    id: `reply-${field.id}-${reply.id}`,
    isDisabled: isDisabled || reply.status === "APPROVED",
    isInvalid: reply.status === "REJECTED",
  });

  const values = useMemo(() => options.values.map(toSelectOption), [options.values]);

  async function handleOnChange(value: any) {
    setValue(value);
    setIsSaving(true);
    try {
      await onUpdate(value.value);
    } catch {}
    setIsSaving(false);
  }

  return (
    <Stack direction="row">
      <Box flex="1" position="relative">
        <Box position="relative">
          <Select<{ label: string; value: string }, false, never>
            {...rsProps}
            ref={ref}
            value={value}
            options={values as any}
            onChange={handleOnChange}
            placeholder={
              options.placeholder ??
              intl.formatMessage({
                id: "generic.select-an-option",
                defaultMessage: "Select an option",
              })
            }
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
